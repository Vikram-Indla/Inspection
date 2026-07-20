"use client";
import { useActionState, useState } from "react";
import { decideEnforcementRecommendation, type DecideResult } from "./actions";

export type DecideStrings = {
  approve: string; reject: string; reasonLabel: string; reasonPlaceholder: string; submit: string; recording: string;
};

export default function DecideForm({ id, strings }: { id: string; strings: DecideStrings }) {
  const [state, formAction, pending] = useActionState<DecideResult, FormData>(decideEnforcementRecommendation, {});
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--ax-space-150)" }}>
      <input type="hidden" name="id" value={id} />
      <div className="ax-row">
        <label className="ax-choice"><input type="radio" name="decision" value="approved" checked={decision === "approved"} onChange={() => setDecision("approved")} /> {strings.approve}</label>
        <label className="ax-choice"><input type="radio" name="decision" value="rejected" checked={decision === "rejected"} onChange={() => setDecision("rejected")} /> {strings.reject}</label>
      </div>
      <label className="ax-field">
        <span className="ax-field__label">{strings.reasonLabel}</span>
        <textarea className="ax-textarea" name="decision_reason" rows={2} placeholder={strings.reasonPlaceholder} />
      </label>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      <button type="submit" className="ax-btn ax-btn--prominent" aria-disabled={pending}>{pending ? strings.recording : strings.submit}</button>
    </form>
  );
}
