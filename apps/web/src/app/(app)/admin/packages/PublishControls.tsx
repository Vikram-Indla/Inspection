"use client";
import { useActionState, useEffect, useRef } from "react";
import { createDraftVersion, approveAndPublish, deactivatePackageVersion, type PkgResult } from "./actions";

// SCR-ADM-030/031 — client controls consume server-built strings only (SB19).
export type PublishStrings = {
  newDraftLabel: string;
  creating: string;
  createDraft: string;
  draftCreated: string;
  versionPlaceholder: string;
  effectiveFrom: string;
  publishing: string;
  approvePublish: string;
  published: string;
  publishHint: string;
  effectiveTo: string; deactivationReason: string; deactivate: string; deactivating: string; deactivated: string;
};

export function NewDraftForm({ packageId, strings: s }: { packageId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createDraftVersion, {});
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.ok) feedbackRef.current?.focus(); }, [state]);
  return (
    <form action={formAction} className="row" aria-busy={pending} style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="package_id" value={packageId} />
      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`version-label-${packageId}`}>{s.newDraftLabel}</label>
        <input id={`version-label-${packageId}`} className="ax-input numeric" name="version_label" placeholder={s.versionPlaceholder} required autoComplete="off" />
      </div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`effective-from-${packageId}`}>{s.effectiveFrom}</label><input id={`effective-from-${packageId}`} className="ax-input numeric" type="date" name="effective_from" required /></div>
      <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.creating : s.createDraft}</button>
      <div ref={feedbackRef} tabIndex={-1}>
        {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
        {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓ </span>{s.draftCreated}</span>}
      </div>
    </form>
  );
}

export function DeactivatePackage({ versionId, strings: s }: { versionId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(deactivatePackageVersion, {});
  return <form action={formAction} className="row" style={{ gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}><input type="hidden" name="version_id" value={versionId}/><label className="ax-field"><span className="ax-field__label">{s.effectiveTo}</span><input className="ax-input" type="date" name="effective_to" required/></label><label className="ax-field"><span className="ax-field__label">{s.deactivationReason}</span><input className="ax-input" name="deactivation_reason" required/></label><button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.deactivating : s.deactivate}</button>{state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}{state.ok && <span className="badge badge-compliant" role="status">✓ {s.deactivated}</span>}</form>;
}

export function ApprovePublish({ versionId, strings: s }: { versionId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(approveAndPublish, {});
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.ok) feedbackRef.current?.focus(); }, [state]);
  return (
    <form action={formAction} aria-busy={pending} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "flex-start" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <p className="t-caption">{s.publishHint}</p>
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>
        {pending ? s.publishing : s.approvePublish}
      </button>
      <div ref={feedbackRef} tabIndex={-1}>
        {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div style={{ whiteSpace: "pre-line" }}>{state.error}</div></div>}
        {state.ok && <div className="ax-banner ax-banner--success" role="status"><div><span aria-hidden="true">✓ </span>{s.published}</div></div>}
      </div>
    </form>
  );
}
