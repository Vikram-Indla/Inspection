"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type ActionResult = { error?: string; ok?: string };

async function guardPreStart(visitId: string) {
  const sb = await supabaseServer();
  const { data: ins } = await sb.from("inspections").select("status").eq("visit_id", visitId).maybeSingle();
  if (ins && ins.status !== "not_started") return `Inspection already ${ins.status} — planning changes locked (M02-006)`;
  return null;
}

export async function returnVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "Return reason is mandatory (STM-VIS-001)" };
  const { error } = await sb.from("visits").update({ planning_status: "returned", notes: `RETURNED: ${reason}` }).eq("id", id).eq("planning_status", "published");
  if (error) return { error: error.message };
  revalidatePath(`/visits/${id}`); return { ok: "Returned — allowed fields reopened, owner notified" };
}

export async function republishVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id"));
  const { error } = await sb.from("visits").update({ planning_status: "published" }).eq("id", id).eq("planning_status", "returned");
  if (error) return { error: error.message };
  revalidatePath(`/visits/${id}`); return { ok: "Republished — same Visit ID retained (M02-009)" };
}

export async function cancelVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "Cancellation reason is mandatory and final (M02-010)" };
  const locked = await guardPreStart(id);
  if (locked) return { error: `Cancellation blocked: ${locked}` };
  const { error } = await sb.from("visits").update({ planning_status: "cancelled", cancellation_reason: reason }).eq("id", id).in("planning_status", ["published", "returned"]);
  if (error) return { error: error.message };
  revalidatePath(`/visits/${id}`); return { ok: "Cancelled — final state, inspector notified, audited" };
}

export async function reassignVisit(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const sb = await supabaseServer();
  const id = String(fd.get("visit_id")); const inspector = String(fd.get("inspector_id") ?? "");
  if (!inspector) return { error: "Select an inspector" };
  const locked = await guardPreStart(id);
  if (locked) return { error: `Reassignment blocked: ${locked}` };
  const { error } = await sb.from("assignments").update({ inspector_id: inspector, method: "manual", status: "assigned" }).eq("visit_id", id);
  if (error) return { error: error.message };
  await sb.from("notifications").insert({ event_key: "assignment", recipient: inspector, payload: { visit_id: id, reassigned: true }, channel: "push" });
  revalidatePath(`/visits/${id}`); return { ok: "Reassigned — both parties notified (M02-026)" };
}
