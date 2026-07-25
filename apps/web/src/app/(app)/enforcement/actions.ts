"use server";

// DEC-F · M3-09 · CD-059
// Canonical enforcement recommendation transition:
// pending -> approved | rejected. RLS owns the role guard, this action adds
// maker/checker separation and compare-and-set conflict protection. The
// database trigger appends the immutable audit event for the successful write.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";

export type EnforcementDecisionResult = {
  error?: "auth_required" | "invalid_request" | "reason_required" | "maker_checker" | "conflict" | "write_failed";
  ok?: boolean;
};

export async function recordEnforcementDecision(
  _: EnforcementDecisionResult,
  formData: FormData,
): Promise<EnforcementDecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" };

  const id = String(formData.get("recommendation_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("decision_reason") ?? "").trim();

  if (!id || !["approved", "rejected"].includes(decision)) return { error: "invalid_request" };
  if (!reason) return { error: "reason_required" };

  const { data: recommendation, error: readError } = await sb
    .from("enforcement_recommendations")
    .select("id,recommended_by,status,decided_at")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    logProviderError("enforcement decision read", readError);
    return { error: "write_failed" };
  }
  if (!recommendation || recommendation.status !== "pending" || recommendation.decided_at) {
    return { error: "conflict" };
  }
  if (recommendation.recommended_by === user.id) return { error: "maker_checker" };

  const { data, error } = await sb
    .from("enforcement_recommendations")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_reason: reason,
    })
    .eq("id", id)
    .eq("status", "pending")
    .eq("recommended_by", recommendation.recommended_by)
    .is("decided_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    logProviderError("enforcement decision write", error);
    return { error: "write_failed" };
  }
  if (!data) return { error: "conflict" };

  revalidatePath("/enforcement");
  revalidatePath("/admin/enforcement-recommendations");
  return { ok: true };
}
