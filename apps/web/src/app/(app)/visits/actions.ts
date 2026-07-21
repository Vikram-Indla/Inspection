"use server";
// W2/P2 — Visit Management bulk legs over selected child visits:
//   bulkRescheduleVisits (M02-007/031/033), bulkReassignVisits (M02-032),
//   bulkCancelVisits (M02-011/034), bulkEditVisits (M02-007).
// One server action per verb iterating the SAME per-visit guards the single
// actions use (guardPublishedNew / pre-start lock); every row's outcome is
// reported individually — partial success is expected, never silent.
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
import { getReasonOptions, recordLifecycleEvent, validateReason } from "@/lib/planning/lifecycle";

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
  requested?: number;
  items?: ItemResult[];
};

function selectedIds(fd: FormData): string[] {
  return [...new Set(fd.getAll("visit_ids").map(v => String(v)).filter(Boolean))];
}

// Provider errors never reach the UI. Log the raw message server-side (for
// operators) and return only the neutral code (M02 error-neutralisation).
function logProvider(verb: BulkVerb, id: string, message: string) {
  console.error(`[visits.bulk.${verb}] ${id}: ${message}`);
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
  const items: ItemResult[] = [];
  for (const id of ids) {
    const { data: v0 } = await sb.from("visits").select("window_start, window_end").eq("id", id).maybeSingle();
    const { data: asg0 } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
    const { data: updated, error } = await sb.from("visits")
      .update({ planning_status: "cancelled", cancellation_reason: reasonKey })
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { logProvider("cancel", id, error.message); items.push({ id, outcome: "error" }); continue; }
    if (!updated?.length) { items.push({ id, outcome: "blocked_not_publishable" }); continue; }
    const evErr = await recordLifecycleEvent(sb, {
      visitId: id, eventType: "cancel", reasonKey, comments, actor: user.id,
      previous: { planning_status: "published", inspector_id: asg0?.inspector_id ?? null, window_start: v0?.window_start ?? null, window_end: v0?.window_end ?? null },
    });
    if (evErr) { items.push({ id, outcome: "applied_no_notification" }); continue; }
    if (asg0?.inspector_id) {
      const { error: nErr } = await sb.from("notifications").insert({
        event_key: "visit_cancelled", recipient: asg0.inspector_id,
        payload: { visit_id: id, reason: reasonKey, bulk: true }, channel: "push",
      });
      if (nErr) { logProvider("cancel", id, `notify: ${nErr.message}`); items.push({ id, outcome: "applied_no_notification" }); continue; }
    }
    items.push({ id, outcome: "applied" });
  }
  revalidatePath("/visits");
  return { verb: "cancel", requested: ids.length, items };
}

// M02-007/031/033 — bulk reschedule window: shared new window applied to every
// selected row that still passes the published/new guard (M02-008 semantics).
// NOTE (HANDOFF_BLOCKED_GUARD): post-move Inspector-overlap recheck is a
// separate authorized backend leg and is intentionally NOT synthesised here.
export async function bulkRescheduleVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const ws = String(fd.get("window_start") ?? "").trim();
  const we = String(fd.get("window_end") ?? "").trim();
  if (ids.length === 0) return { verb: "reschedule", formErrorCode: "select_one" };
  if (!ws || !we) return { verb: "reschedule", formErrorCode: "window_required" };
  const start = new Date(ws); const end = new Date(we);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { verb: "reschedule", formErrorCode: "window_invalid" };
  if (end.getTime() <= start.getTime()) return { verb: "reschedule", formErrorCode: "window_order" };
  const items: ItemResult[] = [];
  for (const id of ids) {
    const { data: updated, error } = await sb.from("visits")
      .update({ window_start: start.toISOString(), window_end: end.toISOString() })
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { logProvider("reschedule", id, error.message); items.push({ id, outcome: "error" }); continue; }
    if (!updated?.length) { items.push({ id, outcome: "blocked_not_publishable" }); continue; }
    const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
    if (asg?.inspector_id) {
      const { error: nErr } = await sb.from("notifications").insert({
        event_key: "reschedule", recipient: asg.inspector_id,
        payload: { visit_id: id, window_start: start.toISOString(), window_end: end.toISOString(), bulk: true }, channel: "push",
      });
      if (nErr) { logProvider("reschedule", id, `notify: ${nErr.message}`); items.push({ id, outcome: "applied_no_notification" }); continue; }
    }
    items.push({ id, outcome: "applied" });
  }
  revalidatePath("/visits");
  return { verb: "reschedule", requested: ids.length, items };
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
  const ids = selectedIds(fd);
  const visitType = String(fd.get("visit_type") ?? "").trim();
  const notesRaw = String(fd.get("notes") ?? "");
  const setNotes = fd.get("set_notes") === "1"; // explicit opt-in so "leave notes alone" is the default
  if (ids.length === 0) return { verb: "edit", formErrorCode: "select_one" };
  if (!visitType && !setNotes) return { verb: "edit", formErrorCode: "type_or_notes_required" };
  const patch: Record<string, string | null> = {};
  if (visitType) patch.visit_type = visitType;
  if (setNotes) patch.notes = notesRaw.trim() === "" ? null : notesRaw.trim();
  const items: ItemResult[] = [];
  for (const id of ids) {
    const { data: updated, error } = await sb.from("visits").update(patch)
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { logProvider("edit", id, error.message); items.push({ id, outcome: "error" }); continue; }
    if (!updated?.length) { items.push({ id, outcome: "blocked_not_publishable" }); continue; }
    items.push({ id, outcome: "applied" });
  }
  revalidatePath("/visits");
  return { verb: "edit", requested: ids.length, items };
}

// M02-032 — bulk reassign inspector: per-row pre-start lock (same as
// reassignVisit), assignment update, new inspector notified per visit.
export async function bulkReassignVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const inspector = String(fd.get("inspector_id") ?? "");
  if (ids.length === 0) return { verb: "reassign", formErrorCode: "select_one" };
  if (!inspector) return { verb: "reassign", formErrorCode: "inspector_required" };
  const items: ItemResult[] = [];
  for (const id of ids) {
    // Planning changes lock once the linked inspection has started (M02-006 guard)
    const { data: ins } = await sb.from("inspections").select("status").eq("visit_id", id).maybeSingle();
    if (ins && ins.status !== "not_started") { items.push({ id, outcome: "blocked_started" }); continue; }
    const { data: updated, error } = await sb.from("assignments")
      .update({ inspector_id: inspector, method: "manual", status: "assigned" })
      .eq("visit_id", id).select("id");
    if (error) { logProvider("reassign", id, error.message); items.push({ id, outcome: "error" }); continue; }
    if (!updated?.length) { items.push({ id, outcome: "blocked_no_assignment" }); continue; }
    const { error: nErr } = await sb.from("notifications").insert({
      event_key: "assignment", recipient: inspector,
      payload: { visit_id: id, reassigned: true, bulk: true }, channel: "push",
    });
    if (nErr) { logProvider("reassign", id, `notify: ${nErr.message}`); items.push({ id, outcome: "applied_no_notification" }); continue; }
    items.push({ id, outcome: "applied" });
  }
  revalidatePath("/visits");
  return { verb: "reassign", requested: ids.length, items };
}
