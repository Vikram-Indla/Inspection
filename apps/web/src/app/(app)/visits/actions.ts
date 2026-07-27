"use server";
// W2/P2 — Visit Management bulk legs over selected child visits:
//   bulkRescheduleVisits (M02-007/031/033), bulkReassignVisits (M02-032),
//   bulkCancelVisits (M02-011/034), bulkEditVisits (M02-007).
// One server action per verb delegates the complete selection to a guarded
// atomic RPC. Every row is applied together or every row is blocked together;
// partial success is prohibited.
//
// CD-026 / SCR-WEB-200 Track 1 correction:
//   - Return a STRUCTURED per-item ledger (id + outcome enum), never a single
//     mixed-outcome string banner. The client renders the per-item outcome
//     ledger + a truthful summary (Applied / Blocked before change / Change
//     applied — notification not queued). A partial result is never a green
//     "success" banner.
//   - NEVER surface raw Supabase/Postgres/PostgREST/policy text. Provider
//     errors are logged server-side only and mapped to a neutral outcome code
//     the client translates.
//   - Guards, canonical transitions, per-item notification rows and the
//     append-only audit triggers are unchanged — only the reporting shape and
//     error neutralisation change.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getReasonOptions, validateReason } from "@/lib/planning/lifecycle";
import {
  classifyPlanningClosureError,
  parsePlanningBulkCommandStart,
  parsePlanningBulkReceipt,
  readPlanningVersions,
  type PlanningBulkReceipt,
  type PlanningClosureError,
} from "@/lib/planning/closure-receipts";

export type BulkVerb = "reschedule" | "reassign" | "cancel" | "edit";

// Per-item outcome codes. The client maps these to translated, neutral copy.
//   applied                 — mutation committed (+ notification queued where applicable)
//   applied_no_notification — mutation committed but the notification row could not be queued
//   blocked_not_publishable — per-item guard: no longer published/new, or RLS-denied (nothing changed)
//   blocked_started         — reassign guard: linked inspection already started (nothing changed)
//   blocked_no_assignment   — reassign: no assignment row to update, or RLS-denied (nothing changed)
//   error                   — provider error; nothing was reported as changed for this row (retry-safe)
export type OutcomeCode =
  | "applied"
  | "applied_no_notification"
  | "blocked_not_publishable"
  | "blocked_started"
  | "blocked_no_assignment"
  | "error";

export type ItemResult = { id: string; outcome: OutcomeCode };

// Pre-flight validation codes (neutral; translated on the client).
export type FormErrorCode =
  | "select_one"
  | "reason_required"
  | "reasons_unavailable"
  | "session"
  | "window_required"
  | "window_invalid"
  | "window_order"
  | "inspector_required"
  | "type_or_notes_required";

export type ActionResult = {
  verb?: BulkVerb;
  formErrorCode?: FormErrorCode;
  errorCode?: PlanningClosureError;
  requested?: number;
  items?: ItemResult[];
  receipt?: PlanningBulkReceipt;
};

function selectedIds(fd: FormData): string[] {
  return [...new Set(fd.getAll("visit_ids").map(v => String(v)).filter(v => UUID.test(v)))];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bounded = (fd: FormData, key: string, max = 1000) =>
  String(fd.get(key) ?? "").trim().slice(0, max);

function requestIdentity(fd: FormData) {
  const idempotencyKey = bounded(fd, "idempotency_key", 200);
  const correlationId = bounded(fd, "correlation_id", 36);
  return {
    idempotencyKey,
    correlationId: UUID.test(correlationId) ? correlationId : "",
    valid: /^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey) && UUID.test(correlationId),
  };
}

function mutationContext(fd: FormData) {
  const identity = requestIdentity(fd);
  const reason = bounded(fd, "mutation_reason");
  return { ...identity, reason, valid: identity.valid && !!reason };
}

