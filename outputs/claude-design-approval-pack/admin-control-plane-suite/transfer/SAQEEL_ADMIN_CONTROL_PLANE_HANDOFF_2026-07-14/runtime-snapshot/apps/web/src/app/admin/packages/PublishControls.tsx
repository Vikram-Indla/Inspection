"use client";
import { useActionState } from "react";
import { createDraftVersion, approveAndPublish, type PkgResult } from "./actions";

// SCR-ADM-030/031 — client controls consume server-built strings only (SB19).
export type PublishStrings = {
  newDraftLabel: string;
  creating: string;
  createDraft: string;
  draftCreated: string;
  publishing: string;
  approvePublish: string;
};

export function NewDraftForm({ packageId, strings: s }: { packageId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(createDraftVersion, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="package_id" value={packageId} />
      <div className="ax-field">
        <label className="ax-field__label">{s.newDraftLabel}</label>
        <input className="ax-input ax-numeric" name="version_label" placeholder="v2026.08" required />
      </div>
      <button className="ax-btn" disabled={pending}>{pending ? s.creating : s.createDraft}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.draftCreated}</span>}
    </form>
  );
}

export function ApprovePublish({ versionId, strings: s }: { versionId: string; strings: PublishStrings }) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(approveAndPublish, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <button className="ax-btn ax-btn--prominent" disabled={pending}>
        {pending ? s.publishing : s.approvePublish}
      </button>
      {state.error && (
        <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>
      )}
    </form>
  );
}
