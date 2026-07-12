"use client";
import { useActionState, useState } from "react";
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
  return (
    <form action={formAction} className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", position: "sticky", insetBlockStart: 16, display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>{strings.heading}</h4>
      <input type="hidden" name="review_id" value={reviewId} />
      <div className="ax-row">
        {["approve", "return", "reject"].map(d => (
          <label key={d} className="ax-choice"><input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} /> {strings.decisions[d] ?? d}</label>
        ))}
      </div>
      {decision === "return" && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-200)" }}>
          <p className="ax-overline" style={{ marginBlockEnd: 8 }}>{strings.returnScopeTitle}</p>
          {sections.map(s => (
            <label key={s.key} className="ax-choice" style={{ display: "flex" }}><input type="checkbox" name="returned_section" value={s.key} /> {s.title}</label>
          ))}
          <p className="ax-caption">{strings.returnScopeHint}</p>
        </div>
      )}
      <div className="ax-field" style={{ maxInlineSize: "none" }}>
        <label className="ax-field__label">{strings.reason} {decision !== "approve" && <span className="ax-req">*</span>}</label>
        <textarea className="ax-textarea" name="reason" placeholder={strings.reasonPlaceholder} />
      </div>
      {state.error && <div className="ax-banner ax-banner--critical"><div>{state.error}</div></div>}
      {decision === "approve" && <div className="ax-banner ax-banner--warning"><div><strong>{strings.approveWarnTitle}</strong> {strings.approveWarnBody}</div></div>}
      {decision === "reject" && <div className="ax-banner ax-banner--critical"><div><strong>{strings.rejectWarnTitle}</strong> {strings.rejectWarnBody}</div></div>}
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.recording : strings.confirm.replace("{decision}", strings.decisions[decision] ?? decision)}</button>
      <p className="ax-caption">{strings.audited}</p>
    </form>
  );
}
