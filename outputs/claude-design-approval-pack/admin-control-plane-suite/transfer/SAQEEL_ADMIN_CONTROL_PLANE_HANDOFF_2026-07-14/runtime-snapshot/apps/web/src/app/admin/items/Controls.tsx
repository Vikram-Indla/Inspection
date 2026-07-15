"use client";
import { useActionState } from "react";
import { createItem, toggleItemActive, type ItemResult } from "./actions";

export type ClauseOption = { id: string; label: string };

// SCR-ADM-020 · ENG-01 — client controls consume server-built strings only (SB19).
export type ItemStrings = {
  code: string;
  title: string;
  titlePlaceholder: string;
  clause: string;
  selectClause: string;
  weight: string;
  responseModel: string;
  responseTriState: string;
  responseBinary: string;
  responseValueDate: string;
  evidenceRule: string;
  evidenceNone: string;
  evidencePhotoNc: string;
  guidance: string;
  guidancePlaceholder: string;
  creating: string;
  create: string;
  created: string;
  saving: string;
  deactivate: string;
  reactivate: string;
};

// SCR-ADM-020 · ENG-01 — create item against a clause with governed presets.
export function NewItemForm({ clauses, strings: s }: { clauses: ClauseOption[]; strings: ItemStrings }) {
  const [state, formAction, pending] = useActionState<ItemResult, FormData>(createItem, {});
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label">{s.code}</label>
        <input className="ax-input ax-numeric" name="code" placeholder="FS-110" required style={{ maxInlineSize: 120 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label">{s.title}</label>
        <input className="ax-input" name="title" placeholder={s.titlePlaceholder} required /></div>
      <div className="ax-field" style={{ minInlineSize: 200 }}><label className="ax-field__label">{s.clause}</label>
        <select className="ax-select" name="clause_id" required defaultValue="">
          <option value="" disabled>{s.selectClause}</option>
          {clauses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select></div>
      <div className="ax-field"><label className="ax-field__label">{s.weight}</label>
        <input className="ax-input ax-numeric" name="score_weight" inputMode="decimal" placeholder="5" style={{ maxInlineSize: 80 }} /></div>
      <div className="ax-field" style={{ minInlineSize: 240 }}><label className="ax-field__label">{s.responseModel}</label>
        <select className="ax-select" name="response_preset" required defaultValue="tri_state">
          <option value="tri_state">{s.responseTriState}</option>
          <option value="binary">{s.responseBinary}</option>
          <option value="value_date">{s.responseValueDate}</option>
        </select></div>
      <div className="ax-field" style={{ minInlineSize: 240 }}><label className="ax-field__label">{s.evidenceRule}</label>
        <select className="ax-select" name="evidence_preset" required defaultValue="none">
          <option value="none">{s.evidenceNone}</option>
          <option value="photo_nc_mandatory">{s.evidencePhotoNc}</option>
        </select></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label">{s.guidance}</label>
        <input className="ax-input" name="guidance_en" placeholder={s.guidancePlaceholder} /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
    </form>
  );
}

// M09-014 — deactivate/reactivate; history is preserved, never deleted.
export function ToggleActive({ itemId, active, strings: s }: { itemId: string; active: boolean; strings: ItemStrings }) {
  const [state, formAction, pending] = useActionState<ItemResult, FormData>(toggleItemActive, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="next_active" value={active ? "false" : "true"} />
      <button className="ax-btn" disabled={pending}>
        {pending ? s.saving : active ? s.deactivate : s.reactivate}
      </button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}