function atomicLedger(
  verb: BulkVerb,
  ids: string[],
  error: { message?: string; code?: string } | null,
  receipt: unknown,
  correlationId: string,
): ActionResult {
  if (!error && isCompleteAtomicReceipt(receipt, verb, ids, correlationId)) {
    return { verb, requested: ids.length, items: ids.map(id => ({ id, outcome: "applied" })) };
  }
  if (!error) {
    console.error(`[visits.bulk.${verb}] atomic mutation returned an invalid receipt`);
    return {
      verb,
      requested: ids.length,
      items: ids.map(id => ({ id, outcome: "error" })),
    };
  }
  console.error(`[visits.bulk.${verb}] atomic mutation failed: ${error.message ?? "unknown"} (${error.code ?? "unknown"})`);
  const blocked = /PLANNING-MUTATION-(SAME-PLAN|STATE|TARGET-NOT-FOUND|DENIED)|PLANNING-(RESCHEDULE-CONFLICT|REASSIGN-(INSPECTOR|AMBIGUOUS|CONFLICT)|CANCEL-REASON|EDIT-VISIT-TYPE)/.test(error.message ?? "");
  return {
    verb,
    requested: ids.length,
    items: ids.map(id => ({ id, outcome: blocked ? "blocked_not_publishable" : "error" })),
  };
}

function isCompleteAtomicReceipt(receipt: unknown, verb: BulkVerb, ids: string[], correlationId: string): boolean {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return false;
  const value = receipt as Record<string, unknown>;
  if (value.operation !== verb || value.updated_count !== ids.length || value.correlation_id !== correlationId) {
    return false;
  }
  if (!Array.isArray(value.visit_ids) || value.visit_ids.length !== ids.length) return false;
  const expected = [...ids].sort();
  const returned = value.visit_ids.map(String).sort();
  return expected.every((id, index) => id === returned[index]);
}

