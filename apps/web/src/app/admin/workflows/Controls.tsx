"use client";
import { useActionState, useId } from "react";
import { proposeWorkflowDraft, saveWorkflowDraft, approvePublishWorkflow, type WfResult } from "./actions";

// SCR-ADM-050/051 · ENG-03 — client controls consume server-built strings only (SB19).
export type WfStrings = {
  newVersionLabel: string;
  proposing: string;
  propose: string;
  draftCreated: string;
  payloadLabel: string;
  saving: string;
  saveDraft: string;
  saved: string;
  publishing: string;
  approvePublish: string;
};

// SCR-ADM-051 · ENG-03 — propose a governed draft cloned from a published version.
export function ProposeDraftForm({ baseVersionId, baseLabel, strings: s }: { baseVersionId: string; baseLabel: string; strings: WfStrings }) {
  const [state, formAction, pending] = useActionState<WfResult, FormData>(proposeWorkflowDraft, {});
  const fieldId = useId();
  return (
    <form action={formAction} className="row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="base_version_id" value={baseVersionId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${fieldId}-version-label`}>{s.newVersionLabel}</label>
        <input className="ax-input numeric" name="version_label" id={`${fieldId}-version-label`} placeholder={`${baseLabel}-next`} required /></div>
      <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.proposing : s.propose}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{s.draftCreated}</span>}
    </form>
  );
}

// Draft payload editor — full state-machine JSON, validated server-side.
export function DraftPayloadEditor({ versionId, payload, strings: s }: { versionId: string; payload: object; strings: WfStrings }) {
  const [state, formAction, pending] = useActionState<WfResult, FormData>(saveWorkflowDraft, {});
  const fieldId = useId();
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${fieldId}-payload`}>{s.payloadLabel}</label>
        <textarea className="ax-input numeric" name="payload" id={`${fieldId}-payload`} rows={14} defaultValue={JSON.stringify(payload, null, 2)} spellCheck={false} /></div>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
        <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.saving : s.saveDraft}</button>
        {state.ok && <span className="badge badge-compliant">{s.saved}</span>}
      </div>
    </form>
  );
}

// RBAC-002 — a distinct approver publishes; self-approval is rejected by the DB.
export function ApprovePublish({ versionId, strings: s }: { versionId: string; strings: WfStrings }) {
  const [state, formAction, pending] = useActionState<WfResult, FormData>(approvePublishWorkflow, {});
  return (
    <form action={formAction} className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? s.publishing : s.approvePublish}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}
