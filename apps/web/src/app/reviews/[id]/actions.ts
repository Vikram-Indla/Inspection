"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { insertNotification } from "@/lib/notify";

export type DecisionResult = { error?: string };

const REVIEW_READ_ERROR = "Review data could not be verified. Nothing was changed — try again.";

// CD-028 leg 5/10 — HANDOFF_BLOCKED_QUEUE_OPEN_MUTATION resolved: opening
// /reviews/:id is now a pure read. The review-create + under_review transition
// no longer happens as a render side-effect of navigation; it is an explicit,
// reviewer-intentful action started from the workspace. This keeps the queue
// scan-first and stops navigation from mutating data, without weakening the
// M06 decision flow (a started review still reaches decideReview unchanged).
export async function startReview(_: DecisionResult, fd: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const inspection_id = String(fd.get("inspection_id") ?? "");
  const submission_version_id = String(fd.get("submission_version_id") ?? "");
  if (!inspection_id || !submission_version_id)
    return { error: "The submission to review could not be identified." };

  // Only start against a genuinely submitted inspection whose latest version has
  // no open review. Re-checked server-side so a stale/tampered button cannot
  // bind a review to a different inspection or an older submission version.
  // One RLS-scoped aggregate proves status, version ownership/latestness, and
  // the open-review race precondition. Authentication and the aggregate are
  // independent, so resolve them together under live-provider latency.
  const [{ data: { user } }, { data: aggregate, error: aggregateError }] = await Promise.all([
    getVerifiedUser(sb),
    sb.from("inspections")
      .select("status, submission_versions(id, version_number), reviews(id, submission_version_id, decided_at)")
      .eq("id", inspection_id).maybeSingle(),
  ]);
  if (!user) return { error: "Session expired — sign in again." };
  if (aggregateError) {
    console.error("[review start aggregate read]", aggregateError.message, aggregateError.code);
    return { error: REVIEW_READ_ERROR };
  }
  type StartAggregate = {
    status: string;
    submission_versions: { id: string; version_number: number }[];
    reviews: { id: string; submission_version_id: string; decided_at: string | null }[];
  };
  const ins = aggregate as unknown as StartAggregate | null;
  if (!ins) return { error: "Inspection not found, or outside your review scope." };
  if (ins.status !== "submitted")
    return { error: "This inspection is not awaiting a Level 2 review." };
  const version = ins.submission_versions.find(row => row.id === submission_version_id);
  if (!version)
    return { error: "The submitted version does not belong to this inspection." };
  const latest = [...ins.submission_versions].sort((a, b) => b.version_number - a.version_number)[0];
  if (!latest || latest.id !== submission_version_id)
    return { error: "Only the latest submitted version can be started for review." };
  const existing = ins.reviews.find(row => row.submission_version_id === submission_version_id && !row.decided_at);
  // The workspace is a server-rendered decision surface. Redirect after the
  // committed action so Next performs one authoritative navigation. Next 15
  // treats a redirect to this same pathname (even with a new query) as a
  // no-op, so use the internal /started bridge to force the route transition.
  if (existing) {
    revalidatePath(`/reviews/${inspection_id}`);
    redirect(`/reviews/${inspection_id}/started?review=${existing.id}`);
  }

  // RBAC-011 — reviewer/ops only. RLS reviews_insert is the real boundary; a
  // denied insert surfaces as no row, never a silent invented start.
  const { data: created, error } = await sb.from("reviews").insert({
    inspection_id, submission_version_id, reviewer_id: user.id, status: "under_review",
  }).select("id").single();
  if (error || !created) {
    console.error("[review start]", error);
    // reviews_one_open_per_version (partial unique index) is the real guard
    // against two reviewers claiming the same submission at once — the
    // pre-check above only avoids the common sequential case.
    if (error?.code === "23505")
      return { error: "Another reviewer already started this review — refresh to see the current state." };
    return { error: "The review could not be started — you may not have the Level 2 Reviewer role for this scope." };
  }
  // Canonical transition follows the explicit start (never mutated on navigation).
  const { data: transitioned, error: transErr } = await sb.from("inspections")
    .update({ status: "under_review" }).eq("id", inspection_id).eq("status", "submitted").select("id").maybeSingle();
  if (transErr || !transitioned) {
    console.error("[review start transition]", transErr ?? "no row transitioned");
    return { error: "The review was started, but the inspection state could not be transitioned. Contact support." };
  }
  revalidatePath(`/reviews/${inspection_id}`);
  revalidatePath("/reviews");
  redirect(`/reviews/${inspection_id}/started?review=${created.id}`);
}

