"use client";
import { useActionState, useEffect, useRef } from "react";
import { createPackage, createDraftVersion, approveAndPublish, deactivatePackageVersion, type PkgResult } from "./actions";

// INSP-747 / CC-ADMIN-PACKAGE-CREATION-20260805
export type NewPackageStrings = {
  heading: string;
  codeLabel: string; codePlaceholder: string;
  titleLabel: string; titlePlaceholder: string;
  scopeLabel: string; scopePlaceholder: string;
  create: string; creating: string; created: string;
};

export function NewPackageForm({ strings: s }: { strings: NewPackageStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createPackage, {});
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.ok) feedbackRef.current?.focus(); }, [state]);
  return (
    <section className="panel stack" aria-labelledby="pkg-create-heading">
      <h3 id="pkg-create-heading" style={{ margin: 0 }}>{s.heading}</h3>
      <form action={formAction} className="row" aria-busy={pending} style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="new-package-code">{s.codeLabel}</label>
          <input id="new-package-code" className="sq-input" name="code" placeholder={s.codePlaceholder} required autoComplete="off" />
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="new-package-title">{s.titleLabel}</label>
          <input id="new-package-title" className="sq-input" name="title" placeholder={s.titlePlaceholder} required autoComplete="off" />
        </div>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="new-package-scope">{s.scopeLabel}</label>
          <input id="new-package-scope" className="sq-input" name="scope" placeholder={s.scopePlaceholder} autoComplete="off" />
        </div>
        <button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.creating : s.create}</button>
        <div ref={feedbackRef} tabIndex={-1}>
          {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
          {state.ok && <span className="badge badge-compliant" role="status"><span aria-hidden="true">✓ </span>{s.created}</span>}
        </div>
      </form>
    </section>
  );
}

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
      <div className="sq-field">
        <label className="sq-field__label" htmlFor={`version-label-${packageId}`}>{s.newDraftLabel}</label>
        <input id={`version-label-${packageId}`} className="sq-input numeric" name="version_label" placeholder={s.versionPlaceholder} required autoComplete="off" />
      </div>
      <div className="sq-field"><label className="sq-field__label" htmlFor={`effective-from-${packageId}`}>{s.effectiveFrom}</label><input id={`effective-from-${packageId}`} className="sq-input numeric" type="date" name="effective_from" required /></div>
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
  return <form action={formAction} className="row" style={{ gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}><input type="hidden" name="version_id" value={versionId}/><label className="sq-field"><span className="sq-field__label">{s.effectiveTo}</span><input className="sq-input" type="date" name="effective_to" required/></label><label className="sq-field"><span className="sq-field__label">{s.deactivationReason}</span><input className="sq-input" name="deactivation_reason" required/></label><button className="btn btn-primary btn-touch" disabled={pending}>{pending ? s.deactivating : s.deactivate}</button>{state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}{state.ok && <span className="badge badge-compliant" role="status">✓ {s.deactivated}</span>}</form>;
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
        {state.error && <div className="sq-banner sq-banner--critical" role="alert"><div style={{ whiteSpace: "pre-line" }}>{state.error}</div></div>}
        {state.ok && <div className="sq-banner sq-banner--success" role="status"><div><span aria-hidden="true">✓ </span>{s.published}</div></div>}
      </div>
    </form>
  );
}
