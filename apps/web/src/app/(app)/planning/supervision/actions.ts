"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";

export type SupervisionDecisionResult = { error?: string; done?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function decideSupervision(
  _: SupervisionDecisionResult,
  formData: FormData,
): Promise<SupervisionDecisionResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { error: "Session expired — sign in again." };

  const visitId = String(formData.get("visit_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const inspectorId = String(formData.get("inspector_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!UUID.test(visitId) || !["approve", "return", "reject"].includes(decision)) {
    return { error: "The supervision request could not be identified. Refresh and try again." };
  }
  const required = decision === "approve" ? "planning.approve" : decision === "return" ? "planning.return" : "planning.reject";
  const access = await getPlanningAccess(sb, [required]);
  if (access.error || !access.can(required)) return { error: "Your role cannot make this supervision decision." };
  if (decision === "approve" && !UUID.test(inspectorId)) return { error: "Choose one named Inspector before releasing this visit." };
  if (["return", "reject"].includes(decision) && !reason) return { error: "Give the Planner a reason for returning or rejecting this visit." };

  const { error } = await sb.rpc("decide_single_visit_supervision", {
    p_visit_id: visitId,
    p_decision: decision,
    p_inspector_id: decision === "approve" ? inspectorId : null,
    p_reason: reason || null,
  });
  if (error) {
    console.error("[ decideSupervision]", error.code, error.message);
    if (/INSPECTOR-UNAVAILABLE/i.test(error.message)) return { error: "That Inspector is already booked in this window. Choose another Inspector." };
    if (/NOT-PENDING|SELF-DECISION/i.test(error.message)) return { error: "This request is no longer available for your decision. Refresh the queue." };
    return { error: "The supervision decision could not be saved. Nothing was released." };
  }
  revalidatePath("/planning");
  revalidatePath("/planning/supervision");
  return { done: decision === "approve" ? "Visit approved, assigned, and released." : decision === "return" ? "Visit returned to the Planner." : "Visit rejected." };
}
