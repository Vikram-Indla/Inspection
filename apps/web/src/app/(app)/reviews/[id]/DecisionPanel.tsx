"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { decide, type DecisionResult } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type WorkspaceDecisionStrings = {
  heading: string;
  decisions: Record<string, string>;
  returnScopeTitle: string; returnScopeHint: string;
  reason: string; reasonPlaceholder: string;
  approveWarnTitle: string; approveWarnBody: string;
  rejectWarnTitle: string; rejectWarnBody: string;
  confirm: string; recording: string; audited: string;
};

export default function DecisionPanel({ reviewId, sections, strings }: { reviewId: string; sections: { key: string; title: string }[]; strings: WorkspaceDecisionStrings }) {
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(decide, {});
  const [decision, setDecision] = useState("approve");
  const errorRef = useRef<HTMLDivElement>(null);
  const reasonId = `review-reason-${reviewId}`;
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);
  return (
    <form action={formAction} className="panel" style={{ padding: "var(--space-6)", position: "sticky", insetBlockStart: 16, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h2>{strings.heading}</h2>
      <input type="hidden" name="review_id" value={reviewId} />
      <div className="row">
        {["approve", "return", "reject"].map(d => (
          <label key={d} className="sq-choice"><input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} /> {strings.decisions[d] ?? d}</label>
        ))}
      </div>
      {decision === "return" && (
        <div className="panel" style={{ padding: "var(--space-4)" }}>
          <p className="sq-overline" style={{ marginBlockEnd: 8 }}>{strings.returnScopeTitle}</p>
          {sections.map(s => (
            <label key={s.key} className="sq-choice" style={{ display: "flex" }}><input type="checkbox" name="returned_section" value={s.key} /> {s.title}</label>
          ))}
          <p className="t-caption">{strings.returnScopeHint}</p>
        </div>
      )}
      <div className="sq-field" style={{ maxInlineSize: "none" }}>
        <label className="sq-field__label" htmlFor={reasonId}>{strings.reason} {decision !== "approve" && <span className="sq-req">*</span>}</label>
        <textarea id={reasonId} className="sq-textarea" name="reason" placeholder={strings.reasonPlaceholder} aria-required={decision !== "approve"} />
      </div>
      {state.error && <div ref={errorRef} tabIndex={-1} className="sq-banner sq-banner--critical" role="alert"><div>{state.error}</div></div>}
      {decision === "approve" && <div className="sq-banner sq-banner--warning"><div><strong>{strings.approveWarnTitle}</strong> {strings.approveWarnBody}</div></div>}
      {decision === "reject" && <div className="sq-banner sq-banner--critical"><div><strong>{strings.rejectWarnTitle}</strong> {strings.rejectWarnBody}</div></div>}
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? strings.recording : strings.confirm.replace("{decision}", strings.decisions[decision] ?? decision)}</button>
      <p className="t-caption">{strings.audited}</p>
    </form>
  );
}
