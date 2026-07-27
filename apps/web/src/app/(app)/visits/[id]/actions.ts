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

// M02-043 — note changes use the same atomic metadata contract as visit type.
export async function updateVisitNotes(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id") ?? "");
  const notes = String(fd.get("notes") ?? "").trim();
  if (!id) return { error: "Missing visit id (M02-043)" };
  const transitionError = await callPlanningTransition(sb, fd, "metadata", { notes: notes || null });
  if (transitionError) return { error: transitionError };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Notes saved atomically with audit and notification intent (M02-043)." };
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
  const transitionError = await callPlanningTransition(sb, fd, "metadata", { visit_type });
  if (transitionError) return { error: transitionError };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Visit type updated atomically — pre-start only, audited (M02-006)." };
}

// M02-009 / ENG-05 + M8 — Reassign inspector: updates assignments.inspector_id,
// notifies new inspector, records the lifecycle event with the prior holder.
export async function reassignVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  // PLN-R06: Supervisor → capability/RLS authority is unresolved. Fail closed
  // even if an older client posts this server action directly.
  void fd;
  return { error: "Reassignment is not configured until the governed Supervisor capability mapping is approved (PLN-R06)." };
  /*
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
  */
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
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) return { error: "Planning data could not be verified (ERR-OPS-001). Nothing was changed." };
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(fd.get("visit_id"));
  const expectedVersion = Number(fd.get("expected_version"));
  const idempotencyKey = String(fd.get("idempotency_key") ?? "").trim();
  const correlationId = String(fd.get("correlation_id") ?? "").trim();
  if (!UUID.test(id) || !Number.isInteger(expectedVersion) || expectedVersion < 1
      || !/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey) || !UUID.test(correlationId)) {
    return { error: "The duplicate request is incomplete. Refresh before trying again." };
  }
  const { data, error } = await sb.rpc("duplicate_terminal_visit_atomic", {
    p_visit_id: id,
    p_expected_version: expectedVersion,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[planning.duplicateVisit] governed mutation failed:", error.code, error.message);
    if (error.code === "42501") return { error: "You do not have permission or scope to duplicate this visit." };
    if (error.code === "40001") return { error: "This visit changed or is not in a final duplicable state. Refresh before retrying." };
    if (error.code === "23505") return { error: "This retry does not match the original duplicate request." };
    return { error: "The visit could not be duplicated (ERR-OPS-001). Nothing was changed." };
  }
  const receipt = data as {
    operation?: string; source_visit_id?: string; plan_id?: string; visit_id?: string;
    method?: string; correlation_id?: string; audit_event_id?: number;
    outbox_intent_id?: string;
  } | null;
  if (receipt?.operation !== "duplicate_draft" || receipt.source_visit_id !== id
      || !UUID.test(receipt.plan_id ?? "") || !UUID.test(receipt.visit_id ?? "")
      || !["single", "bulk"].includes(receipt.method ?? "")
      || receipt.correlation_id !== correlationId || !receipt.audit_event_id
      || !receipt.outbox_intent_id) {
    return { error: "The duplicate result could not be verified. Refresh before retrying." };
  }
  revalidatePath(`/visits/${id}`); revalidatePath("/planning");
  return {
    ok: "Duplicated atomically into a new Draft — execution evidence and review decisions were not copied (PLN-REQ-011).",
    planId: receipt.plan_id,
    method: receipt.method,
  };
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
  const transitionError = await callPlanningTransition(sb, fd, "repackage", { package_version_id: pkgId });
  if (transitionError) return { error: transitionError };
  revalidatePath(`/visits/${id}`);
  return { ok: "Primary checklist swapped atomically — link history preserved; audit and notification intent recorded (PLN-CON-003)." };
}
