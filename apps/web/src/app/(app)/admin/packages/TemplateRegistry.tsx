"use client";

import { useActionState } from "react";
import { createTemplateVersion, deactivateTemplateVersion, publishTemplateVersion, updateTemplateDraft, type TemplateResult } from "../templates/actions";

export type TemplateRow = { id: string; template_key: string; template_type: string; version_label: string; title_en: string; title_ar: string; schema: unknown; status: string; effective_from: string | null };
export type TemplateStrings = { heading: string; intro: string; key: string; type: string; version: string; effectiveFrom: string; titleEn: string; titleAr: string; schema: string; create: string; creating: string; save: string; saving: string; publish: string; publishing: string; effectiveTo: string; reason: string; deactivate: string; deactivating: string; historical: string; saved: string; typeForm: string; typeReport: string; typeActionForm: string; typePenalty: string };

function Feedback({ state, saved }: { state: TemplateResult; saved: string }) {
  return state.error ? <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span> : state.ok ? <span className="badge badge-compliant" role="status">✓ {saved}</span> : null;
}

export default function TemplateRegistry({ templates, strings: s }: { templates: TemplateRow[]; strings: TemplateStrings }) {
  const [createState, createAction, creating] = useActionState<TemplateResult, FormData>(createTemplateVersion, {});
  return <details className="panel stack" style={{ padding: "var(--space-6)" }}>
    <summary><strong>{s.heading}</strong> · M09-006/008/009</summary>
    <p className="t-caption">{s.intro}</p>
    <form action={createAction} className="sq-grid-2">
      <label className="sq-field"><span className="sq-field__label">{s.key}</span><input className="sq-input numeric" name="template_key" required /></label>
      <label className="sq-field"><span className="sq-field__label">{s.type}</span><select className="sq-select" name="template_type" required defaultValue="action_form"><option value="form">{s.typeForm}</option><option value="report">{s.typeReport}</option><option value="action_form">{s.typeActionForm}</option><option value="penalty">{s.typePenalty}</option></select></label>
      <label className="sq-field"><span className="sq-field__label">{s.version}</span><input className="sq-input numeric" name="version_label" placeholder="v1" required /></label>
      <label className="sq-field"><span className="sq-field__label">{s.effectiveFrom}</span><input className="sq-input" type="date" name="effective_from" required /></label>
      <label className="sq-field"><span className="sq-field__label">{s.titleEn}</span><input className="sq-input" name="title_en" required /></label>
      <label className="sq-field"><span className="sq-field__label">{s.titleAr}</span><input className="sq-input" dir="rtl" name="title_ar" required /></label>
      <label className="sq-field" style={{ gridColumn: "1 / -1" }}><span className="sq-field__label">{s.schema}</span><textarea className="sq-input numeric" name="schema" defaultValue={'{"fields":[]}'} required /></label>
      <button className="btn btn-primary btn-lg btn-touch" disabled={creating}>{creating ? s.creating : s.create}</button><Feedback state={createState} saved={s.saved}/>
    </form>
    <div className="stack">{templates.map(template => <TemplateCard key={template.id} template={template} strings={s} />)}</div>
  </details>;
}

function TemplateCard({ template, strings: s }: { template: TemplateRow; strings: TemplateStrings }) {
  const [editState, editAction, editing] = useActionState<TemplateResult, FormData>(updateTemplateDraft, {});
  const [publishState, publishAction, publishing] = useActionState<TemplateResult, FormData>(publishTemplateVersion, {});
  const [deactivateState, deactivateAction, deactivating] = useActionState<TemplateResult, FormData>(deactivateTemplateVersion, {});
  return <details className="sq-panel" style={{ padding: "var(--space-4)" }}><summary><bdi dir="ltr">{template.template_key} · {template.version_label}</bdi> — {template.title_en} <span className="badge badge-info">{template.status}</span></summary>
    {template.status === "draft" ? <><form action={editAction} className="sq-grid-2"><input type="hidden" name="template_id" value={template.id}/><label className="sq-field"><span className="sq-field__label">{s.titleEn}</span><input className="sq-input" name="title_en" defaultValue={template.title_en} required/></label><label className="sq-field"><span className="sq-field__label">{s.titleAr}</span><input className="sq-input" dir="rtl" name="title_ar" defaultValue={template.title_ar} required/></label><label className="sq-field" style={{ gridColumn: "1 / -1" }}><span className="sq-field__label">{s.schema}</span><textarea className="sq-input numeric" name="schema" defaultValue={JSON.stringify(template.schema, null, 2)} required/></label><button className="btn btn-primary btn-touch" disabled={editing}>{editing ? s.saving : s.save}</button><Feedback state={editState} saved={s.saved}/></form><form action={publishAction} className="row"><input type="hidden" name="template_id" value={template.id}/><button className="btn btn-primary btn-lg btn-touch" disabled={publishing}>{publishing ? s.publishing : s.publish}</button><Feedback state={publishState} saved={s.saved}/></form></> : ["published", "locked"].includes(template.status) ? <form action={deactivateAction} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}><input type="hidden" name="template_id" value={template.id}/><label className="sq-field"><span className="sq-field__label">{s.effectiveTo}</span><input className="sq-input" type="date" name="effective_to" required/></label><label className="sq-field"><span className="sq-field__label">{s.reason}</span><input className="sq-input" name="deactivation_reason" required/></label><button className="btn btn-primary btn-touch" disabled={deactivating}>{deactivating ? s.deactivating : s.deactivate}</button><Feedback state={deactivateState} saved={s.saved}/></form> : <p className="t-caption">{s.historical}</p>}
  </details>;
}
