"use server";
// W2/P2 — Visit Management bulk legs over selected child visits:
//   bulkRescheduleVisits (M02-007/031/033), bulkReassignVisits (M02-032),
//   bulkCancelVisits (M02-011/034).
// One server action per verb iterating the SAME per-visit guards the single
// actions use (guardPublishedNew / pre-start lock); every row's outcome is
// reported individually — partial success is expected, never silent.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type ActionResult = { error?: string; ok?: string };

function selectedIds(fd: FormData): string[] {
  return [...new Set(fd.getAll("visit_ids").map(v => String(v)).filter(Boolean))];
}

const short = (id: string) => id.slice(0, 8);

// M02-011/034 — bulk cancel: one mandatory reason; only rows still
// published/new cancel (same guard as cancelVisit); inspectors notified.
export async function bulkCancelVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const reason = String(fd.get("reason") ?? "").trim();
  if (ids.length === 0) return { error: "Select at least one visit (M02-011)" };
  if (!reason) return { error: "Cancellation reason is mandatory and final (M02-011)" };
  const lines: string[] = [];
  let done = 0;
  for (const id of ids) {
    const { data: updated, error } = await sb.from("visits")
      .update({ planning_status: "cancelled", cancellation_reason: reason })
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { lines.push(`${short(id)} — ${error.message}`); continue; }
    if (!updated?.length) { lines.push(`${short(id)} — blocked: not published/new, or RLS denied (M02-006 guard)`); continue; }
    done++;
    const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
    if (asg?.inspector_id) {
      const { error: nErr } = await sb.from("notifications").insert({
        event_key: "visit_cancelled", recipient: asg.inspector_id,
        payload: { visit_id: id, reason, bulk: true }, channel: "push",
      });
      if (nErr) { lines.push(`${short(id)} — cancelled, but notification failed: ${nErr.message}`); continue; }
    }
    lines.push(`${short(id)} — cancelled`);
  }
  revalidatePath("/visits");
  const summary = `${done}/${ids.length} cancelled (M02-011/034, audited)\n${lines.join("\n")}`;
  return done > 0 ? { ok: summary } : { error: summary };
}

// M02-007/031/033 — bulk reschedule window: shared new window applied to every
// selected row that still passes the published/new guard (M02-008 semantics).
export async function bulkRescheduleVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const ws = String(fd.get("window_start") ?? "").trim();
  const we = String(fd.get("window_end") ?? "").trim();
  if (ids.length === 0) return { error: "Select at least one visit (M02-033)" };
  if (!ws || !we) return { error: "Both new window start and end are required (M02-033)" };
  const start = new Date(ws); const end = new Date(we);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { error: "Invalid date/time values (M02-033)" };
  if (end.getTime() <= start.getTime()) return { error: "Window end must be after window start (M02-033)" };
  const lines: string[] = [];
  let done = 0;
  for (const id of ids) {
    const { data: updated, error } = await sb.from("visits")
      .update({ window_start: start.toISOString(), window_end: end.toISOString() })
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { lines.push(`${short(id)} — ${error.message}`); continue; }
    if (!updated?.length) { lines.push(`${short(id)} — blocked: not published/new, or RLS denied (M02-008 guard)`); continue; }
    done++;
    // Unlike bulkReassignVisits/bulkCancelVisits, this leg never notified the
    // assigned inspector that their window moved — same "silent reschedule"
    // gap the single-visit rescheduleVisit() already closed.
    const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", id).maybeSingle();
    if (asg?.inspector_id) {
      const { error: nErr } = await sb.from("notifications").insert({
        event_key: "reschedule", recipient: asg.inspector_id,
        payload: { visit_id: id, window_start: start.toISOString(), window_end: end.toISOString(), bulk: true }, channel: "push",
      });
      if (nErr) { lines.push(`${short(id)} — window updated, but notification failed: ${nErr.message}`); continue; }
    }
    lines.push(`${short(id)} — window updated`);
  }
  revalidatePath("/visits");
  const summary = `${done}/${ids.length} rescheduled (M02-033, audited)\n${lines.join("\n")}`;
  return done > 0 ? { ok: summary } : { error: summary };
}

