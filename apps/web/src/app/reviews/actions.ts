"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notify";

export type DecisionResult = { error?: string; ok?: boolean };

// M06-006..009 — Level 2 decision: approve | return (with exact scope) | reject.
// Immutability after decision is enforced by trg_guard_review in the database.
export async function decideReview(_: DecisionResult, formData: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const review_id = String(formData.get("review_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const scopeRaw = String(formData.get("returned_sections") ?? "").trim();

  if (!review_id || !["approve", "return", "reject"].includes(decision))
    return { error: "Pick a decision (M06-006)." };
  if (!reason) return { error: "A reason is mandatory for every decision (FLD-REV-003)." };
  if (decision === "return" && !scopeRaw)
    return { error: "Return requires the exact section scope (FLD-REV-004)." };

  const statusMap = { approve: "approved", return: "returned", reject: "rejected" } as const;
  const sections = decision === "return" ? scopeRaw.split(",").map(s => s.trim()).filter(Boolean) : null;
  const { data: rev, error } = await sb.from("reviews").update({
    reviewer_id: user.id,
    status: statusMap[decision as keyof typeof statusMap],
    decision,
    decision_reason: reason,
    returned_sections: sections,
    decided_at: new Date().toISOString(),
  }).eq("id", review_id).is("decided_at", null).select("inspection_id").maybeSingle();
  if (error) return { error: error.message };
  if (!rev) return { error: "No row updated — review already decided, or RLS denied (M06-009)." };
  // Canonical workflow transition follows the decision (never mutated elsewhere).
  await sb.from("inspections").update({ status: statusMap[decision as keyof typeof statusMap] }).eq("id", rev.inspection_id);

  // M06-004/006/008 — the assigned inspector is notified on every decision (ENG-11).
  const { data: ins } = await sb.from("inspections").select("visit_id").eq("id", rev.inspection_id).single();
  const { data: asg } = ins
    ? await sb.from("assignments").select("inspector_id").eq("visit_id", ins.visit_id).maybeSingle()
    : { data: null };
  if (asg?.inspector_id) {
    const n = await insertNotification(sb, {
      event_key: "review_decision",
      recipient: asg.inspector_id,
      payload: { inspection_id: rev.inspection_id, decision, reason, returned_sections: sections },
    });
    if (n.error) return { error: `Decision recorded, but inspector notification failed: ${n.error}` };
  }

  revalidatePath("/reviews");
  return { ok: true };
}
