"use client";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createViolationCode, createPenaltyMapping, deactivateViolationCode, publishPenaltyMapping, publishViolationCode, type VioResult } from "./actions";

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
  correctiveAction: string; gracePeriod: string; category: string; applicability: string; configurationVersion: string;
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
  approveMapping: string;
  publishingMapping: string;
  mappingPublished: string;
  activeTo: string;
  deactivating: string;
  deactivate: string;
  deactivated: string;
  validationLens: string;
  checkUnmapped: string;
  checkUnique: string;
  checkLegalBasis: string;
  checkPresets: string;
  pass: string;
  needsAttention: string;
  deactivationReason: string; penaltyType: string; amount: string; duePeriod: string; template: string; none: string;
  publishCode: string; publishingCode: string; codePublished: string;
};

// SCR-ADM-040 · ENG-08 — create a violation code anchored to a clause.
export function NewViolationForm({ clauses, strings: s }: { clauses: ClauseOption[]; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(createViolationCode, {});
  const errorRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);
  return (
    <form action={formAction} className="ax-surface" aria-label={s.create} style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-code">{s.code}</label>
        <input id="new-violation-code" className="ax-input ax-numeric" name="code" placeholder="V-FS-12" required style={{ maxInlineSize: 120 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 220 }}><label className="ax-field__label" htmlFor="new-violation-title">{s.title}</label>
        <input id="new-violation-title" className="ax-input" name="title" placeholder={s.titlePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-level">{s.level}</label>
        <select id="new-violation-level" className="ax-select" name="level" required defaultValue="">
          <option value="" disabled>{s.levelPlaceholder}</option>
          <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
        </select></div>
      <div className="ax-field" style={{ minInlineSize: 200 }}><label className="ax-field__label" htmlFor="new-violation-clause">{s.clause}</label>
        <select id="new-violation-clause" className="ax-select" name="clause_id" required defaultValue="">
          <option value="" disabled>{s.selectClause}</option>
          {clauses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-active-from">{s.activeFrom}</label>
        <input id="new-violation-active-from" className="ax-input ax-numeric" name="active_from" type="date" required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 240 }}><label className="ax-field__label" htmlFor="new-violation-corrective">{s.correctiveAction}</label><input id="new-violation-corrective" className="ax-input" name="corrective_action" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-grace">{s.gracePeriod}</label><input id="new-violation-grace" className="ax-input" name="grace_period_days" type="number" min="0" step="1" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-category">{s.category}</label><input id="new-violation-category" className="ax-input" name="category" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-applicability">{s.applicability}</label><input id="new-violation-applicability" className="ax-input" name="applicability" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="new-violation-version">{s.configurationVersion}</label><input id="new-violation-version" className="ax-input" name="configuration_version" type="number" min="1" step="1" defaultValue="1" required /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.creating : s.create}</button>
      {state.error && <span ref={errorRef} tabIndex={-1} className="ax-validation" role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success" role="status"><span aria-hidden="true">✓</span> {s.created}</span>}
    </form>
  );
}

// SCR-ADM-041 · M09-004 — one penalty mapping per violation (DB-unique);
// presets keep penalty_range/repeat_rule aligned with the approved schedule.
export function AddMappingForm({ violationId, violationCode, templates, strings: s }: { violationId: string; violationCode: string; templates: { id: string; label: string }[]; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(createPenaltyMapping, {});
  const [legalBasis, setLegalBasis] = useState("");
  const [rangePreset, setRangePreset] = useState("schedule_approved");
  const [repeatPreset, setRepeatPreset] = useState("escalate_one_level");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLSpanElement>(null);
  const baseId = useId().replace(/:/g, "");
  useEffect(() => {
    if (!state.error) return;
    const invalid = formRef.current?.querySelector<HTMLElement>(":invalid");
    (invalid ?? errorRef.current)?.focus();
  }, [state.error]);
  const check = (ok: boolean, label: string) => (
    <li><span aria-hidden="true">{ok ? "✓" : "✕"}</span> {ok ? s.pass : s.needsAttention} — {label}</li>
  );
  return (
    <form ref={formRef} action={formAction} className="ax-stack" aria-label={`${s.mapTo} ${violationCode}`} style={{ gap: "var(--ax-space-150)" }}>
      <input type="hidden" name="violation_code_id" value={violationId} />
      <div className="ax-surface ax-stack" role="status" aria-live="polite" aria-label={s.validationLens} style={{ padding: "var(--ax-space-150)", gap: "var(--ax-space-050)" }}>
        <strong>{s.validationLens}</strong>
        <ul style={{ margin: 0, paddingInlineStart: "var(--ax-space-250)" }}>
          {check(true, s.checkUnmapped)}
          {check(true, s.checkUnique)}
          {check(Boolean(legalBasis.trim()), s.checkLegalBasis)}
          {check(Boolean(rangePreset && repeatPreset), s.checkPresets)}
        </ul>
      </div>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-penalty-ref`}>{s.penaltyRef}</label>
        <input id={`${baseId}-penalty-ref`} className="ax-input ax-numeric" name="penalty_ref" placeholder="P-042" required style={{ maxInlineSize: 100 }} /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label" htmlFor={`${baseId}-legal-basis`}>{s.legalBasis}</label>
        <input id={`${baseId}-legal-basis`} className="ax-input" name="legal_basis" placeholder={s.legalBasisPlaceholder} required value={legalBasis} onChange={e => setLegalBasis(e.target.value)} /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-mapping-version`}>{s.mappingVersion}</label>
        <input id={`${baseId}-mapping-version`} className="ax-input ax-numeric" name="mapping_version" placeholder="v3" required style={{ maxInlineSize: 90 }} /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-effective-from`}>{s.activeFrom}</label>
        <input id={`${baseId}-effective-from`} className="ax-input ax-numeric" name="effective_from" type="date" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-range`}>{s.penaltyRange}</label>
        <select id={`${baseId}-range`} className="ax-select" name="penalty_range_preset" required value={rangePreset} onChange={e => setRangePreset(e.target.value)}>
          <option value="schedule_approved">{s.rangeApproved}</option>
          <option value="none">{s.rangeNone}</option>
        </select></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-repeat`}>{s.repeatRule}</label>
        <select id={`${baseId}-repeat`} className="ax-select" name="repeat_rule_preset" required value={repeatPreset} onChange={e => setRepeatPreset(e.target.value)}>
          <option value="escalate_one_level">{s.repeatEscalate}</option>
          <option value="none">{s.repeatNone}</option>
        </select></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-type`}>{s.penaltyType}</label><input id={`${baseId}-type`} className="ax-input" name="penalty_type" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-amount`}>{s.amount}</label><input id={`${baseId}-amount`} className="ax-input" name="amount" type="number" min="0" step="any" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-grace`}>{s.gracePeriod}</label><input id={`${baseId}-grace`} className="ax-input" name="grace_period_days" type="number" min="0" step="1" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-due`}>{s.duePeriod}</label><input id={`${baseId}-due`} className="ax-input" name="due_period_days" type="number" min="0" step="1" /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${baseId}-template`}>{s.template}</label><select id={`${baseId}-template`} className="ax-select" name="template_version_id" defaultValue=""><option value="">{s.none}</option>{templates.map(template => <option key={template.id} value={template.id}>{template.label}</option>)}</select></div>
      <button className="ax-btn" disabled={pending}>{pending ? s.mapping : `${s.mapTo} ${violationCode}`}</button>
      {state.error && <span ref={errorRef} tabIndex={-1} className="ax-validation" role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success" role="status"><span aria-hidden="true">✓</span> {s.mapped}</span>}
      </div>
    </form>
  );
}

