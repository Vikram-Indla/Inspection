"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startReview, type DecisionResult } from "./actions";

// CD-028 leg 5 — explicit, reviewer-intentful start. Replaces the old
// navigation side-effect that created the review + transitioned the inspection
// on open. Opening the workspace is now read-only until the reviewer chooses to
// begin here.
export type StartReviewStrings = {
  title: string; body: string; start: string; starting: string;
};

export default function StartReview({ inspectionId, submissionVersionId, strings }: {
  inspectionId: string; submissionVersionId: string; strings: StartReviewStrings;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(startReview, {});
  // startReview mutates the server-rendered workspace. A server action's
  // revalidatePath invalidates the cache but does not replace the current RSC
  // tree, so explicitly refresh after the committed action resolves. Without
  // this, the button remains in its pending "Starting…" state while the
  // database is already under_review.
  useEffect(() => {
    if (state.started) router.refresh();
  }, [router, state.started]);
  return (
    <form
      action={formAction}
      onSubmit={() => {
        // The action commits the transition before the RSC response is
        // available. Refresh once the write has had a chance to commit so the
        // same workspace cannot remain on a stale pending form.
        window.setTimeout(() => window.location.reload(), 2_000);
      }}
      className="ax-surface ax-panel"
      style={{ padding: "var(--ax-space-300)", position: "sticky", insetBlockStart: 16, display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}
    >
      <h4>{strings.title}</h4>
      <p className="ax-caption">{strings.body}</p>
      <input type="hidden" name="inspection_id" value={inspectionId} />
      <input type="hidden" name="submission_version_id" value={submissionVersionId} />
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.starting : strings.start}</button>
    </form>
  );
}
