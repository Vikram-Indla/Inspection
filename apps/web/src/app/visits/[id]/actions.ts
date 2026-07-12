"use server";
// SB05 — Visit Management write legs: cancel (M02-006), reschedule (M02-008), reassign (M02-009/ENG-05)
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notify";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { error?: string; ok?: string };

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
  if (error) return error.message;
  if (!v) return "Visit not found or outside your scope (RLS)";
  if (v.planning_status !== "published" || v.operational_state !== "new")
    return `Allowed only while published / new — visit is ${v.planning_status} / ${v.operational_state.replace(/_/g, " ")}`;
  return null;
}

export async function returnVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "Return reason is mandatory (STM-VIS-001)" };
  const { error } = await sb.from("visits").update({ planning_status: "returned", notes: `RETURNED: ${reason}` }).eq("id", id).eq("planning_status", "published");
  if (error) return { error: error.message };
  // M02-041 — the assigned inspector is told their visit was returned to planning.
  const nErr = await notifyAssignedInspector(sb, id, "visit_returned", { reason });
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  if (nErr) return { error: `Returned, but notification failed: ${nErr}` };
  return { ok: "Returned — allowed fields reopened, inspector notified (M02-041)" };
}

export async function republishVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id"));
  const { error } = await sb.from("visits").update({ planning_status: "published" }).eq("id", id).eq("planning_status", "returned");
  if (error) return { error: error.message };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Republished — same Visit ID retained (M02-009)" };
}

// M02-006 — Cancel visit: published/new only, mandatory reason, notify assigned inspector.
export async function cancelVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "Cancellation reason is mandatory and final (M02-006)" };
  const guard = await guardPublishedNew(id);
  if (guard) return { error: `Cancellation blocked: ${guard} (M02-006)` };
  const { data: updated, error } = await sb.from("visits")
    .update({ planning_status: "cancelled", cancellation_reason: reason })
    .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "No row updated — state changed concurrently or RLS denied the update (visits_update requires planner/ops)" };
  const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
  if (asg?.inspector_id) {
    const { error: nErr } = await sb.from("notifications").insert({ event_key: "visit_cancelled", recipient: asg.inspector_id, payload: { visit_id: id, reason }, channel: "push" });
    if (nErr) return { error: `Visit cancelled, but notification failed: ${nErr.message}` };
  }
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Cancelled — final state, inspector notified, audited (M02-006)" };
}

// M02-008 — Reschedule window: same state guard as cancel, end must be after start (server-side).
export async function rescheduleVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id"));
  const ws = String(fd.get("window_start") ?? "").trim(); const we = String(fd.get("window_end") ?? "").trim();
  if (!ws || !we) return { error: "Both new window start and end are required (M02-008)" };
  const start = new Date(ws); const end = new Date(we);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: "Invalid date/time values (M02-008)" };
  if (end.getTime() <= start.getTime()) return { error: "Window end must be after window start (M02-008)" };
  const guard = await guardPublishedNew(id);
  if (guard) return { error: `Reschedule blocked: ${guard} (M02-008)` };
  const { data: updated, error } = await sb.from("visits")
    .update({ window_start: start.toISOString(), window_end: end.toISOString() })
    .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "No row updated — state changed concurrently or RLS denied the update (visits_update requires planner/ops)" };
  // M02-041 — the assigned inspector is notified of the new window.
  const nErr = await notifyAssignedInspector(sb, id, "visit_rescheduled", { window_start: start.toISOString(), window_end: end.toISOString() });
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  if (nErr) return { error: `Window rescheduled, but notification failed: ${nErr}` };
  return { ok: "Window rescheduled — inspector notified of the new window (M02-008 · M02-041)" };
}

// FIX WAVE F4 · M02-042 — visit attachments: upload to private bucket 'attachments'
// then register the row; RLS va_insert (planner/ops) + storage policy are the
// authority — any rejection is surfaced verbatim.
export async function uploadVisitAttachment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
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
  if (up.error) return { error: up.error.message };
  const { error } = await sb.from("visit_attachments").insert({
    visit_id: visitId, name: file.name, mime, storage_path: path, uploaded_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/visits/${visitId}`);
  return { ok: `Attachment "${file.name}" uploaded (M02-042, audited)` };
}

// M02-042 — soft delete: removed_at set, row and file retained (audit-safe).
export async function removeVisitAttachment(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };
  const attachmentId = String(fd.get("attachment_id") ?? "");
  const visitId = String(fd.get("visit_id") ?? "");
  if (!attachmentId) return { error: "Missing attachment id (M02-042)" };
  const { data: updated, error } = await sb.from("visit_attachments")
    .update({ removed_at: new Date().toISOString(), removed_by: user.id })
    .eq("id", attachmentId).is("removed_at", null)
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "No row updated — already removed, or RLS denied (va_update requires planner/ops)" };
  revalidatePath(`/visits/${visitId}`);
  return { ok: "Attachment removed — soft delete, file and audit trail retained (M02-042)" };
}

// M02-043 — add/edit visit notes: plain guarded update on visits.notes;
// RLS visits_update (planner/ops) is the authority. Empty input clears notes.
export async function updateVisitNotes(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id") ?? "");
  const notes = String(fd.get("notes") ?? "").trim();
  if (!id) return { error: "Missing visit id (M02-043)" };
  const { data: updated, error } = await sb.from("visits")
    .update({ notes: notes || null })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
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
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "No row updated — state changed concurrently or RLS denied the update (visits_update requires planner/ops)" };
  revalidatePath(`/visits/${id}`); revalidatePath("/visits");
  return { ok: "Visit type updated — pre-start only, audited (M02-006)" };
}

// M02-009 / ENG-05 — Reassign inspector: updates assignments.inspector_id, notifies new inspector.
export async function reassignVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const inspector = String(fd.get("inspector_id") ?? "");
  if (!inspector) return { error: "Select an inspector (M02-009)" };
  const locked = await guardPreStart(id);
  if (locked) return { error: `Reassignment blocked: ${locked}` };
  const { data: updated, error } = await sb.from("assignments")
    .update({ inspector_id: inspector, method: "manual", status: "assigned" })
    .eq("visit_id", id).select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "No assignment updated — none exists for this visit or RLS denied the update (assignments_update requires planner/ops)" };
  const { error: nErr } = await sb.from("notifications").insert({ event_key: "assignment", recipient: inspector, payload: { visit_id: id, reassigned: true }, channel: "push" });
  if (nErr) return { error: `Reassigned, but notification failed: ${nErr.message}` };
  revalidatePath(`/visits/${id}`);
  return { ok: "Reassigned — both parties notified (M02-009 / ENG-05)" };
}