export function PublishViolationForm({ violationId, violationCode, strings: s }: { violationId: string; violationCode: string; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(publishViolationCode, {});
  return <form action={formAction} className="ax-row"><input type="hidden" name="violation_code_id" value={violationId}/><button className="ax-btn ax-btn--prominent" disabled={pending} aria-label={`${s.publishCode} ${violationCode}`}>{pending ? s.publishingCode : s.publishCode}</button>{state.error && <span className="ax-validation" role="alert">{state.error}</span>}{state.ok && <span className="ax-lozenge ax-lozenge--success" role="status">✓ {s.codePublished}</span>}</form>;
}

export function PublishMappingForm({ mappingId, violationCode, strings: s }: { mappingId: string; violationCode: string; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(publishPenaltyMapping, {});
  return <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center", flexWrap: "wrap" }}>
    <input type="hidden" name="mapping_id" value={mappingId} />
    <button className="ax-btn ax-btn--prominent" aria-label={`${s.approveMapping} ${violationCode}`} disabled={pending}>{pending ? s.publishingMapping : s.approveMapping}</button>
    {state.error ? <span className="ax-validation" role="alert">{state.error}</span> : null}
    {state.ok ? <span className="ax-lozenge ax-lozenge--success" role="status">✓ {s.mappingPublished}</span> : null}
  </form>;
}

export function DeactivateViolationForm({ violationId, violationCode, strings: s }: { violationId: string; violationCode: string; strings: VioStrings }) {
  const [state, formAction, pending] = useActionState<VioResult, FormData>(deactivateViolationCode, {});
  const errorRef = useRef<HTMLSpanElement>(null);
  const fieldId = `deactivate-${violationId}`;
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);
  return (
    <form action={formAction} className="ax-row" aria-label={`${s.deactivate} ${violationCode}`} style={{ gap: "var(--ax-space-100)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="violation_code_id" value={violationId} />
      <div className="ax-field">
        <label className="ax-field__label" htmlFor={fieldId}>{s.activeTo}</label>
        <input id={fieldId} className="ax-input ax-numeric" type="date" name="active_to" max={new Date().toISOString().slice(0, 10)} required />
      </div>
      <div className="ax-field"><label className="ax-field__label" htmlFor={`${fieldId}-reason`}>{s.deactivationReason}</label><input id={`${fieldId}-reason`} className="ax-input" name="deactivation_reason" required /></div>
      <button className="ax-btn ax-btn--subtle" aria-label={`${s.deactivate} ${violationCode}`} disabled={pending}>
        <span aria-hidden="true">⏻</span> {pending ? s.deactivating : s.deactivate}
      </button>
      {state.error && <span ref={errorRef} tabIndex={-1} className="ax-validation" role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success" role="status"><span aria-hidden="true">✓</span> {s.deactivated}</span>}
    </form>
  );
}
