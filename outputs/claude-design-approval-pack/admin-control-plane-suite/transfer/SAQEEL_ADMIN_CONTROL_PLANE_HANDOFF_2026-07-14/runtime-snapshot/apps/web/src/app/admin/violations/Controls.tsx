"use client";
import { useActionState } from "react";
import { createViolationCode, createPenaltyMapping, type VioResult } from "./actions";

export type ClauseOption = { id: string; label: string };

// SCR-ADM-040/041 · ENG-08 — client controls consume server-built strings only (SB19).
export type VioStrings = {
  code: string;
  title: string;
  titlePlaceholder: string;
  level: string;
  levelPlaceholder: string;
  clause: string;
  selectClause: string;
  activeFrom: string;
  creating: string;
  create: string;
  created: string;
  penaltyRef: string;
  legalBasis: string;
  legalBasisPlaceholder: string;
  mappingVersion: string;
  penaltyRange: string;
  rangeApproved: string;
  rangeNone: string;
  repeatRule: string;
  repeatEscalate: string;
  repeatNone: string;
  mapping: string;
  mapTo: string;
  mapped: string;
};

// SCR-ADM-040 · ENG-08 — create a violation code anchored to a clause.
export function NewViolationForm({ clauses, strings: s }: { clauses: ClauseOption[]; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(createViolationCode, {});
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label">{s.code}</label>
        <input className="ax-input ax-numeric" name="code" placeholder="V-FS-12" required style={{ maxInlineSize: 120 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label">{s.title}</label>
        <input className="ax-input" name="title" placeholder={s.titlePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{s.level}</label>
        <select className="ax-select" name="level" required defaultValue="">
          <option value="" disabled>{s.levelPlaceholder}</option>
          <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
        </select></div>
      <div className="ax-field" style={{ minInlineSize: 200 }}><label className="ax-field__label">{s.clause}</label>
        <select className="ax-select" name="clause_id" required defaultValue="">
          <option value="" disabled>{s.selectClause}</option>
          {clauses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select></div>
      <div className="ax-field"><label className="ax-field__label">{s.activeFrom}</label>
        <input className="ax-input ax-numeric" name="active_from" type="date" required /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
    </form>
  );
}

// SCR-ADM-041 · M09-004 — one penalty mapping per violation (DB-unique);
// presets keep penalty_range/repeat_rule aligned with the approved schedule.
export function AddMappingForm({ violationId, violationCode, strings: s }: { violationId: string; violationCode: string; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(createPenaltyMapping, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="violation_code_id" value={violationId} />
      <div className="ax-field"><label className="ax-field__label">{s.penaltyRef}</label>
        <input className="ax-input ax-numeric" name="penalty_ref" placeholder="P-042" required style={{ maxInlineSize: 100 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label">{s.legalBasis}</label>
        <input className="ax-input" name="legal_basis" placeholder={s.legalBasisPlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{s.mappingVersion}</label>
        <input className="ax-input ax-numeric" name="mapping_version" placeholder="v3" required style={{ maxInlineSize: 90 }} /></div>
      <div className="ax-field"><label className="ax-field__label">{s.penaltyRange}</label>
        <select className="ax-select" name="penalty_range_preset" required defaultValue="schedule_approved">
          <option value="schedule_approved">{s.rangeApproved}</option>
          <option value="none">{s.rangeNone}</option>
        </select></div>
      <div className="ax-field"><label className="ax-field__label">{s.repeatRule}</label>
        <select className="ax-select" name="repeat_rule_preset" required defaultValue="escalate_one_level">
          <option value="escalate_one_level">{s.repeatEscalate}</option>
          <option value="none">{s.repeatNone}</option>
        </select></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.mapping : `${s.mapTo} ${violationCode}`}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.mapped}</span>}
    </form>
  );
}
