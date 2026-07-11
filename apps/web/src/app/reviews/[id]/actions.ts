"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";

export type DecisionResult = { error?: string };

export async function decide(_: DecisionResult, fd: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired" };
  const review_id = String(fd.get("review_id"));
  const decision = String(fd.get("decision"));
  const reason = String(fd.get("reason") ?? "").trim();
  const sections = fd.getAll("returned_section").map(String);
  if (["return", "reject"].includes(decision) && !reason)
    return { error: "Decision reason is mandatory for Return/Reject (FLD-REV-003 · ERR-REV-001)" };
  if (decision === "return" && sections.length === 0)
    return { error: "Return requires exact sections identified (STM-REV-003 · ERR-REV-001)" };
  const status = decision === "approve" ? "approved" : decision === "return" ? "returned" : "rejected";
  const { data: rev, error } = await sb.from("reviews").update({
    status, decision, decision_reason: reason || null,
    returned_sections: decision === "return" ? sections : null,
    decided_at: new Date().toISOString(),
  }).eq("id", review_id).select("inspection_id").single();
  if (error) return { error: `${error.message} (decided reviews are immutable — M06-009)` };
  await sb.from("inspections").update({ status }).eq("id", rev.inspection_id);
  redirect("/reviews");
}