async function runFrozenBulkCommand(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  operation: "cancel" | "reschedule",
  ids: string[],
  payload: Record<string, unknown>,
  idempotencyKey: string,
  correlationId: string,
): Promise<ActionResult> {
  const frozenIds = [...ids].sort();
  const versionRead = await readPlanningVersions(sb, frozenIds);
  if (!versionRead.versions) {
    return {
      verb: operation,
      requested: frozenIds.length,
      errorCode: versionRead.error ?? "service_error",
      items: frozenIds.map(id => ({ id, outcome: "error" })),
    };
  }
  const { data: startData, error: startError } = await sb.rpc("create_planning_bulk_command", {
    p_operation: operation,
    p_visit_ids: frozenIds,
    p_expected_versions: versionRead.versions,
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (startError) {
    console.error(`[visits.bulk.${operation}] create command failed:`, startError.message, startError.code);
    return {
      verb: operation,
      requested: frozenIds.length,
      errorCode: classifyPlanningClosureError(startError),
      items: frozenIds.map(id => ({ id, outcome: "error" })),
    };
  }
  const start = parsePlanningBulkCommandStart(startData);
  if (!start) {
    console.error(`[visits.bulk.${operation}] invalid command-start receipt`);
    return {
      verb: operation,
      requested: frozenIds.length,
      errorCode: "receipt_invalid",
      items: frozenIds.map(id => ({ id, outcome: "error" })),
    };
  }

  let targetCount = start.targetCount;
  if (targetCount == null) {
    const { data: existingData, error: existingError } = await sb.rpc(
      "planning_bulk_command_receipt",
      { p_command_id: start.commandId },
    );
    const existing = existingError ? null : parsePlanningBulkReceipt(existingData);
    targetCount = existing?.targetCount ?? null;
  }
  if (targetCount !== frozenIds.length) {
    console.error(`[visits.bulk.${operation}] frozen command inventory mismatch`);
    return {
      verb: operation,
      requested: frozenIds.length,
      errorCode: "receipt_invalid",
      items: frozenIds.map(id => ({ id, outcome: "error" })),
    };
  }

  const items: ItemResult[] = [];
  let prior: PlanningBulkReceipt | null = null;
  for (let ordinal = 1; ordinal <= targetCount; ordinal += 1) {
    const { data, error } = await sb.rpc("process_planning_bulk_target", {
      p_command_id: start.commandId,
      p_target_ordinal: ordinal,
    });
    if (error) {
      const errorCode = classifyPlanningClosureError(error);
      console.error(`[visits.bulk.${operation}] target ${ordinal} unresolved:`, error.message, error.code);
      items.push({
        id: frozenIds[ordinal - 1],
        outcome: ["cutoff_blocked", "conflict", "state_blocked", "unauthorized"].includes(errorCode)
          ? "blocked_not_publishable"
          : "error",
      });
      continue;
    }
    const current = parsePlanningBulkReceipt(data);
    if (!current || current.commandId !== start.commandId) {
      items.push({ id: frozenIds[ordinal - 1], outcome: "error" });
      continue;
    }
    const appliedDelta = current.appliedCount - (prior?.appliedCount ?? 0);
    const blockedDelta = current.blockedCount - (prior?.blockedCount ?? 0);
    items.push({
      id: frozenIds[ordinal - 1],
      outcome: appliedDelta > 0 ? "applied" : blockedDelta > 0 ? "blocked_not_publishable" : "error",
    });
    prior = current;
  }
  const { data: finalData, error: finalError } = await sb.rpc("planning_bulk_command_receipt", {
    p_command_id: start.commandId,
  });
  const receipt = finalError ? null : parsePlanningBulkReceipt(finalData);
  if (finalError) console.error(`[visits.bulk.${operation}] receipt read failed:`, finalError.message, finalError.code);
  return {
    verb: operation,
    requested: frozenIds.length,
    items,
    receipt: receipt ?? undefined,
    errorCode: receipt ? undefined : "receipt_invalid",
  };
}

// M02-011/034 + M8 — bulk cancel: one mandatory GOVERNED reason key (active
// planning_lookups cancellation_reason; 'other' requires comments — validated
// once up front, PLN-CON-011); only rows still published/new cancel (same
// guard as cancelVisit); inspectors notified; every cancelled row appends a
// lifecycle 'cancel' event with its prior inspector/window snapshot. The
// per-item ledger never turns a lifecycle-stream write failure into a false
// "applied": a committed cancel whose event could not be written is reported
// as applied_no_notification (committed-with-a-gap), never as a clean apply.
export async function bulkCancelVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { verb: "cancel", formErrorCode: "session" };
  const ids = selectedIds(fd);
  const reasonKey = String(fd.get("reason_key") ?? "").trim();
  const comments = String(fd.get("comments") ?? "").trim();
  if (ids.length === 0) return { verb: "cancel", formErrorCode: "select_one" };
  const { options, error: optErr } = await getReasonOptions(sb, "cancellation_reason");
  if (optErr) return { verb: "cancel", formErrorCode: "reasons_unavailable" };
  if (validateReason(options, reasonKey, comments, "cancellation")) return { verb: "cancel", formErrorCode: "reason_required" };
  const ctx = requestIdentity(fd);
  if (!ctx.valid) return { verb: "cancel", formErrorCode: "reason_required" };
  const result = await runFrozenBulkCommand(
    sb,
    "cancel",
    ids,
    { note: comments ? `${reasonKey} — ${comments}` : reasonKey },
    ctx.idempotencyKey,
    ctx.correlationId,
  );
  revalidatePath("/visits");
  revalidatePath("/planning/visits");
  return result;
}

// M02-007/031/033 — bulk reschedule window: shared new window applied to every
// selected row that still passes the published/new guard (M02-008 semantics).
// NOTE (HANDOFF_BLOCKED_GUARD): post-move Inspector-overlap recheck is a
// separate authorized backend leg and is intentionally NOT synthesised here.
export async function bulkRescheduleVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { verb: "reschedule", formErrorCode: "session" };
  const ids = selectedIds(fd);
  const ws = String(fd.get("window_start") ?? "").trim();
  const we = String(fd.get("window_end") ?? "").trim();
  if (ids.length === 0) return { verb: "reschedule", formErrorCode: "select_one" };
  if (!ws || !we) return { verb: "reschedule", formErrorCode: "window_required" };
  const start = new Date(ws); const end = new Date(we);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { verb: "reschedule", formErrorCode: "window_invalid" };
  if (end.getTime() <= start.getTime()) return { verb: "reschedule", formErrorCode: "window_order" };
  const ctx = mutationContext(fd);
  if (!ctx.valid) return { verb: "reschedule", formErrorCode: "reason_required" };
  const result = await runFrozenBulkCommand(
    sb,
    "reschedule",
    ids,
    { window_start: start.toISOString(), window_end: end.toISOString(), note: ctx.reason },
    ctx.idempotencyKey,
    ctx.correlationId,
  );
  revalidatePath("/visits");
  revalidatePath("/planning/visits");
  return result;
}