// Bulk Edit Visits (Excel row: Visit Type / Location / Notes) — the existing
// bulk actions only covered reschedule/reassign/cancel; type and notes had
// no bulk path at all. Location is intentionally out of scope here (same
// reason single-visit Edit Visit doesn't cover it — location changes need
// the map/pin re-confirmation flow, not a blind bulk overwrite).
export async function bulkEditVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const visitType = String(fd.get("visit_type") ?? "").trim();
  const notesRaw = String(fd.get("notes") ?? "");
  const setNotes = fd.get("set_notes") === "1"; // explicit opt-in so "leave notes alone" is the default
  if (ids.length === 0) return { error: "Select at least one visit (M02-007)" };
  if (!visitType && !setNotes) return { error: "Choose a visit type to change, or check \"update notes\" (M02-007)" };
  const patch: Record<string, string | null> = {};
  if (visitType) patch.visit_type = visitType;
  if (setNotes) patch.notes = notesRaw.trim() === "" ? null : notesRaw.trim();
  const lines: string[] = [];
  let done = 0;
  for (const id of ids) {
    const { data: updated, error } = await sb.from("visits").update(patch)
      .eq("id", id).eq("planning_status", "published").eq("operational_state", "new")
      .select("id");
    if (error) { lines.push(`${short(id)} — ${error.message}`); continue; }
    if (!updated?.length) { lines.push(`${short(id)} — blocked: not published/new, or RLS denied (M02-008 guard)`); continue; }
    done++;
    lines.push(`${short(id)} — updated`);
  }
  revalidatePath("/visits");
  const summary = `${done}/${ids.length} edited (M02-007, audited)\n${lines.join("\n")}`;
  return done > 0 ? { ok: summary } : { error: summary };
}

// M02-032 — bulk reassign inspector: per-row pre-start lock (same as
// reassignVisit), assignment update, new inspector notified per visit.
export async function bulkReassignVisits(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const ids = selectedIds(fd);
  const inspector = String(fd.get("inspector_id") ?? "");
  if (ids.length === 0) return { error: "Select at least one visit (M02-032)" };
  if (!inspector) return { error: "Select an inspector (M02-032)" };
  const lines: string[] = [];
  let done = 0;
  for (const id of ids) {
    // Planning changes lock once the linked inspection has started (M02-006 guard)
    const { data: ins } = await sb.from("inspections").select("status").eq("visit_id", id).maybeSingle();
    if (ins && ins.status !== "not_started") { lines.push(`${short(id)} — blocked: inspection already ${ins.status} (M02-006)`); continue; }
    const { data: updated, error } = await sb.from("assignments")
      .update({ inspector_id: inspector, method: "manual", status: "assigned" })
      .eq("visit_id", id).select("id");
    if (error) { lines.push(`${short(id)} — ${error.message}`); continue; }
    if (!updated?.length) { lines.push(`${short(id)} — blocked: no assignment exists, or RLS denied (assignments_update requires planner/ops)`); continue; }
    done++;
    const { error: nErr } = await sb.from("notifications").insert({
      event_key: "assignment", recipient: inspector,
      payload: { visit_id: id, reassigned: true, bulk: true }, channel: "push",
    });
    if (nErr) { lines.push(`${short(id)} — reassigned, but notification failed: ${nErr.message}`); continue; }
    lines.push(`${short(id)} — reassigned`);
  }
  revalidatePath("/visits");
  const summary = `${done}/${ids.length} reassigned (M02-032 / ENG-05, audited)\n${lines.join("\n")}`;
  return done > 0 ? { ok: summary } : { error: summary };
}
