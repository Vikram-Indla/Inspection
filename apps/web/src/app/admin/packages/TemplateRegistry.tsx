"use client";

import { useActionState } from "react";
import { createTemplateVersion, deactivateTemplateVersion, publishTemplateVersion, updateTemplateDraft, type TemplateResult } from "../templates/actions";

export type TemplateRow = { id: string; template_key: string; template_type: string; version_label: string; title_en: string; title_ar: string; schema: unknown; status: string; effective_from: string | null };
export type TemplateStrings = { heading: string; intro: string; key: string; type: string; version: string; effectiveFrom: string; titleEn: string; titleAr: string; schema: string; create: string; creating: string; save: string; saving: string; publish: string; publishing: string; effectiveTo: string; reason: string; deactivate: string; deactivating: string; historical: string; saved: string; typeForm: string; typeReport: string; typeActionForm: string; typePenalty: string };

function Feedback({ state, saved }: { state: TemplateResult; saved: string }) {
  return state.error ? <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span> : state.ok ? <span className="ax-lozenge ax-lozenge--success" role="status">✓ {saved}</span> : null;
}

export default function TemplateRegistry({ templates, strings: s }: { templates: TemplateRow[]; strings: TemplateStrings }) {
  const [createState, createAction, creating] = useActionState<TemplateResult, FormData>(createTemplateVersion, {});
  return <details className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }}>
    <summary><strong>{s.heading}</strong> · M09-006/008/009</summary>
    <p className="ax-caption">{s.intro}</p>
    <form action={createAction} className="ax-grid-2">
      <label className="ax-field"><span className="ax-field__label">{s.key}</span><input className="ax-input ax-numeric" name="template_key" required /></label>
      <label className="ax-field"><span className="ax-field__label">{s.type}</span><select className="ax-select" name="template_type" required defaultValue="action_form"><option value="form">{s.typeForm}</option><option value="report">{s.typeReport}</option><option value="action_form">{s.typeActionForm}</option><option value="penalty">{s.typePenalty}</option></select></label>
      <label className="ax-field"><span className="ax-field__label">{s.version}</span><input className="ax-input ax-numeric" name="version_label" placeholder="v1" required /></label>
      <label className="ax-field"><span className="ax-field__label">{s.effectiveFrom}</span><input className="ax-input" type="date" name="effective_from" required /></label>
      <label className="ax-field"><span className="ax-field__label">{s.titleEn}</span><input className="ax-input" name="title_en" required /></label>
      <label className="ax-field"><span className="ax-field__label">{s.titleAr}</span><input className="ax-input" dir="rtl" name="title_ar" required /></label>
      <label className="ax-field" style={{ gridColumn: "1 / -1" }}><span className="ax-field__label">{s.schema}</span><textarea className="ax-input ax-numeric" name="schema" defaultValue={'{"fields":[]}'} required /></label>
      <button className="ax-btn ax-btn--prominent" disabled={creating}>{creating ? s.creating : s.create}</button><Feedback state={createState} saved={s.saved}/>
    </form>
    <div className="stack">{templates.map(template => <TemplateCard key={template.id} template={template} strings={s} />)}</div>
  </details>;
}

function TemplateCard({ template, strings: s }: { template: TemplateRow; strings: TemplateStrings }) {
  const [editState, editAction, editing] = useActionState<TemplateResult, FormData>(updateTemplateDraft, {});
  const [publishState, publishAction, publishing] = useActionState<TemplateResult, FormData>(publishTemplateVersion, {});
  const [deactivateState, deactivateAction, deactivating] = useActionState<TemplateResult, FormData>(deactivateTemplateVersion, {});
  return <details className="ax-panel" style={{ padding: "var(--ax-space-200)" }}><summary><bdi dir="ltr">{template.template_key} · {template.version_label}</bdi> — {template.title_en} <span className="ax-lozenge ax-lozenge--info">{template.status}</span></summary>
    {template.status === "draft" ? <><form action={editAction} className="ax-grid-2"><input type="hidden" name="template_id" value={template.id}/><label className="ax-field"><span className="ax-field__label">{s.titleEn}</span><input className="ax-input" name="title_en" defaultValue={template.title_en} required/></label><label className="ax-field"><span className="ax-field__label">{s.titleAr}</span><input className="ax-input" dir="rtl" name="title_ar" defaultValue={template.title_ar} required/></label><label className="ax-field" style={{ gridColumn: "1 / -1" }}><span className="ax-field__label">{s.schema}</span><textarea className="ax-input ax-numeric" name="schema" defaultValue={JSON.stringify(template.schema, null, 2)} required/></label><button className="ax-btn" disabled={editing}>{editing ? s.saving : s.save}</button><Feedback state={editState} saved={s.saved}/></form><form action={publishAction} className="ax-row"><input type="hidden" name="template_id" value={template.id}/><button className="ax-btn ax-btn--prominent" disabled={publishing}>{publishing ? s.publishing : s.publish}</button><Feedback state={publishState} saved={s.saved}/></form></> : ["published", "locked"].includes(template.status) ? <form action={deactivateAction} className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}><input type="hidden" name="template_id" value={template.id}/><label className="ax-field"><span className="ax-field__label">{s.effectiveTo}</span><input className="ax-input" type="date" name="effective_to" required/></label><label className="ax-field"><span className="ax-field__label">{s.reason}</span><input className="ax-input" name="deactivation_reason" required/></label><button className="ax-btn" disabled={deactivating}>{deactivating ? s.deactivating : s.deactivate}</button><Feedback state={deactivateState} saved={s.saved}/></form> : <p className="ax-caption">{s.historical}</p>}
  </details>;
}
