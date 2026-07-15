"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveDraftDefinition, type PkgResult } from "./actions";
import styles from "./packages.module.css";

type Section = { key: string; title: string; items?: string[]; mandatory?: boolean; fields?: string[] };
type ActionForm = { key: string; title: string; blocking?: boolean; fields?: string[] };
type Definition = { sections?: Section[]; action_forms?: ActionForm[] };
type CatalogItem = { code: string; title: string };

export type DraftEditorStrings = {
  heading: string; editableWhileDraft: string; mandatory: string;
  structure: string; fieldCanvas: string; preview: string; sectionTitleAria: string;
  removeAria: string; addItem: string; addItemAria: string; newSectionTitle: string;
  addSection: string; draftSaved: string; saving: string; save: string;
  noChanges: string; unsaved: string; emptyTitle: string; emptyBody: string;
  itemCount: string; validationTitle: string; validationClear: string;
  duplicateItem: string; blankSection: string; targetsTitle: string; blocked: string;
  blockedOwner: string; targetReorder: string; targetConditions: string;
  targetItemPolicies: string; targetActionForms: string; targetSimulation: string;
};

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((value, [key, replacement]) => value.split(`{${key}}`).join(String(replacement)), template);

export default function DraftEditor({ versionId, definition, catalog, strings: s, preview }: {
  versionId: string;
  definition: Definition;
  catalog: CatalogItem[];
  strings: DraftEditorStrings;
  preview: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(saveDraftDefinition, {});
  const [initial, setInitial] = useState(() => JSON.stringify(definition));
  const [def, setDef] = useState<Definition>(definition);
  const [selectedKey, setSelectedKey] = useState(definition.sections?.[0]?.key ?? "");
  const [newSection, setNewSection] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const handledResultRef = useRef<PkgResult | null>(null);
  const sections = def.sections ?? [];
  const selectedIndex = Math.max(0, sections.findIndex(section => section.key === selectedKey));
  const selected = sections[selectedIndex];
  const serialized = JSON.stringify(def);
  const dirty = serialized !== initial;

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const section of sections) {
      if (!section.title.trim()) issues.push(fill(s.blankSection, { key: section.key }));
      for (const code of section.items ?? []) {
        if (seen.has(code)) issues.push(fill(s.duplicateItem, { code }));
        seen.add(code);
      }
    }
    return issues;
  }, [sections, s.blankSection, s.duplicateItem]);

  useEffect(() => {
    if (state === handledResultRef.current) return;
    handledResultRef.current = state;
    if (state.error || state.ok) feedbackRef.current?.focus();
    if (state.ok) setInitial(serialized);
  }, [state, serialized]);

  const patchSelected = (patch: Partial<Section>) => {
    if (!selected) return;
    setDef(current => ({
      ...current,
      sections: (current.sections ?? []).map(section => section.key === selected.key ? { ...section, ...patch } : section),
    }));
  };

  const addSection = () => {
    const title = newSection.trim();
    if (!title) return;
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "section";
    let key = `s${sections.length + 1}-${base}`;
    let suffix = 2;
    while (sections.some(section => section.key === key)) key = `s${sections.length + 1}-${base}-${suffix++}`;
    setDef(current => ({ ...current, sections: [...(current.sections ?? []), { key, title, items: [] }] }));
    setSelectedKey(key);
    setNewSection("");
  };

  const targets = [s.targetReorder, s.targetConditions, s.targetItemPolicies, s.targetActionForms, s.targetSimulation];

  return (
    <form action={formAction} className={styles.editorForm} aria-labelledby={`designer-${versionId}`}>
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="definition" value={serialized} />
      <div className={styles.versionHeading}>
        <h4 id={`designer-${versionId}`} style={{ margin: 0 }}>{s.heading}</h4>
        <span className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
          {dirty && <span className="ax-lozenge ax-lozenge--warning" role="status"><span aria-hidden="true">● </span>{s.unsaved}</span>}
          <span className="ax-lozenge ax-lozenge--info"><span aria-hidden="true">✎ </span>{s.editableWhileDraft}</span>
        </span>
      </div>

      <div className={styles.designerStudio}>
        <aside className={`${styles.studioPane} ${styles.editorCanvas}`} aria-labelledby={`structure-${versionId}`}>
          <h5 id={`structure-${versionId}`} style={{ margin: 0 }}>{s.structure}</h5>
          {sections.length === 0 ? (
            <div className="ax-state">
              <span className="ax-state__glyph" aria-hidden="true">▦</span>
              <strong>{s.emptyTitle}</strong>
              <p className="ax-caption">{s.emptyBody}</p>
            </div>
          ) : (
            <ol className={styles.structureList}>
              {sections.map((section, index) => (
                <li key={section.key}>
                  <button type="button" className={styles.structureButton}
                    aria-current={section.key === selected?.key ? "true" : undefined}
                    onClick={() => setSelectedKey(section.key)}>
                    <strong>{index + 1}. {section.title || section.key}</strong><br />
                    <span className="ax-caption">{fill(s.itemCount, { n: section.items?.length ?? 0 })}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <label className="ax-field">
            <span className="ax-field__label">{s.newSectionTitle}</span>
            <input className="ax-input" value={newSection} onChange={event => setNewSection(event.target.value)} />
          </label>
          <button type="button" className="ax-btn" disabled={!newSection.trim()} onClick={addSection}>{s.addSection}</button>
        </aside>

        <section className={`${styles.studioPane} ${styles.editorCanvas}`} aria-labelledby={`canvas-${versionId}`}>
          <h5 id={`canvas-${versionId}`} style={{ margin: 0 }}>{s.fieldCanvas}</h5>
          {selected ? (
            <>
              <label className="ax-field">
                <span className="ax-field__label">{s.sectionTitleAria}</span>
                <input className="ax-input" value={selected.title} onChange={event => patchSelected({ title: event.target.value })} />
              </label>
              <label className="ax-choice" style={{ display: "flex", minBlockSize: 44 }}>
                <input type="checkbox" checked={!!selected.mandatory} onChange={event => patchSelected({ mandatory: event.target.checked })} />
                <span>{s.mandatory}</span>
              </label>
              <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
                {(selected.items ?? []).map(code => (
                  <span key={code} className={`ax-lozenge ax-lozenge--info ${styles.itemChip}`}>
                    <bdi dir="ltr">{code}</bdi>
                    <button type="button" className={styles.chipRemove} aria-label={`${s.removeAria} ${code}`}
                      onClick={() => patchSelected({ items: (selected.items ?? []).filter(item => item !== code) })}>✕</button>
                  </span>
                ))}
              </div>
              <label className="ax-field">
                <span className="ax-field__label">{s.addItemAria}</span>
                <select className="ax-select" value="" onChange={event => {
                  if (event.target.value) patchSelected({ items: [...(selected.items ?? []), event.target.value] });
                }}>
                  <option value="">{s.addItem}</option>
                  {catalog.filter(item => !(selected.items ?? []).includes(item.code)).map(item => (
                    <option key={item.code} value={item.code}>{item.code} — {item.title}</option>
                  ))}
                </select>
              </label>
            </>
          ) : <p className="ax-caption">{s.emptyBody}</p>}

          <div className="ax-panel" style={{ padding: "var(--ax-space-150)" }}>
            <strong>{s.validationTitle}</strong>
            {validationIssues.length === 0 ? (
              <p className="ax-caption" role="status"><span aria-hidden="true">✓ </span>{s.validationClear}</p>
            ) : (
              <ul className="ax-caption" role="alert">{validationIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>
            )}
          </div>

          <div ref={feedbackRef} tabIndex={-1}>
            {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div style={{ whiteSpace: "pre-line" }}>{state.error}</div></div>}
            {state.ok && <div className="ax-banner ax-banner--success" role="status"><div>{s.draftSaved}</div></div>}
          </div>
          <div className={styles.actionRow}>
            {!dirty && !state.ok && <span className="ax-caption" role="status">{s.noChanges}</span>}
            <button className="ax-btn ax-btn--prominent" disabled={pending || !dirty || validationIssues.length > 0}>
              {pending ? s.saving : s.save}
            </button>
          </div>
        </section>

        <aside className={`${styles.studioPane} ${styles.previewPane}`} aria-labelledby={`preview-${versionId}`}>
          <h5 id={`preview-${versionId}`} style={{ margin: 0 }}>{s.preview}</h5>
          {preview}
          <div className={styles.targetList} aria-labelledby={`targets-${versionId}`}>
            <strong id={`targets-${versionId}`}>{s.targetsTitle}</strong>
            {targets.map(target => (
              <div key={target} className={styles.blockedTarget}>
                <button type="button" className="ax-btn" disabled aria-disabled="true">{target}</button>
                <span className="ax-caption"><strong>{s.blocked}</strong> · {s.blockedOwner}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </form>
  );
}
