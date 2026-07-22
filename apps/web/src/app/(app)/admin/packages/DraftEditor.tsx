"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveDraftDefinition, type PkgResult } from "./actions";
import styles from "./packages.module.css";

type ItemRule = {
  requirement?: "required" | "optional" | "conditional";
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  evidence_rule?: { on?: string; type?: string; min?: number; mandatory?: boolean } | null;
  scoring_enabled?: boolean;
  score_weight?: number | null;
  response_mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
};
type Section = { key: string; title?: string; title_en?: string; title_ar?: string; items?: string[]; mandatory?: boolean; fields?: string[] };
type ActionForm = { key: string; title: string; blocking?: boolean; fields?: string[]; template_version_id?: string };
type Definition = { sections?: Section[]; action_forms?: ActionForm[]; item_rules?: Record<string, ItemRule>; template_refs?: string[] };
type CatalogItem = { code: string; title: string };
type Choice = { id: string; label: string };

export type DraftEditorStrings = {
  heading: string; editableWhileDraft: string; mandatory: string;
  structure: string; fieldCanvas: string; preview: string; sectionTitleAria: string;
  sectionTitleEn: string; sectionTitleAr: string; moveUp: string; moveDown: string;
  removeAria: string; addItem: string; addItemAria: string; newSectionTitle: string;
  newSectionTitleAr: string; addSection: string; draftSaved: string; saving: string; save: string;
  noChanges: string; unsaved: string; emptyTitle: string; emptyBody: string;
  itemCount: string; validationTitle: string; validationClear: string;
  duplicateItem: string; blankSection: string; bilingualSection: string;
  relationship: string; requirement: string; required: string; optional: string; conditional: string;
  visibleWhen: string; mandatoryWhenVisible: string; evidence: string; inheritEvidence: string;
  scoring: string; scoreWeight: string; violation: string; actionForm: string; none: string;
  forms: string; formKey: string; formTitle: string; blocking: string; template: string;
  addForm: string; removeForm: string; circularCheck: string;
  evidencePhoto: string; evidenceVideo: string; evidenceDocument: string; evidenceComment: string;
};

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((value, [key, replacement]) => value.split(`{${key}}`).join(String(replacement)), template);