// Bulk Edit Visits (Excel row: Visit Type / Location / Notes) — the existing
// bulk actions only covered reschedule/reassign/cancel; type and notes had
// no bulk path at all. Location is intentionally out of scope here (same
// reason single-visit Edit Visit doesn't cover it — location changes need
// the map/pin re-confirmation flow, not a blind bulk overwrite).
// NOTE (HANDOFF_BLOCKED_GUARD): the same-Plan bulk-edit enforcement is a
// separate authorized backend leg. The client preview shows the same-Plan
// eligibility and disables the control across plans; this action still applies
// its own per-item published/new guard.
export async function bulkEditVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { verb: "edit", formErrorCode: "session" };
  const ids = selectedIds(fd);
  const visitType = String(fd.get("visit_type") ?? "").trim();
  const notesRaw = String(fd.get("notes") ?? "");
  const setNotes = fd.get("set_notes") === "1"; // explicit opt-in so "leave notes alone" is the default
  if (ids.length === 0) return { verb: "edit", formErrorCode: "select_one" };
  if (!visitType && !setNotes) return { verb: "edit", formErrorCode: "type_or_notes_required" };
  const ctx = mutationContext(fd);
  if (!ctx.valid) return { verb: "edit", formErrorCode: "reason_required" };
  const { data, error } = await sb.rpc("edit_published_visits_atomic", {
    p_visit_ids: ids,
    p_visit_type: visitType || null,
    p_notes: setNotes ? (notesRaw.trim() || null) : null,
    p_change_notes: setNotes,
    p_reason: ctx.reason,
    p_idempotency_key: ctx.idempotencyKey,
    p_correlation_id: ctx.correlationId,
  });
  revalidatePath("/visits");
  revalidatePath("/planning/visits");
  return atomicLedger("edit", ids, error, data, ctx.correlationId);
}

// M02-032 — bulk reassign inspector: per-row pre-start lock (same as
// reassignVisit), assignment update, new inspector notified per visit.
export async function bulkReassignVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { verb: "reassign", formErrorCode: "session" };
  const ids = selectedIds(fd);
  const inspector = String(fd.get("inspector_id") ?? "");
  if (ids.length === 0) return { verb: "reassign", formErrorCode: "select_one" };
  if (!inspector) return { verb: "reassign", formErrorCode: "inspector_required" };
  const ctx = mutationContext(fd);
  if (!ctx.valid) return { verb: "reassign", formErrorCode: "reason_required" };
  const { data, error } = await sb.rpc("reassign_published_visits_atomic", {
    p_visit_ids: ids,
    p_inspector_id: inspector,
    p_reason: ctx.reason,
    p_idempotency_key: ctx.idempotencyKey,
    p_correlation_id: ctx.correlationId,
  });
  revalidatePath("/visits");
  revalidatePath("/planning/visits");
  return atomicLedger("reassign", ids, error, data, ctx.correlationId);
}
