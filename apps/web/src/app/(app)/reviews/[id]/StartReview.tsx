"use client";
import { useActionState } from "react";
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
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(startReview, {});
  return (
    <form action={formAction} className="panel cd-panelpad sq-stack">
      <h2>{strings.title}</h2>
      <p className="t-caption">{strings.body}</p>
      <input type="hidden" name="inspection_id" value={inspectionId} />
      <input type="hidden" name="submission_version_id" value={submissionVersionId} />
      {state.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{state.error}</div></div>}
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? strings.starting : strings.start}</button>
    </form>
  );
}
