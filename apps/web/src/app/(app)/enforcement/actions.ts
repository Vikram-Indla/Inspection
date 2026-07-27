"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type EnforcementDecisionResult = {
  error?:
    | "auth_required"
    | "invalid_request"
    | "reason_required"
    | "maker_checker"
    | "conflict"
    | "write_failed"
    | "backend_guard_required";
  ok?: boolean;
};

// Defense in depth for stale clients: decision writes remain unavailable until
// Supabase exposes the guarded atomic transition required by DEC-F.
export async function recordEnforcementDecision(
  _: EnforcementDecisionResult,
  formData: FormData,
): Promise<EnforcementDecisionResult> {
  if (process.env.ENFORCEMENT_P0_RPCS_DEPLOYED !== "true") {
    return { error: "backend_guard_required" };
  }
  const recommendationId = String(formData.get("recommendation_id") ?? "");
  const requestedDecision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("decision_reason") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "");
  const decision = requestedDecision === "approved" ? "approve"
    : requestedDecision === "rejected" ? "reject"
    : null;
  if (!recommendationId || !idempotencyKey || !decision) return { error: "invalid_request" };
  if (!reason) return { error: "reason_required" };

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" };
  const { data, error } = await sb.rpc("decide_enforcement_recommendation", {
    p_recommendation: recommendationId,
    p_decision: decision,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: null,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("ENF_MAKER_CHECKER")) return { error: "maker_checker" };
    if (message.includes("ENF_DECISION_CONFLICT") || message.includes("ENF_DECISION_IDEMPOTENCY_CONFLICT")) {
      return { error: "conflict" };
    }
    if (message.includes("ENF_DECISION_NOT_AUTHORIZED")) return { error: "auth_required" };
    if (message.includes("ENF_DECISION_REASON_REQUIRED")) return { error: "reason_required" };
    return { error: "write_failed" };
  }
  const receipt = data as Record<string, unknown> | null;
  if (
    !receipt
    || receipt.recommendation_id !== recommendationId
    || !["approved", "rejected"].includes(String(receipt.status))
    || receipt.idempotency_key !== idempotencyKey
    || typeof receipt.correlation_id !== "string"
    || typeof receipt.replayed !== "boolean"
  ) return { error: "write_failed" };

  revalidatePath("/enforcement");
  revalidatePath("/admin/enforcement-recommendations");
  return { ok: true };
}
