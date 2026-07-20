"use server";
// Slice E3 — journey state machine legs (M04-018 / M04-046 / M04-055 · STM-OPS).
// The guard lives in the DB: set_operational_state (0015) is SECURITY DEFINER,
// checks is_assigned_inspector (RBAC-009) and only permits the legal legs
// new/prepared -> on_the_way -> arrived -> executing. Provider/RPC details are
// logged server-side only; callers receive stable recovery codes.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type ActionResult = { error?: string; ok?: string };

export async function transitionOperationalState(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!visitId || !["on_the_way", "arrived", "executing"].includes(next)) {
    return { error: "Invalid operational transition request (STM-OPS)" };
  }
  const sb = await supabaseServer();
  const { error } = await sb.rpc("set_operational_state", { p_visit: visitId, p_next: next });
  if (error) {
    console.error("[field transitionOperationalState]", error);
    return { error: "transition_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath(`/visits/${visitId}`);
  revalidatePath("/operations");
  return { ok: next };
}

// F3 · M04-056/057 — field cancellation REQUEST at arrival. The inspector never
// cancels directly (visits_update RLS is planner/ops); request_visit_cancellation
// (0020, SECURITY DEFINER) validates the governed reason (engine_settings.field),
// flags visits.cancellation_requested, appends the operational note and notifies
// planner/ops. Provider/RPC details stay server-side.
export async function requestVisitCancellation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const reasonKey = String(fd.get("reason_key") ?? "");
  const comment = String(fd.get("comment") ?? "").trim();
  if (!visitId || !reasonKey) return { error: "Cancellation reason is mandatory (M04-057)" };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("request_visit_cancellation", {
    p_visit: visitId, p_reason_key: reasonKey, p_comment: comment || null,
  });
  if (error) {
    console.error("[field requestVisitCancellation]", error);
    return { error: "cancellation_request_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath(`/visits/${visitId}`);
  revalidatePath("/operations");
  return { ok: "cancellation_requested" };
}

// F3 · M03-006 — inspector return: assignment -> returned + return_reason,
// visit flagged return_requested, planner notified (request_visit_return, 0020).
export async function requestVisitReturn(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const visitId = String(fd.get("visit_id") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  if (!visitId || !reason) return { error: "Return reason is mandatory (M03-006)" };
  const sb = await supabaseServer();
  const { error } = await sb.rpc("request_visit_return", { p_visit: visitId, p_reason: reason });
  if (error) {
    console.error("[field requestVisitReturn]", error);
    return { error: "return_request_failed" };
  }
  revalidatePath(`/field/${visitId}`);
  revalidatePath("/field");
  revalidatePath(`/visits/${visitId}`);
  return { ok: "return_requested" };
}
