"use client";
import { useActionState } from "react";
import { recordSignatureAct, type CmteResult } from "./actions";

export function RecordSignature({ strings: s }: { strings: { record: string; recording: string; recorded: string; kind: string; outcome: string } }) {
  const [state, action, pending] = useActionState<CmteResult, FormData>(recordSignatureAct, {});
  return (
    <form action={action} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="committee-signature-kind">{s.kind}</label>
        <select className="ax-input" name="kind" id="committee-signature-kind"><option value="signature">signature</option><option value="refusal">refusal</option></select></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="committee-signature-outcome">{s.outcome}</label>
        <select className="ax-input" name="outcome" id="committee-signature-outcome"><option value="captured">captured</option><option value="refused">refused</option><option value="queued">queued</option><option value="failed">failed</option></select></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.recording : s.record}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.recorded}</span>}
    </form>
  );
}
