"use server";
// SB05 — Visit Management write legs: cancel (M02-006), reschedule (M02-008), reassign (M02-009/ENG-05)
// M8 / PLN-CON-011 — lifecycle normalization:
//   • returnVisit NO LONGER encodes the reason in a notes prefix (it destroyed
//     prior planner notes). Reasons are governed planning_lookups keys with
//     conditional comments, and every transition appends a
//     visit_lifecycle_events row carrying the prior-state snapshot.
//   • cancelVisit / rescheduleVisit accept the RETURNED state (canonical §15:
//     a returned visit may be re-windowed or cancelled) and record events.
//   • republishVisit / reassignVisit record their events too — the stream is
//     the single per-visit lifecycle history (append-only by RLS).
//   • duplicateVisit (PLN-REQ-011) clones a FINAL visit into a safe new draft.
//   • repackageVisit swaps the primary checklist of a returned visit.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { insertNotification } from "@/lib/notify";
import { getReasonOptions, recordLifecycleEvent, validateReason } from "@/lib/planning/lifecycle";
import { mapError } from "./neutral";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { error?: string; ok?: string; planId?: string; method?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type TransitionOperation = "return" | "republish" | "repackage" | "metadata";

async function callPlanningTransition(
  sb: SupabaseClient,
  fd: FormData,
  operation: TransitionOperation,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const visitId = String(fd.get("visit_id") ?? "");
  const expectedVersion = Number(fd.get("expected_version"));
  const idempotencyKey = String(fd.get("idempotency_key") ?? "").trim();
  const correlationId = String(fd.get("correlation_id") ?? "").trim();
  if (!UUID.test(visitId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
      || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey) || !UUID.test(correlationId)) {
    return "The Planning request is incomplete. Refresh before trying again.";
  }
  const { data, error } = await sb.rpc("transition_planning_visit_atomic", {
    p_visit_id: visitId,
    p_operation: operation,
    p_payload: payload,
    p_expected_version: expectedVersion,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error(`[planning.${operation}] governed mutation failed:`, error.code, error.message);
    if (error.code === "42501") return "You do not have permission or scope for this Planning action. Nothing was changed.";
    if (error.code === "40001") return "This visit changed after the page loaded. Refresh before trying again.";
    if (error.code === "23514") return "This Planning action is blocked by the current state or governed configuration.";
    if (error.code === "23505") return "This retry does not match the original Planning request. Nothing was changed.";
    return "The Planning action could not be completed (ERR-OPS-001). Nothing was changed.";
  }
  const receipt = data as {
    operation?: string; visit_id?: string; post_version?: number;
    correlation_id?: string; audit_event_id?: number; outbox_intent_id?: string;
  } | null;
  if (receipt?.operation !== operation || receipt.visit_id !== visitId
      || receipt.correlation_id !== correlationId || !receipt.post_version
      || !receipt.audit_event_id || !receipt.outbox_intent_id) {
    return "The Planning result could not be verified. Refresh before retrying.";
  }
  return null;
}

// M02-041 — notify the visit's assigned inspector (single insert path; ENG-11).
// Best-effort: the primary state change already committed, so a failed
// notification is surfaced but never rolls the transition back.
async function notifyAssignedInspector(
  sb: SupabaseClient, visitId: string, event_key: string, payload: Record<string, unknown>,
): Promise<string | null> {
  const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", visitId).maybeSingle();
  if (!asg?.inspector_id) return null;
  const r = await insertNotification(sb, {
    event_key, recipient: asg.inspector_id, payload: { visit_id: visitId, ...payload }, channel: "push",
  });
  return r.error ?? null;
}

// Planning changes lock once the linked inspection has started (M02-006 guard)
async function guardPreStart(visitId: string) {
  const sb = await supabaseServer();
  const { data: ins } = await sb.from("inspections").select("status").eq("visit_id", visitId).maybeSingle();
  if (ins && ins.status !== "not_started") return `Inspection already ${ins.status} — planning changes locked (M02-006)`;
  return null;
}

// Cancel/reschedule window: only planning_status='published' AND operational_state='new' (M02-006 / M02-008)
async function guardPublishedNew(visitId: string): Promise<string | null> {
  const sb = await supabaseServer();
  const { data: v, error } = await sb.from("visits").select("planning_status, operational_state").eq("id", visitId).maybeSingle();
  if (error) return mapError(error, "load");
  if (!v) return "Visit not found or outside your scope (RLS)";
  if (v.planning_status !== "published" || v.operational_state !== "new")
    return `Allowed only while published / new — visit is ${v.planning_status} / ${v.operational_state.replace(/_/g, " ")}`;
  return null;
}

// M8 — published OR returned, still pre-execution (canonical §15: a returned
// visit may be re-windowed, repackaged or cancelled). Same new-only boundary.
async function guardPublishedOrReturnedNew(visitId: string): Promise<string | null> {
  const sb = await supabaseServer();
  const { data: v, error } = await sb.from("visits").select("planning_status, operational_state").eq("id", visitId).maybeSingle();
  if (error) return mapError(error, "load");
  if (!v) return "Visit not found or outside your scope (RLS)";
  if (!["published", "returned"].includes(v.planning_status) || v.operational_state !== "new")
    return `Allowed only while published or returned / new — visit is ${v.planning_status} / ${v.operational_state.replace(/_/g, " ")}`;
  return null;
}

// Prior-state snapshot carried by every lifecycle event (canonical §15).
async function previousSnapshot(sb: SupabaseClient, visitId: string) {
  const { data: v } = await sb.from("visits").select("planning_status, window_start, window_end").eq("id", visitId).maybeSingle();
  const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", visitId).maybeSingle();
  return {
    planning_status: v?.planning_status ?? null,
    inspector_id: asg?.inspector_id ?? null,
    window_start: v?.window_start ?? null,
    window_end: v?.window_end ?? null,
  };
}

export async function returnVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const reasonKey = String(fd.get("reason_key") ?? "").trim();
  const comments = String(fd.get("comments") ?? "").trim();
  // PLN-CON-011 — governed reason: the key must be an active planning_lookups
  // return_reason; 'other' (and any comments_required key) demands comments.
  const { options, error: optErr } = await getReasonOptions(sb, "return_reason");
  if (optErr) return { error: "Return reasons are temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  const bad = validateReason(options, reasonKey, comments, "return");
  if (bad) return { error: bad };
  const transitionError = await callPlanningTransition(sb, fd, "return", {
    reason_key: reasonKey,
    comments: comments || null,
  });
  if (transitionError) return { error: transitionError };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Returned atomically — lifecycle, audit and notification intent recorded (PLN-CON-011 · M02-041)." };
}

export async function republishVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const transitionError = await callPlanningTransition(sb, fd, "republish", {});
  if (transitionError) return { error: transitionError };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Republished atomically — same Visit ID retained; audit and notification intent recorded (M02-009)." };
}

// M02-006 + PLN-R02/R03 — Planning cancellation accepts one optional note,
// never requires a governed reason lookup, and commits state + lifecycle +
// audit + outbox intent atomically through the Planning closure RPC.
export async function cancelVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) return { error: "Planning data could not be verified (ERR-OPS-001). Nothing was changed." };
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const expectedVersion = Number(fd.get("expected_version"));
  const idempotencyKey = String(fd.get("idempotency_key") ?? "").trim();
  const correlationId = String(fd.get("correlation_id") ?? "").trim();
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!UUID.test(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1
      || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey) || !UUID.test(correlationId)) {
    return { error: "The cancellation request is incomplete. Nothing was changed." };
  }
  const { data, error } = await sb.rpc("cancel_planning_visits_atomic", {
    p_visit_ids: [id],
    p_expected_versions: { [id]: expectedVersion },
    p_note: note,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[planning.cancelVisit] governed mutation failed:", error.code, error.message);
    if (error.code === "42501") return { error: "You do not have permission or scope to cancel this visit. Nothing was changed." };
    if (error.code === "40001") return { error: "This visit changed after the page loaded. Refresh before trying again." };
    if (error.code === "23514") return { error: "Cancellation is blocked by the current state or governed cutoff. Nothing was changed." };
    if (error.code === "23505") return { error: "This retry does not match the original cancellation request. Nothing was changed." };
    return { error: "The visit could not be cancelled (ERR-OPS-001). Nothing was changed." };
  }
  const receipt = data as {
    operation?: string; updated_count?: number; visit_ids?: string[];
    correlation_id?: string; rows?: { post_version?: number; audit_event_id?: number; outbox_intent_id?: string }[];
  } | null;
  if (receipt?.operation !== "cancel" || receipt.updated_count !== 1
      || receipt.correlation_id !== correlationId || receipt.visit_ids?.[0] !== id
      || !receipt.rows?.[0]?.post_version || !receipt.rows[0].audit_event_id
      || !receipt.rows[0].outbox_intent_id) {
    console.error("[planning.cancelVisit] incomplete governed receipt");
    return { error: "The cancellation result could not be verified. Refresh before retrying." };
  }
  revalidatePath(`/visits/${id}`); revalidatePath(`/planning/visits/${id}`);
  revalidatePath("/visits"); revalidatePath("/planning/visits");
  return { ok: "Visit cancelled atomically — audit and notification intent recorded (M02-006 · M02-041)." };
}