export default function DraftEditor({ versionId, definition, catalog, violations, templates, strings: s, preview }: {
  versionId: string; definition: Definition; catalog: CatalogItem[]; violations: Choice[]; templates: Choice[];
  strings: DraftEditorStrings; preview: ReactNode;
}) {
  const normalized = useMemo<Definition>(() => {
    const sections = (definition.sections ?? []).map(section => ({ ...section, title_en: section.title_en ?? section.title }));
    const item_rules = { ...(definition.item_rules ?? {}) };
    for (const section of sections) for (const code of section.items ?? []) if (!item_rules[code]) item_rules[code] = { requirement: "required", scoring_enabled: true };
    return { ...definition, sections, action_forms: definition.action_forms ?? [], item_rules, template_refs: definition.template_refs ?? [] };
  }, [definition]);
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(saveDraftDefinition, {});
  const [initial, setInitial] = useState(() => JSON.stringify(definition));
  const [def, setDef] = useState<Definition>(normalized);
  const [selectedKey, setSelectedKey] = useState(normalized.sections?.[0]?.key ?? "");
  const [selectedItem, setSelectedItem] = useState("");
  const [newSectionEn, setNewSectionEn] = useState("");
  const [newSectionAr, setNewSectionAr] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const handledResultRef = useRef<PkgResult | null>(null);
  const sections = def.sections ?? [];
  const selectedIndex = sections.findIndex(section => section.key === selectedKey);
  const selected = selectedIndex >= 0 ? sections[selectedIndex] : undefined;
  const rule = selectedItem ? (def.item_rules?.[selectedItem] ?? { requirement: "required", scoring_enabled: true }) : null;
  const serialized = JSON.stringify(def);
  const dirty = serialized !== initial;

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const section of sections) {
      if (!(section.title_en ?? section.title ?? "").trim()) issues.push(fill(s.blankSection, { key: section.key }));
      if (!(section.title_en ?? section.title ?? "").trim() || !(section.title_ar ?? "").trim()) issues.push(fill(s.bilingualSection, { key: section.key }));
      for (const code of section.items ?? []) { if (seen.has(code)) issues.push(fill(s.duplicateItem, { code })); seen.add(code); }
    }
    return issues;
  }, [sections, s.blankSection, s.bilingualSection, s.duplicateItem]);

  useEffect(() => { if (state === handledResultRef.current) return; handledResultRef.current = state; if (state.error || state.ok) feedbackRef.current?.focus(); if (state.ok) setInitial(serialized); }, [state, serialized]);
  const setSections = (next: Section[]) => setDef(current => ({ ...current, sections: next }));
  const patchSelected = (patch: Partial<Section>) => { if (selected) setSections(sections.map(section => section.key === selected.key ? { ...section, ...patch } : section)); };
  const moveSection = (delta: number) => { if (!selected || selectedIndex < 0) return; const to = selectedIndex + delta; if (to < 0 || to >= sections.length) return; const next = [...sections]; [next[selectedIndex], next[to]] = [next[to], next[selectedIndex]]; setSections(next); };
  const moveItem = (code: string, delta: number) => { if (!selected) return; const items = [...(selected.items ?? [])]; const at = items.indexOf(code); const to = at + delta; if (at < 0 || to < 0 || to >= items.length) return; [items[at], items[to]] = [items[to], items[at]]; patchSelected({ items }); };
  const patchRule = (patch: Partial<ItemRule>) => { if (!selectedItem) return; setDef(current => ({ ...current, item_rules: { ...(current.item_rules ?? {}), [selectedItem]: { requirement: "required", scoring_enabled: true, ...(current.item_rules?.[selectedItem] ?? {}), ...patch } } })); };
  const addSection = () => { const en = newSectionEn.trim(), ar = newSectionAr.trim(); if (!en || !ar) return; const base = en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "section"; let key = `s${sections.length + 1}-${base}`; let suffix = 2; while (sections.some(section => section.key === key)) key = `s${sections.length + 1}-${base}-${suffix++}`; setSections([...sections, { key, title: en, title_en: en, title_ar: ar, items: [] }]); setSelectedKey(key); setNewSectionEn(""); setNewSectionAr(""); };
  const addForm = () => { const n = (def.action_forms?.length ?? 0) + 1; setDef(current => ({ ...current, action_forms: [...(current.action_forms ?? []), { key: `action-${n}`, title: `Action ${n}`, blocking: false, fields: [] }] })); };
  const patchForm = (index: number, patch: Partial<ActionForm>) => setDef(current => { const forms = [...(current.action_forms ?? [])]; forms[index] = { ...forms[index], ...patch }; const refs = forms.flatMap(form => form.template_version_id ? [form.template_version_id] : []); return { ...current, action_forms: forms, template_refs: [...new Set(refs)] }; });

  return <form action={formAction} className={styles.editorForm} aria-labelledby={`designer-${versionId}`}>
    <input type="hidden" name="version_id" value={versionId} /><input type="hidden" name="definition" value={serialized} />
    <div className={styles.versionHeading}><h4 id={`designer-${versionId}`} style={{ margin: 0 }}>{s.heading}</h4><span className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>{dirty && <span className="badge badge-warning" role="status">● {s.unsaved}</span>}<span className="badge badge-info">✎ {s.editableWhileDraft}</span></span></div>
    <div className={styles.designerStudio}>
      <aside className={`${styles.studioPane} ${styles.editorCanvas}`}><h5 style={{ margin: 0 }}>{s.structure}</h5>
        {sections.length === 0 ? <div className="ax-state"><strong>{s.emptyTitle}</strong><p className="t-caption">{s.emptyBody}</p></div> : <ol className={styles.structureList}>{sections.map((section, index) => <li key={section.key}><button type="button" className={styles.structureButton} aria-current={section.key === selected?.key ? "true" : undefined} onClick={() => { setSelectedKey(section.key); setSelectedItem(""); }}><strong>{index + 1}. {section.title_en ?? section.title ?? section.key}</strong><br/><span className="t-caption">{section.title_ar ?? "—"} · {fill(s.itemCount, { n: section.items?.length ?? 0 })}</span></button></li>)}</ol>}
        <label className="ax-field"><span className="ax-field__label">{s.newSectionTitle}</span><input className="ax-input" value={newSectionEn} onChange={e => setNewSectionEn(e.target.value)} /></label>
        <label className="ax-field"><span className="ax-field__label">{s.newSectionTitleAr}</span><input className="ax-input" dir="rtl" value={newSectionAr} onChange={e => setNewSectionAr(e.target.value)} /></label>
        <button type="button" className="btn btn-primary btn-touch" disabled={!newSectionEn.trim() || !newSectionAr.trim()} onClick={addSection}>{s.addSection}</button>
      </aside>
      <section className={`${styles.studioPane} ${styles.editorCanvas}`}><h5 style={{ margin: 0 }}>{s.fieldCanvas}</h5>
        {selected ? <>
          <div className="row" style={{ gap: 8 }}><button type="button" className="btn btn-primary btn-touch" onClick={() => moveSection(-1)} disabled={selectedIndex === 0}>{s.moveUp}</button><button type="button" className="btn btn-primary btn-touch" onClick={() => moveSection(1)} disabled={selectedIndex === sections.length - 1}>{s.moveDown}</button></div>
          <label className="ax-field"><span className="ax-field__label">{s.sectionTitleEn}</span><input className="ax-input" value={selected.title_en ?? selected.title ?? ""} onChange={e => patchSelected({ title: e.target.value, title_en: e.target.value })} /></label>
          <label className="ax-field"><span className="ax-field__label">{s.sectionTitleAr}</span><input className="ax-input" dir="rtl" value={selected.title_ar ?? ""} onChange={e => patchSelected({ title_ar: e.target.value })} /></label>
          <label className="ax-choice" style={{ display: "flex", minBlockSize: 44 }}><input type="checkbox" checked={!!selected.mandatory} onChange={e => patchSelected({ mandatory: e.target.checked })} /><span>{s.mandatory}</span></label>
          <ol className="stack" style={{ paddingInlineStart: 20 }}>{(selected.items ?? []).map((code, index) => <li key={code}><div className="row" style={{ gap: 6, flexWrap: "wrap" }}><button type="button" className="btn btn-ghost btn-touch" onClick={() => setSelectedItem(code)}><bdi dir="ltr">{code}</bdi></button><button type="button" className="btn btn-primary btn-touch" aria-label={`${s.moveUp} ${code}`} disabled={index === 0} onClick={() => moveItem(code, -1)}>↑</button><button type="button" className="btn btn-primary btn-touch" aria-label={`${s.moveDown} ${code}`} disabled={index === (selected.items?.length ?? 0) - 1} onClick={() => moveItem(code, 1)}>↓</button><button type="button" className="btn btn-primary btn-touch" aria-label={`${s.removeAria} ${code}`} onClick={() => { patchSelected({ items: (selected.items ?? []).filter(item => item !== code) }); setSelectedItem(""); }}>✕</button></div></li>)}</ol>
          <label className="ax-field"><span className="ax-field__label">{s.addItemAria}</span><select className="ax-select" value="" onChange={e => { const code = e.target.value; if (!code) return; patchSelected({ items: [...(selected.items ?? []), code] }); setDef(current => ({ ...current, item_rules: { ...(current.item_rules ?? {}), [code]: current.item_rules?.[code] ?? { requirement: "required", scoring_enabled: true } } })); setSelectedItem(code); }}><option value="">{s.addItem}</option>{catalog.filter(item => !(selected.items ?? []).includes(item.code)).map(item => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}</select></label>
        </> : <p className="t-caption">{s.emptyBody}</p>}
        {selectedItem && rule && <fieldset className="ax-panel stack" style={{ padding: 16 }}><legend><strong>{s.relationship}: <bdi dir="ltr">{selectedItem}</bdi></strong></legend>
          <label className="ax-field"><span className="ax-field__label">{s.requirement}</span><select className="ax-select" value={rule.requirement ?? "required"} onChange={e => patchRule({ requirement: e.target.value as ItemRule["requirement"], conditional: e.target.value === "conditional" ? (rule.conditional ?? {}) : undefined })}><option value="required">{s.required}</option><option value="optional">{s.optional}</option><option value="conditional">{s.conditional}</option></select></label>
          {rule.requirement === "conditional" && <><label className="ax-field"><span className="ax-field__label">{s.visibleWhen}</span><input className="ax-input numeric" value={rule.conditional?.visible_when ?? ""} placeholder="ITEM-001=compliant" onChange={e => patchRule({ conditional: { ...(rule.conditional ?? {}), visible_when: e.target.value } })} /></label><label className="ax-choice"><input type="checkbox" checked={!!rule.conditional?.mandatory_when_visible} onChange={e => patchRule({ conditional: { ...(rule.conditional ?? {}), mandatory_when_visible: e.target.checked } })}/>{s.mandatoryWhenVisible}</label></>}
          <label className="ax-field"><span className="ax-field__label">{s.evidence}</span><select className="ax-select" value={rule.evidence_rule === undefined ? "inherit" : rule.evidence_rule?.type ?? "none"} onChange={e => patchRule({ evidence_rule: e.target.value === "inherit" ? undefined : e.target.value === "none" ? null : { on: "non_compliant", type: e.target.value, min: 1, mandatory: true } })}><option value="inherit">{s.inheritEvidence}</option><option value="none">{s.none}</option><option value="photo">{s.evidencePhoto}</option><option value="video">{s.evidenceVideo}</option><option value="document">{s.evidenceDocument}</option><option value="comment">{s.evidenceComment}</option></select></label>
          <label className="ax-choice"><input type="checkbox" checked={rule.scoring_enabled !== false} onChange={e => patchRule({ scoring_enabled: e.target.checked })}/>{s.scoring}</label>{rule.scoring_enabled !== false && <label className="ax-field"><span className="ax-field__label">{s.scoreWeight}</span><input className="ax-input" type="number" min="0" step="any" value={rule.score_weight ?? ""} onChange={e => patchRule({ score_weight: e.target.value === "" ? null : Number(e.target.value) })}/></label>}
          <label className="ax-field"><span className="ax-field__label">{s.violation}</span><select className="ax-select" value={rule.response_mapping?.non_compliant?.violation ?? ""} onChange={e => patchRule({ response_mapping: { ...(rule.response_mapping ?? {}), non_compliant: { ...(rule.response_mapping?.non_compliant ?? {}), result: "non_compliant", violation: e.target.value || undefined } } })}><option value="">{s.none}</option>{violations.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
          <label className="ax-field"><span className="ax-field__label">{s.actionForm}</span><select className="ax-select" value={rule.response_mapping?.non_compliant?.action_form ?? ""} onChange={e => patchRule({ response_mapping: { ...(rule.response_mapping ?? {}), non_compliant: { ...(rule.response_mapping?.non_compliant ?? {}), result: "non_compliant", action_form: e.target.value || undefined } } })}><option value="">{s.none}</option>{(def.action_forms ?? []).map(f => <option key={f.key} value={f.key}>{f.key} — {f.title}</option>)}</select></label>
        </fieldset>}
        <div className="ax-panel" style={{ padding: 12 }}><strong>{s.validationTitle}</strong>{validationIssues.length ? <ul className="t-caption" role="alert">{validationIssues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p className="t-caption" role="status">✓ {s.validationClear} {s.circularCheck}</p>}</div>
        <div ref={feedbackRef} tabIndex={-1}>{state.error && <div className="ax-banner ax-banner--critical" role="alert"><div style={{ whiteSpace: "pre-line" }}>{state.error}</div></div>}{state.ok && <div className="ax-banner ax-banner--success" role="status"><div>{s.draftSaved}</div></div>}</div>
        <div className={styles.actionRow}>{!dirty && !state.ok && <span className="t-caption">{s.noChanges}</span>}<button className="btn btn-primary btn-lg btn-touch" disabled={pending || !dirty || validationIssues.length > 0}>{pending ? s.saving : s.save}</button></div>
      </section>
      <aside className={`${styles.studioPane} ${styles.previewPane}`}><h5 style={{ margin: 0 }}>{s.preview}</h5>{preview}
        <section className="stack"><div className="row" style={{ justifyContent: "space-between" }}><strong>{s.forms}</strong><button type="button" className="btn btn-primary btn-touch" onClick={addForm}>{s.addForm}</button></div>{(def.action_forms ?? []).map((form, index) => <fieldset key={`${form.key}-${index}`} className="ax-panel stack" style={{ padding: 12 }}><label className="ax-field"><span className="ax-field__label">{s.formKey}</span><input className="ax-input" value={form.key} onChange={e => patchForm(index, { key: e.target.value })}/></label><label className="ax-field"><span className="ax-field__label">{s.formTitle}</span><input className="ax-input" value={form.title} onChange={e => patchForm(index, { title: e.target.value })}/></label><label className="ax-choice"><input type="checkbox" checked={!!form.blocking} onChange={e => patchForm(index, { blocking: e.target.checked })}/>{s.blocking}</label><label className="ax-field"><span className="ax-field__label">{s.template}</span><select className="ax-select" value={form.template_version_id ?? ""} onChange={e => patchForm(index, { template_version_id: e.target.value || undefined })}><option value="">{s.none}</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label><button type="button" className="btn btn-primary btn-touch" onClick={() => setDef(current => ({ ...current, action_forms: (current.action_forms ?? []).filter((_, at) => at !== index) }))}>{s.removeForm}</button></fieldset>)}</section>
      </aside>
    </div>
  </form>;
}
