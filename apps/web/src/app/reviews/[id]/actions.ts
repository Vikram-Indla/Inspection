"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notify";

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
  if (error) { console.error("[review detail decision write]", error); return { error: "The decision could not be recorded. Decided reviews are immutable — try again or contact support." }; }
  const { error: insErr } = await sb.from("inspections").update({ status }).eq("id", rev.inspection_id);
  if (insErr) { console.error("[review inspection transition]", insErr); return { error: "The decision was recorded, but the inspection state could not be transitioned. Contact support." }; }
  // M06-004/006/008 — the inspector is notified on every decision (ENG-11).
  const { data: ins } = await sb.from("inspections").select("visit_id").eq("id", rev.inspection_id).single();
  const { data: asg } = ins
    ? await sb.from("assignments").select("inspector_id").eq("visit_id", ins.visit_id).maybeSingle()
    : { data: null };
  if (asg?.inspector_id) {
    const n = await insertNotification(sb, {
      event_key: "review_decision",
      recipient: asg.inspector_id,
      payload: { inspection_id: rev.inspection_id, decision, reason: reason || null, returned_sections: decision === "return" ? sections : null },
    });
    if (n.error) return { error: "Decision recorded, but the inspector notification could not be queued." };
  }
  revalidatePath("/reviews");
  redirect("/reviews");
}
