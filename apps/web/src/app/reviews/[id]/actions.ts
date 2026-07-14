"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notify";

export type DecisionResult = { error?: string };

// CD-028 leg 5/10 — HANDOFF_BLOCKED_QUEUE_OPEN_MUTATION resolved: opening
// /reviews/:id is now a pure read. The review-create + under_review transition
// no longer happens as a render side-effect of navigation; it is an explicit,
// reviewer-intentful action started from the workspace. This keeps the queue
// scan-first and stops navigation from mutating data, without weakening the
// M06 decision flow (a started review still reaches decideReview unchanged).
export async function startReview(_: DecisionResult, fd: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };
  const inspection_id = String(fd.get("inspection_id") ?? "");
  const submission_version_id = String(fd.get("submission_version_id") ?? "");
  if (!inspection_id || !submission_version_id)
    return { error: "The submission to review could not be identified." };

  // Only start against a genuinely submitted inspection whose latest version has
  // no open review. Re-checked server-side so a stale button cannot double-start.
  const { data: ins } = await sb.from("inspections").select("status").eq("id", inspection_id).single();
  if (!ins) return { error: "Inspection not found, or outside your review scope (RLS)." };
  if (ins.status !== "submitted")
    return { error: "This inspection is not awaiting a Level 2 review (M06-005)." };
  const { data: existing } = await sb.from("reviews")
    .select("id").eq("submission_version_id", submission_version_id).is("decided_at", null).maybeSingle();
  if (existing) { revalidatePath(`/reviews/${inspection_id}`); return {}; }

  // RBAC-011 — reviewer/ops only. RLS reviews_insert is the real boundary; a
  // denied insert surfaces as no row, never a silent invented start.
  const { data: created, error } = await sb.from("reviews").insert({
    inspection_id, submission_version_id, reviewer_id: user.id, status: "under_review",
  }).select("id").single();
  if (error || !created) {
    console.error("[review start]", error);
    return { error: "The review could not be started — you may not have the Level 2 Reviewer role for this scope." };
  }
  // Canonical transition follows the explicit start (never mutated on navigation).
  const { error: transErr } = await sb.from("inspections").update({ status: "under_review" }).eq("id", inspection_id);
  if (transErr) { console.error("[review start transition]", transErr); return { error: "The review was started, but the inspection state could not be transitioned. Contact support." }; }
  revalidatePath(`/reviews/${inspection_id}`);
  revalidatePath("/reviews");
  return {};
}

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
