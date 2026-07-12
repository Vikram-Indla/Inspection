"use client";
import { useActionState } from "react";
import { createRegulation, publishRegulation, addClause, type RegResult } from "./actions";

// SCR-ADM-010/011 — client controls consume server-built strings only (SB19).
export type RegStrings = {
  code: string;
  title: string;
  issuingAuthority: string;
  titlePlaceholder: string;
  creating: string;
  create: string;
  created: string;
  clauseRef: string;
  legalSource: string;
  legalSourcePlaceholder: string;
  adding: string;
  addClause: string;
  added: string;
  publishing: string;
  publish: string;
};

export function NewRegulationForm({ strings: s }: { strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(createRegulation, {});
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label">{s.code}</label>
        <input className="ax-input ax-numeric" name="code" placeholder="SBC-501" required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label">{s.title}</label>
        <input className="ax-input" name="title" placeholder={s.titlePlaceholder} required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label">{s.issuingAuthority}</label>
        <input className="ax-input" name="issuing_authority" /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
    </form>
  );
}

export function AddClauseForm({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(addClause, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="regulation_id" value={regulationId} />
      <div className="ax-field"><label className="ax-field__label">{s.clauseRef}</label>
        <input className="ax-input ax-numeric" name="clause_ref" placeholder="4.2" required style={{ maxInlineSize: 100 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label">{s.title}</label>
        <input className="ax-input" name="title" required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 180 }}><label className="ax-field__label">{s.legalSource}</label>
        <input className="ax-input" name="legal_source" placeholder={s.legalSourcePlaceholder} /></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.adding : s.addClause}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.added}</span>}
    </form>
  );
}

export function PublishRegulation({ regulationId, strings: s }: { regulationId: string; strings: RegStrings }) {
  const [state, formAction, pending] = useActionState<RegResult, FormData>(publishRegulation, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
      <input type="hidden" name="regulation_id" value={regulationId} />
      <button className="ax-btn" disabled={pending}>{pending ? s.publishing : s.publish}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}