export async function decide(_: DecisionResult, fd: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired" };
  const review_id = String(fd.get("review_id"));
  const decision = String(fd.get("decision"));
  const reason = String(fd.get("reason") ?? "").trim();
  const sections = fd.getAll("returned_section").map(String);
  const validDecisions = ["approve", "return", "reject"] as const;
  if (!(validDecisions as readonly string[]).includes(decision))
    return { error: "Choose a valid review decision (approve, return or reject)." };

  // Re-read the review and package definition at submit time. The client form
  // is only a convenience; exact section membership and review state are
  // server-authoritative (M06-006/009/043).
  const { data: current, error: currentReadError } = await sb.from("reviews")
    .select("id, inspection_id, status, decided_at, inspections(package_versions(definition))")
    .eq("id", review_id).maybeSingle();
  if (currentReadError) {
    console.error("[review decision read]", currentReadError.message, currentReadError.code);
    return { error: REVIEW_READ_ERROR };
  }
  if (!current) return { error: "The review could not be found, or is outside your review scope." };
  if (current.decided_at || current.status !== "under_review")
    return { error: "This review is no longer open. Refresh before deciding." };
  const definition = (current.inspections as unknown as { package_versions: { definition?: { sections?: { key: string }[] } } | null } | null)?.package_versions?.definition;
  const validSectionKeys = new Set((definition?.sections ?? []).map(s => s.key));
  const invalidSections = sections.filter(s => !validSectionKeys.has(s));
  if (invalidSections.length > 0)
    return { error: "Return scope contains a section that is not in the submitted package." };
  if (["return", "reject"].includes(decision) && !reason)
    return { error: "Decision reason is mandatory for Return/Reject (FLD-REV-003 · ERR-REV-001)" };
  if (decision === "return" && sections.length === 0)
    return { error: "Return requires exact sections identified (STM-REV-003 · ERR-REV-001)" };
  const status = decision === "approve" ? "approved" : decision === "return" ? "returned" : "rejected";
  // DEF-WF-006 — defense in depth: the DB constraint trigger
  // (guard_approved_requires_submission) is the authoritative guard, but fail
  // closed here too so an approval attempt against a tampered/missing version
  // never reaches the write.
  if (decision === "approve") {
    const { data: version, error: versionError } = await sb.from("submission_versions")
      .select("id").eq("inspection_id", current.inspection_id).limit(1).maybeSingle();
    if (versionError) {
      console.error("[review decision version check]", versionError.message, versionError.code);
      return { error: REVIEW_READ_ERROR };
    }
    if (!version) return { error: "Cannot approve — no final submitted version exists for this inspection (DEF-WF-006)." };
  }
  const { data: rev, error } = await sb.from("reviews").update({
    status, decision, decision_reason: reason || null,
    returned_sections: decision === "return" ? sections : null,
    decided_at: new Date().toISOString(),
  }).eq("id", review_id).eq("status", "under_review").is("decided_at", null).select("inspection_id").maybeSingle();
  if (error || !rev) { console.error("[review detail decision write]", error ?? "no open review row"); return { error: "The decision could not be recorded. Decided reviews are immutable — try again or contact support." }; }
  const { data: transitioned, error: insErr } = await sb.from("inspections")
    .update({ status }).eq("id", rev.inspection_id).eq("status", "under_review").select("id").maybeSingle();
  if (insErr || !transitioned) {
    console.error("[review inspection transition]", insErr ?? "no row transitioned");
    return { error: "The decision was recorded, but the inspection state could not be transitioned. Contact support." };
  }
  // M06-004/006/008 — the inspector is notified on every decision (ENG-11).
  const { data: ins, error: insReadError } = await sb.from("inspections").select("visit_id").eq("id", rev.inspection_id).maybeSingle();
  if (insReadError) {
    console.error("[review decision inspection read]", insReadError.message, insReadError.code);
    return { error: "Decision recorded, but the inspector notification could not be verified." };
  }
  const { data: asg, error: asgReadError } = ins
    ? await sb.from("assignments").select("inspector_id").eq("visit_id", ins.visit_id).maybeSingle()
    : { data: null, error: null };
  if (asgReadError) {
    console.error("[review decision assignment read]", asgReadError.message, asgReadError.code);
    return { error: "Decision recorded, but the inspector notification could not be queued." };
  }
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
