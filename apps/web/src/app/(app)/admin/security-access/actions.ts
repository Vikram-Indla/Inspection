"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";

export type AccessResult = { ok?: boolean; error?: string; notice?: string };

function mapError(error: { message?: string; code?: string }): string {
  logProviderError("admin decide_access_review", error);
  const message = String(error.message ?? "");
  if (error.code === "42501" || message.includes("not authorized")) return "not_authorized";
  if (message.includes("subject cannot review own access")) return "cannot_review_own";
  if (message.includes("review is not open")) return "review_not_open";
  return "write_failed";
}

export async function decideAccessReview(_: AccessResult, data: FormData): Promise<AccessResult> {
  const reviewId = String(data.get("reviewId") ?? "").trim();
  const decision = String(data.get("decision") ?? "").trim();
  const reason = String(data.get("reason") ?? "").trim();
  if (!reviewId || !["retain", "revoke"].includes(decision) || reason.length < 8) return { error: "invalid_request" };

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "session_expired" };

  const { error } = await sb.rpc("mvp3_decide_access_review", { p_review_id: reviewId, p_decision: decision, p_reason: reason });
  if (error) return { error: mapError(error) };
  revalidatePath("/admin/security-access");
  return { ok: true, notice: "recorded" };
}
