"use client";
import { useActionState, useEffect, useRef } from "react";
import { createDraftVersion, approveAndPublish, type PkgResult } from "./actions";

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
};

export function NewDraftForm({ packageId, strings: s }: { packageId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createDraftVersion, {});
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.ok) feedbackRef.current?.focus(); }, [state]);
  return (
    <form action={formAction} className="ax-row" aria-busy={pending} style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="package_id" value={packageId} />
      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`version-label-${packageId}`}>{s.newDraftLabel}</label>
        <input id={`version-label-${packageId}`} className="ax-input ax-numeric" name="version_label" placeholder={s.versionPlaceholder} required autoComplete="off" />
      </div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`effective-from-${packageId}`}>{s.effectiveFrom}</label><input id={`effective-from-${packageId}`} className="ax-input ax-numeric" type="date" name="effective_from" required /></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.creating : s.createDraft}</button>
      <div ref={feedbackRef} tabIndex={-1}>
        {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
        {state.ok && <span className="ax-lozenge ax-lozenge--success" role="status"><span aria-hidden="true">✓ </span>{s.draftCreated}</span>}
      </div>
    </form>
  );
}

export function ApprovePublish({ versionId, strings: s }: { versionId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(approveAndPublish, {});
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.ok) feedbackRef.current?.focus(); }, [state]);
  return (
    <form action={formAction} aria-busy={pending} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-100)", alignItems: "flex-start" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <p className="ax-caption">{s.publishHint}</p>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>
        {pending ? s.publishing : s.approvePublish}
      </button>
      <div ref={feedbackRef} tabIndex={-1}>
        {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div style={{ whiteSpace: "pre-line" }}>{state.error}</div></div>}
        {state.ok && <div className="ax-banner ax-banner--success" role="status"><div><span aria-hidden="true">✓ </span>{s.published}</div></div>}
      </div>
    </form>
  );
}
