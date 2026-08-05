"use client";
import { useActionState } from "react";
import { transitionExternalRequest, transitionSelfAssessment, type PortalResult } from "./actions";

export function ReviewAction({ id, kind, status, strings: s }: {
  id: string;
  kind: "request" | "self-assessment";
  status: string;
  strings: { start: string; decision: string; reason: string; apply: string; applying: string; saved: string };
}) {
  const action = kind === "request" ? transitionExternalRequest : transitionSelfAssessment;
  const [state, submit, pending] = useActionState<PortalResult, FormData>(action, {});
  const startReview = kind === "request" && status === "submitted";
  return (
    <form action={submit} className="stack">
      <input type="hidden" name="id" value={id} />
      {startReview ? <input type="hidden" name="to_status" value="in_review" /> : (
        <div className="field">
          <label htmlFor={`decision-${id}`}>{s.decision}</label>
          <select className="select" id={`decision-${id}`} name="to_status" required>
            <option value="">Decision required</option>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
            <option value="returned">returned</option>
          </select>
        </div>
      )}
      {!startReview && <div className="field"><label htmlFor={`reason-${id}`}>{s.reason}</label><input className="input" id={`reason-${id}`} name="reason" required /></div>}
      <div className="row">
        <button className="btn btn-primary" disabled={pending}>{pending ? s.applying : startReview ? s.start : s.apply}</button>
        {state.error && <span className="field-error" role="alert">{state.error}</span>}
        {state.ok && <span className="badge badge-compliant">{s.saved}</span>}
      </div>
    </form>
  );
}
