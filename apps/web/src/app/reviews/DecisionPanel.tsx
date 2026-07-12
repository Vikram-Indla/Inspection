"use client";
import { useActionState, useState } from "react";
import { decideReview, type DecisionResult } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type DecisionPanelStrings = {
  heading: string; awaiting: string;
  decisions: Record<string, string>;
  returnScope: string; reason: string; record: string; recording: string;
};

export default function DecisionPanel({ reviewId, factory, strings }: { reviewId: string; factory: string; strings: DecisionPanelStrings }) {
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(decideReview, {});
  const [decision, setDecision] = useState("");
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between" }}>
        <h4>{strings.heading.replace("{factory}", factory)}</h4>
        <span className="ax-lozenge ax-lozenge--warning">{strings.awaiting}</span>
      </div>
      <input type="hidden" name="review_id" value={reviewId} />
      <div className="ax-row" style={{ gap: "var(--ax-space-300)" }}>
        {(["approve", "return", "reject"] as const).map(d => (
          <label key={d} className="ax-choice" style={{ display: "flex" }}>
            <input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} />
            <span>{strings.decisions[d] ?? d}</span>
          </label>
        ))}
      </div>
      {decision === "return" && (
        <div className="ax-field" style={{ maxInlineSize: "none" }}>
          <label className="ax-field__label">{strings.returnScope}</label>
          <input className="ax-input" name="returned_sections" placeholder="s1, s3" />
        </div>
      )}
      <div className="ax-field" style={{ maxInlineSize: "none" }}>
        <label className="ax-field__label">{strings.reason}</label>
        <textarea className="ax-input" name="reason" rows={2} required />
      </div>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending || !decision}>
          {pending ? strings.recording : strings.record}
        </button>
      </div>
    </form>
  );
}
