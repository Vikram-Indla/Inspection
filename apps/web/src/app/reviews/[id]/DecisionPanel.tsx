"use client";
import { useActionState, useState } from "react";
import { decide, type DecisionResult } from "./actions";

export default function DecisionPanel({ reviewId, sections }: { reviewId: string; sections: { key: string; title: string }[] }) {
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(decide, {});
  const [decision, setDecision] = useState<string>("approve");
  return (
    <form action={formAction} className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", position: "sticky", insetBlockStart: 16, display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>Decision — irreversible once confirmed</h4>
      <input type="hidden" name="review_id" value={reviewId} />
      <div className="ax-row">
        {["approve", "return", "reject"].map(d => (
          <label key={d} className="ax-choice"><input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} /> {d}</label>
        ))}
      </div>
      {decision === "return" && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-200)" }}>
          <p className="ax-overline" style={{ marginBlockEnd: 8 }}>Exact return scope (STM-REV-003)</p>
          {sections.map(s => (
            <label key={s.key} className="ax-choice" style={{ display: "flex" }}><input type="checkbox" name="returned_section" value={s.key} /> {s.title}</label>
          ))}
          <p className="ax-caption">Only selected sections unlock; the rest stays locked (M06-006/043).</p>
        </div>
      )}
      <div className="ax-field" style={{ maxInlineSize: "none" }}>
        <label className="ax-field__label">Reason {decision !== "approve" && <span className="ax-req">*</span>}</label>
        <textarea className="ax-textarea" name="reason" placeholder="mandatory for return/reject — recorded immutably" />
      </div>
      {state.error && <div className="ax-banner ax-banner--critical"><div>{state.error}</div></div>}
      {decision === "approve" && <div className="ax-banner ax-banner--warning"><div><strong>Irreversible (M06-002):</strong> locks the version, triggers compliance chain.</div></div>}
      {decision === "reject" && <div className="ax-banner ax-banner--critical"><div><strong>Final (M06-007/008):</strong> no compliance trigger; new inspection needs a new visit.</div></div>}
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? "Recording…" : `Confirm ${decision}`}</button>
      <p className="ax-caption">Audited: reviewer, reason, sections, prior/new status, version, timestamp (M06-009/027).</p>
    </form>
  );
}
