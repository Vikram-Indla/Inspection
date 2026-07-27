"use client";
import { useActionState, useEffect, useState } from "react";
import { decideEnforcementRecommendation, type DecideResult } from "./actions";

export type DecideStrings = {
  approve: string; reject: string; reasonLabel: string; reasonPlaceholder: string; submit: string; recording: string;
  success: string;
  errors: Record<NonNullable<DecideResult["error"]>, string>;
};

export default function DecideForm({ id, strings }: { id: string; strings: DecideStrings }) {
  const [state, formAction, pending] = useActionState<DecideResult, FormData>(decideEnforcementRecommendation, {});
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  useEffect(() => setIdempotencyKey(crypto.randomUUID()), []);
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--space-3)" }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <div className="row">
        <label className="sq-choice"><input type="radio" name="decision" value="approved" checked={decision === "approved"} onChange={() => setDecision("approved")} /> {strings.approve}</label>
        <label className="sq-choice"><input type="radio" name="decision" value="rejected" checked={decision === "rejected"} onChange={() => setDecision("rejected")} /> {strings.reject}</label>
      </div>
      <label className="sq-field">
        <span className="sq-field__label">{strings.reasonLabel}</span>
        <textarea className="sq-textarea" name="decision_reason" rows={2} required maxLength={2000} placeholder={strings.reasonPlaceholder} />
      </label>
      {state.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{strings.errors[state.error]}</div></div>}
      {state.ok && <div className="sq-banner sq-banner--success" role="status"><div>{strings.success}</div></div>}
      <button type="submit" className="btn btn-primary btn-lg btn-touch" aria-disabled={pending} disabled={pending}>{pending ? strings.recording : strings.submit}</button>
    </form>
  );
}
