"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type DecisionResult = { error?: string };

const REVIEW_READ_ERROR = "Review data could not be verified. Nothing was changed — try again.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (!UUID.test(inspection_id) || !UUID.test(submission_version_id))
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
    return { error: "This inspection is not waiting for a review." };
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

  // One canonical transaction claims the review, transitions the inspection
  // and appends the audit event. The RPC owns the row locks, latest-version
  // check, maker-checker role guard and race rollback; the reads above exist
  // only to give a precise, non-mutating stale-state explanation.
  const { data: created, error } = await sb.rpc("start_review", {
    p_inspection: inspection_id,
    p_submission_version: submission_version_id,
  });
  if (error || typeof created !== "string" || !UUID.test(created)) {
    console.error("[review start rpc]", error?.message, error?.code);
    const detail = `${error?.message ?? ""} ${error?.details ?? ""}`;
    if (detail.includes("REVIEW-START-CLAIMED") || error?.code === "23505")
      return { error: "Another reviewer already started this review — refresh to see the current state." };
    if (detail.includes("REVIEW-START-VERSION"))
      return { error: "Only the latest submitted version can be started for review." };
    if (detail.includes("REVIEW-START-STATE") || detail.includes("REVIEW-START-RACE"))
      return { error: "This inspection is no longer waiting for a review. Refresh to see its current state." };
    if (detail.includes("REVIEW-START-DENIED") || error?.code === "42501")
      return { error: "The review could not be started — you may not have the Level 2 Reviewer role for this scope." };
    return { error: "The review could not be started. Nothing was changed — try again." };
  }
  revalidatePath(`/reviews/${inspection_id}`);
  revalidatePath("/reviews");
  redirect(`/reviews/${inspection_id}/started?review=${created}`);
}

export async function decide(_: DecisionResult, fd: FormData): Promise<DecisionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired" };
  const review_id = String(fd.get("review_id"));
  const decision = String(fd.get("decision"));
  const reason = String(fd.get("reason") ?? "").trim();
  const comment = String(fd.get("comment") ?? "").trim();
  const suppliedCorrelation = String(fd.get("correlation_id") ?? "");
  const correlationId = UUID.test(suppliedCorrelation) ? suppliedCorrelation : crypto.randomUUID();
  const sections = fd.getAll("returned_section").map(String);
  const validDecisions = ["approve", "return", "reject"] as const;
  if (!UUID.test(review_id))
    return { error: "The review to decide could not be identified." };
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
    return { error: "Return scope contains a section that is not in the submitted checklist." };
  if (["return", "reject"].includes(decision) && !reason)
    return { error: "Decision reason is mandatory for Return/Reject ( · ERR-REV-001)" };
  if (decision === "return" && sections.length === 0)
    return { error: "Return requires exact sections identified (STM-REV-003 · ERR-REV-001)" };
  // One database transaction owns immutable decision persistence, inspection
  // transition, notification and audit. Any failure rolls all four back.
  const { data: result, error } = await sb.rpc("decide_review_with_handoff", {
    p_review: review_id,
    p_decision: decision,
    p_reason: reason || null,
    p_comment: comment || null,
    p_returned_sections: decision === "return" ? sections : null,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[review decision rpc]", error.message, error.code);
    const detail = `${error.message ?? ""} ${error.details ?? ""}`;
    if (detail.includes("REVIEW-DECIDE-OWNER") || detail.includes("REVIEW-COMMENT-OWNER")
        || detail.includes("REVIEW-DECIDE-DENIED") || error.code === "42501")
      return { error: "Only the assigned Level 2 Reviewer can decide this review." };
    if (detail.includes("REVIEW-DECIDE-SECTIONS"))
      return { error: "Return needs valid sections from the submitted checklist." };
    if (detail.includes("REVIEW-DECIDE-REASON"))
      return { error: "Decision reason is mandatory for Return/Reject ( · ERR-REV-001)" };
    if (detail.includes("REVIEW-DECIDE-SUBMISSION"))
      return { error: "Cannot approve — the final submitted version could not be verified (DEF-WF-006)." };
    if (detail.includes("REVIEW-COMPLIANCE-HANDOFF-EXISTS"))
      return { error: "This approved inspection already has a Compliance handoff. Refresh before taking another action." };
    if (detail.includes("REVIEW-DECIDE-STATE") || detail.includes("REVIEW-DECIDE-INSPECTION-STATE") || detail.includes("REVIEW-DECIDE-RACE"))
      return { error: "This review is no longer open. Refresh before deciding." };
    return { error: "The decision could not be recorded. Nothing was changed — try again or contact support." };
  }
  const completed = result as {
    inspection_id?: string;
    decision?: string;
    comment_id?: string | null;
    handoff_id?: string | null;
    correlation_id?: string;
  } | null;
  if (!completed?.inspection_id || !UUID.test(completed.inspection_id)
      || completed.decision !== decision
      || completed.correlation_id !== correlationId) {
    console.error("[review decision rpc result]", "invalid or mismatched result", completed);
    return { error: "The decision response could not be verified. Refresh the review before taking another action." };
  }
  revalidatePath("/reviews");
  revalidatePath(`/reviews/${completed.inspection_id}`);
  const receipt = new URLSearchParams({
    decision: completed.decision ?? decision,
    correlation: correlationId,
  });
  if (completed.comment_id && UUID.test(completed.comment_id)) receipt.set("comment", completed.comment_id);
  if (completed.handoff_id && UUID.test(completed.handoff_id)) receipt.set("handoff", completed.handoff_id);
  redirect(`/reviews/${completed.inspection_id}?${receipt.toString()}`);
}