// M02-008 + M8 — Reschedule window: published/new OR returned/new (a returned
// visit may be re-windowed, canonical §15), end after start (server-side).
export async function rescheduleVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) return { error: "Planning data could not be verified (ERR-OPS-001). Nothing was changed." };
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const expectedVersion = Number(fd.get("expected_version"));
  const idempotencyKey = String(fd.get("idempotency_key") ?? "").trim();
  const correlationId = String(fd.get("correlation_id") ?? "").trim();
  const ws = String(fd.get("window_start") ?? "").trim(); const we = String(fd.get("window_end") ?? "").trim();
  if (!ws || !we) return { error: "Both new window start and end are required (M02-008)" };
  const start = new Date(ws); const end = new Date(we);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: "Invalid date/time values (M02-008)" };
  if (end.getTime() <= start.getTime()) return { error: "Window end must be after window start (M02-008)" };
  if (!UUID.test(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1
      || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey) || !UUID.test(correlationId)) {
    return { error: "The reschedule request is incomplete. Nothing was changed." };
  }
  const { data, error } = await sb.rpc("reschedule_planning_visits_atomic", {
    p_visit_ids: [id],
    p_window_start: start.toISOString(),
    p_window_end: end.toISOString(),
    p_expected_versions: { [id]: expectedVersion },
    p_note: null,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[planning.rescheduleVisit] governed mutation failed:", error.code, error.message);
    if (error.code === "42501") return { error: "You do not have permission or scope to reschedule this visit. Nothing was changed." };
    if (error.code === "40001") return { error: "This visit changed after the page loaded. Refresh before trying again." };
    if (error.code === "23514") return { error: "Rescheduling is blocked by the current state or governed cutoff. Nothing was changed." };
    if (error.code === "23505") return { error: "This retry does not match the original reschedule request. Nothing was changed." };
    return { error: "The visit could not be rescheduled (ERR-OPS-001). Nothing was changed." };
  }
  const receipt = data as {
    operation?: string; updated_count?: number; visit_ids?: string[];
    correlation_id?: string; rows?: { post_version?: number; audit_event_id?: number; outbox_intent_id?: string }[];
  } | null;
  if (receipt?.operation !== "reschedule" || receipt.updated_count !== 1
      || receipt.correlation_id !== correlationId || receipt.visit_ids?.[0] !== id
      || !receipt.rows?.[0]?.post_version || !receipt.rows[0].audit_event_id
      || !receipt.rows[0].outbox_intent_id) {
    console.error("[planning.rescheduleVisit] incomplete governed receipt");
    return { error: "The reschedule result could not be verified. Refresh before retrying." };
  }
  revalidatePath(`/visits/${id}`); revalidatePath(`/planning/visits/${id}`);
  revalidatePath("/visits"); revalidatePath("/planning/visits");
  return { ok: "Window rescheduled atomically — audit and notification intent recorded (M02-008 · M02-041)." };
}

