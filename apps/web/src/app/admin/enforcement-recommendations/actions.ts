"use server";
// DEC-F decide action. Same compare-and-set shape as
// apps/web/src/app/reviews/[id]/actions.ts's decide step: RLS gates who can
// write, this WHERE clause gates *what* gets overwritten (only a still-pending,
// undecided row) — no separate RPC needed, matching that existing pattern.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type DecideResult = { error?: string };

export async function decideEnforcementRecommendation(_: DecideResult, formData: FormData): Promise<DecideResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" };

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("decision_reason") ?? "").trim();
  if (!id || !["approved", "rejected"].includes(decision)) return { error: "invalid_request" };

  const { data, error } = await sb.from("enforcement_recommendations").update({
    status: decision,
    decided_by: user.id,
    decided_at: new Date().toISOString(),
    decision_reason: reason || null,
  }).eq("id", id).eq("status", "pending").is("decided_at", null).select("id").maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "already_decided" };   // race: someone else decided first — never silently overwritten

  revalidatePath("/admin/enforcement-recommendations");
  return {};
}