// FIX WAVE F4 · M02-042 — visit attachments: upload to private bucket 'attachments'
// then register the row; RLS va_insert (planner/ops) + storage policy are the
// authority — any rejection is surfaced verbatim.
export async function uploadVisitAttachment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const visitId = String(fd.get("visit_id") ?? "");
  const file = fd.get("file");
  if (!visitId) return { error: "Missing visit id (M02-042)" };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first (M02-042)" };
  const mime = file.type || "application/octet-stream";
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(-120);
  const path = `${visitId}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await sb.storage.from("attachments").upload(path, bytes, { contentType: mime });
  if (up.error) return { error: mapError(up.error, "upload") };
  const { error } = await sb.from("visit_attachments").insert({
    visit_id: visitId, name: file.name, mime, storage_path: path, uploaded_by: user.id,
  });
  // HANDOFF_BLOCKED_ORPHAN closure — the object landed in storage but the row
  // did not register. Compensate by removing the just-uploaded object so no
  // orphaned, un-listed, un-audited file is left behind, then report neutrally.
  // Best-effort: if cleanup itself fails the object is still unreferenced (RLS
  // hides it from every listing), so the failure is not surfaced to the user.
  if (error) {
    await sb.storage.from("attachments").remove([path]);
    return { error: mapError(error, "upload") };
  }
  revalidatePath(`/visits/${visitId}`);
  return { ok: `Attachment "${file.name}" uploaded (M02-042, audited)` };
}

// M02-042 — soft delete: removed_at set, row and file retained (audit-safe).
export async function removeVisitAttachment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const attachmentId = String(fd.get("attachment_id") ?? "");
  const visitId = String(fd.get("visit_id") ?? "");
  if (!attachmentId) return { error: "Missing attachment id (M02-042)" };
  const { data: updated, error } = await sb.from("visit_attachments")
    .update({ removed_at: new Date().toISOString(), removed_by: user.id })
    .eq("id", attachmentId).is("removed_at", null)
    .select("id");
  if (error) return { error: mapError(error, "update") };
  if (!updated?.length) return { error: "No row updated — already removed, or RLS denied (va_update requires planner/ops)" };
  revalidatePath(`/visits/${visitId}`);
  return { ok: "Attachment removed — soft delete, file and audit trail retained (M02-042)" };
}

// M02-043 — add/edit visit notes: plain guarded update on visits.notes;
// RLS visits_update (planner/ops) is the authority. Empty input clears notes.
// M8 — return flows NO LONGER write here; notes belong to the planner alone.
export async function updateVisitNotes(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id") ?? "");
  const notes = String(fd.get("notes") ?? "").trim();
  if (!id) return { error: "Missing visit id (M02-043)" };
  const { data: updated, error } = await sb.from("visits")
    .update({ notes: notes || null })
    .eq("id", id)
    .select("id");
  if (error) return { error: mapError(error, "update") };
  if (!updated?.length) return { error: "No row updated — RLS denied (visits_update requires planner/ops)" };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Notes saved (M02-043, audited)" };
}

// M02-006 — edit visit type: only before execution starts and only while the
// visit is still published/new (same lock the cancel/reschedule legs enforce, so
// a visit that is already on-the-way/arrived/executing can never have its type
// changed underneath the field app). Reference values only.
const VISIT_TYPES = ["periodic", "follow_up", "complaint"] as const;
export async function updateVisitType(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id"));
  const visit_type = String(fd.get("visit_type") ?? "");
  if (!(VISIT_TYPES as readonly string[]).includes(visit_type))
    return { error: "Choose a valid visit type (M02-006)" };
  // pre-start lock first (execution owns the visit once started), then state guard.
  const locked = await guardPreStart(id);
  if (locked) return { error: `Visit-type change blocked: ${locked}` };
  const guard = await guardPublishedNew(id);
  if (guard) return { error: `Visit-type change blocked: ${guard} (M02-006)` };
  const { data: updated, error } = await sb.from("visits")
    .update({ visit_type })
    .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
    .select("id");
  if (error) return { error: mapError(error, "update") };
  if (!updated?.length) return { error: "No row updated — state changed concurrently or RLS denied the update (visits_update requires planner/ops)" };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Visit type updated — pre-start only, audited (M02-006)" };
}

// M02-009 / ENG-05 + M8 — Reassign inspector: updates assignments.inspector_id,
// notifies new inspector, records the lifecycle event with the prior holder.
export async function reassignVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id")); const inspector = String(fd.get("inspector_id") ?? "");
  if (!inspector) return { error: "Select an inspector (M02-009)" };
  const locked = await guardPreStart(id);
  if (locked) return { error: `Reassignment blocked: ${locked}` };
  // HANDOFF_BLOCKED_NOTIFY_PREV closure — capture who currently holds the
  // assignment BEFORE the update so the outgoing inspector can be told they were
  // unassigned. Reuses the existing REF-014 "assignment" event + inapp channel;
  // no new notification policy is invented.
  const { data: prevAsg } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
  const prevInspector = prevAsg?.inspector_id ?? null;
  const { data: updated, error } = await sb.from("assignments")
    .update({ inspector_id: inspector, method: "manual", status: "assigned" })
    .eq("visit_id", id).select("id");
  if (error) return { error: mapError(error, "update") };
  if (!updated?.length) return { error: "No assignment updated — none exists for this visit or RLS denied the update (assignments_update requires planner/ops)" };
  const evErr = await recordLifecycleEvent(sb, {
    visitId: id, eventType: "reassign", actor: user.id, previous: { inspector_id: prevInspector },
  });
  // notify the NEW inspector (primary), then best-effort notify the PREVIOUS one.
  const { error: nErr } = await sb.from("notifications").insert({ event_key: "assignment", recipient: inspector, payload: { visit_id: id, reassigned: true }, channel: "push" });
  if (prevInspector && prevInspector !== inspector) {
    await insertNotification(sb, { event_key: "assignment", recipient: prevInspector, payload: { visit_id: id, released: true } });
  }
  revalidatePath(`/visits/${id}`);
  if (evErr) return { error: "Reassigned, but the lifecycle record could not be written — the gap is logged (PLN-CON-011)" };
  if (nErr) return { error: "Reassigned, but the new-inspector notification could not be queued (M02-009 / ENG-05)" };
  const prevNote = prevInspector && prevInspector !== inspector ? "; previous inspector unassignment queued" : "";
  return { ok: `Reassigned — new inspector notification queued (not confirmed delivered)${prevNote} (M02-009 / ENG-05)` };
}

// M8 / PLN-REQ-011 — Duplicate a FINAL visit (cancelled / expired) into a safe
// new Draft. Copies ONLY eligible planning fields (factory target, visit type,
// mode, priority, window, packages, notes) — never IDs, execution state,
// operational_state, submitted evidence, review decisions or immutable
// downstream versions. The new draft plan carries the config in the canonical
// resume shape of its method and gets a linked draft visit; the SOURCE visit
// records the 'duplicate' lifecycle event naming the new draft.
// Route choice (documented): single-method sources (and immediate visits,
// which have no plan) continue at /planning/single?plan=<newId> — the
// immediate flow (OTP + required package) is a different contract, so an
// immediate duplicate becomes a standard single draft. Bulk-method sources
// continue at /planning/bulk/review?plan=<newId> with a one-factory working
// set (a duplicate is by definition a single target; targeting criteria are
// not cloned).
export async function duplicateVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const { data: src, error } = await sb.from("visits")
    .select("id, factory_id, visit_type, execution_mode, priority, window_start, window_end, notes, package_version_id, planning_status, visit_plans(method)")
    .eq("id", id).maybeSingle();
  if (error) return { error: mapError(error, "load") };
  if (!src) return { error: "Visit not found or outside your scope (RLS)" };
  if (!["cancelled", "expired"].includes(src.planning_status))
    return { error: `Duplicate produces a new Draft from a final visit (cancelled / expired) — this visit is ${src.planning_status}; active visits are edited in place (PLN-REQ-011)` };
  const { data: pkgLinks } = await sb.from("visit_packages").select("package_version_id").eq("visit_id", id);
  const packageIds = [...new Set([src.package_version_id, ...(pkgLinks ?? []).map(p => p.package_version_id as string)].filter(Boolean))] as string[];
  const method = (src.visit_plans as unknown as { method: string } | null)?.method ?? "single";
  const notes = typeof src.notes === "string" && !src.notes.startsWith("RETURNED: ") ? src.notes : (src.notes ?? "");
  const draftPayload = method === "bulk"
    ? {
        selection: [src.factory_id],
        config: {
          picks: {}, package_version_ids: packageIds,
          window_start: src.window_start, window_end: src.window_end,
          notes, priority: src.priority ?? "",
        },
        acknowledged: false,
        duplicated_from: src.id,
      }
    : {
        target: { factory_id: src.factory_id },
        config: {
          visit_type: src.visit_type, package_version_ids: packageIds,
          execution_mode: src.execution_mode,
          window_start: src.window_start, window_end: src.window_end,
          notes, priority: src.priority ?? "",
        },
        duplicated_from: src.id,
      };
  const { data: plan, error: pErr } = await sb.from("visit_plans")
    .insert({ method, status: "draft", created_by: user.id, draft_payload: draftPayload, draft_version: 1, source_channel: "web" })
    .select("id").single();
  if (pErr) {
    console.error("[M8 duplicateVisit] plan insert failed:", pErr.message);
    return { error: mapError(pErr, "update") };
  }
  const { data: draftVisit, error: vErr } = await sb.from("visits")
    .insert({
      visit_plan_id: plan.id, factory_id: src.factory_id,
      visit_type: src.visit_type, execution_mode: src.execution_mode,
      planning_status: "draft",
      window_start: src.window_start, window_end: src.window_end,
      package_version_id: packageIds[0] ?? null,
      priority: src.priority ?? null, notes: notes || null, source_channel: "web",
    })
    .select("id").single();
  if (vErr) {
    console.error("[M8 duplicateVisit] draft visit insert failed:", vErr.message);
    // Compensate: archive the just-created plan so no orphaned, unresumable
    // draft plan is left behind (best-effort, mirrors the ORPHAN pattern).
    await sb.from("visit_plans").update({ archived_at: new Date().toISOString() }).eq("id", plan.id);
    return { error: mapError(vErr, "update") };
  }
  const evErr = await recordLifecycleEvent(sb, {
    visitId: src.id, eventType: "duplicate", actor: user.id,
    previous: { planning_status: src.planning_status, duplicated_to_plan: plan.id, duplicated_to_visit: draftVisit.id },
  });
  revalidatePath(`/visits/${id}`); revalidatePath("/planning");
  if (evErr) return { error: "Draft created, but the duplicate record on the source visit could not be written — the gap is logged (PLN-REQ-011)" };
  return { ok: "Duplicated into a new Draft — planning fields only; execution state, evidence and review decisions were not copied (PLN-REQ-011)", planId: plan.id, method };
}

// M8 — Repackage a RETURNED visit (canonical §15: returned visits may be
// repackaged): swap the PRIMARY checklist and add any missing visit_packages
// link with a fresh immutable snapshot. Links are never removed (the
// visit_packages RLS grants no delete — the link history stays additive and
// the primary marker carries the current truth; removal needs a definer RPC
// and is a documented gap). Returned+new only, pre-start.
export async function repackageVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const pkgId = String(fd.get("package_version_id") ?? "").trim();
  if (!pkgId) return { error: "Choose an inspection checklist (PLN-CON-003)" };
  const locked = await guardPreStart(id);
  if (locked) return { error: `Repackage blocked: ${locked}` };
  const today = new Date().toISOString().slice(0, 10);
  const { data: pv, error: pvErr } = await sb.from("package_versions")
    .select("id, version_label, status, packages(code, title)")
    .eq("id", pkgId).in("status", ["published", "locked"])
    .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`)
    .maybeSingle();
  if (pvErr) return { error: mapError(pvErr, "load") };
  if (!pv) return { error: "Choose an active inspection checklist (PLN-CON-003)" };
  const { data: updated, error } = await sb.from("visits")
    .update({ package_version_id: pkgId })
    .eq("id", id).eq("planning_status", "returned").eq("operational_state", "new")
    .select("id");
  if (error) return { error: mapError(error, "update") };
  if (!updated?.length) return { error: "No row updated — repackage is available only for returned / new visits, or RLS denied the update" };
  const { data: existing } = await sb.from("visit_packages").select("id").eq("visit_id", id).eq("package_version_id", pkgId).maybeSingle();
  if (!existing) {
    const meta = pv.packages as unknown as { code: string; title: string } | null;
    const { error: lErr } = await sb.from("visit_packages").insert({
      visit_id: id, package_version_id: pkgId,
      snapshot: { package_version_id: pv.id, code: meta?.code ?? null, title: meta?.title ?? null, version_label: pv.version_label, status: pv.status, captured_at: new Date().toISOString() },
      added_by: user.id,
    });
    if (lErr) {
      console.error("[M8 repackageVisit] link insert failed:", lErr.message);
      revalidatePath(`/visits/${id}`);
      return { error: "Primary checklist swapped, but the package link could not be recorded — the gap is logged (PLN-CON-003)" };
    }
  }
  revalidatePath(`/visits/${id}`);
  return { ok: "Primary checklist swapped — link history preserved (append-only); previous links remain as history (PLN-CON-003)" };
}
