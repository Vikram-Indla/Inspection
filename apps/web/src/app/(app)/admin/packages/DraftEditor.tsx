"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import { ActionFormsPane, ArabicField, ItemRulePanel } from "./_designer/designer-panes";
import {
  fill,
  nextFreeKey,
  type ActionForm,
  type CatalogItem,
  type Definition,
  type DraftEditorStrings,
  type ItemRule,
  type Section,
  type SelectChoice,
} from "./_designer/designer-types";
import { saveDraftDefinition, type PkgResult } from "./actions";
import styles from "./packages.module.css";

export type { DraftEditorStrings } from "./_designer/designer-types";

export default function DraftEditor({ versionId, definition, catalog, violations, templates, strings: s, preview }: {
  versionId: string;
  definition: Definition;
  catalog: CatalogItem[];
  violations: SelectChoice[];
  templates: SelectChoice[];
  strings: DraftEditorStrings;
  preview: ReactNode;
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
  const addSection = () => { const en = newSectionEn.trim(), ar = newSectionAr.trim(); if (!en || !ar) return; const base = en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "section"; const taken = new Set(sections.map(section => section.key)); const stem = `s${sections.length + 1}-${base}`; const key = taken.has(stem) ? nextFreeKey(stem, taken) : stem; setSections([...sections, { key, title: en, title_en: en, title_ar: ar, items: [] }]); setSelectedKey(key); setNewSectionEn(""); setNewSectionAr(""); };
  const addItem = (code: string) => { if (!code || !selected) return; patchSelected({ items: [...(selected.items ?? []), code] }); setDef(current => ({ ...current, item_rules: { ...(current.item_rules ?? {}), [code]: current.item_rules?.[code] ?? { requirement: "required", scoring_enabled: true } } })); setSelectedItem(code); };
  const addForm = () => { const n = (def.action_forms?.length ?? 0) + 1; setDef(current => ({ ...current, action_forms: [...(current.action_forms ?? []), { key: `action-${n}`, title: `Action ${n}`, blocking: false, fields: [] }] })); };
  const patchForm = (index: number, patch: Partial<ActionForm>) => setDef(current => { const forms = [...(current.action_forms ?? [])]; forms[index] = { ...forms[index], ...patch }; const refs = forms.flatMap(form => form.template_version_id ? [form.template_version_id] : []); return { ...current, action_forms: forms, template_refs: [...new Set(refs)] }; });
  const removeForm = (index: number) => setDef(current => ({ ...current, action_forms: (current.action_forms ?? []).filter((_, at) => at !== index) }));

  return (
    <form action={formAction} aria-labelledby={`designer-${versionId}`} className={styles.editorForm}>
      <input name="version_id" type="hidden" value={versionId} />
      <input name="definition" type="hidden" value={serialized} />

      <div className={styles.versionHeading}>
        <Heading id={`designer-${versionId}`} level={3} visual="subheading">{s.heading}</Heading>
        <span className={styles.pills}>
          {dirty ? <StatusPill tone="warning">{s.unsaved}</StatusPill> : null}
          <StatusPill ping={false} tone="info">{s.editableWhileDraft}</StatusPill>
        </span>
      </div>

      <div className={styles.designerStudio}>
        <aside className={`${styles.studioPane} ${styles.editorCanvas}`}>
          <Heading level={4} visual="subheading">{s.structure}</Heading>
          {sections.length === 0 ? (
            <div className={styles.paneNote}>
              <Text role="bodyStrong">{s.emptyTitle}</Text>
              <Text role="label" tone="muted">{s.emptyBody}</Text>
            </div>
          ) : (
            <ol className={styles.structureList}>
              {sections.map((section, index) => (
                <li key={section.key}>
                  <button
                    aria-current={section.key === selected?.key ? "true" : undefined}
                    className={styles.structureButton}
                    onClick={() => { setSelectedKey(section.key); setSelectedItem(""); }}
                    type="button"
                  >
                    <Text as="span" role="bodyStrong">{index + 1}. {section.title_en ?? section.title ?? section.key}</Text>
                    <Text as="span" role="label" tone="muted">
                      {section.title_ar ?? "—"} · {fill(s.itemCount, { n: section.items?.length ?? 0 })}
                    </Text>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <Field htmlFor={`new-section-en-${versionId}`} label={s.newSectionTitle}>
            <TextInput id={`new-section-en-${versionId}`} onChange={setNewSectionEn} value={newSectionEn} />
          </Field>
          <ArabicField
            id={`new-section-ar-${versionId}`}
            label={s.newSectionTitleAr}
            onChange={setNewSectionAr}
            value={newSectionAr}
          />
          <Button
            disabled={!newSectionEn.trim() || !newSectionAr.trim()}
            onClick={addSection}
            type="button"
            variant="primary"
          >
            {s.addSection}
          </Button>
        </aside>

        <section className={`${styles.studioPane} ${styles.editorCanvas}`}>
          <Heading level={4} visual="subheading">{s.fieldCanvas}</Heading>
          {selected ? (
            <>
              <div className={styles.paneActions}>
                <Button disabled={selectedIndex === 0} onClick={() => moveSection(-1)} type="button">{s.moveUp}</Button>
                <Button disabled={selectedIndex === sections.length - 1} onClick={() => moveSection(1)} type="button">{s.moveDown}</Button>
              </div>
              <Field htmlFor={`section-en-${versionId}`} label={s.sectionTitleEn}>
                <TextInput
                  id={`section-en-${versionId}`}
                  onChange={next => patchSelected({ title: next, title_en: next })}
                  value={selected.title_en ?? selected.title ?? ""}
                />
              </Field>
              <ArabicField
                id={`section-ar-${versionId}`}
                label={s.sectionTitleAr}
                onChange={next => patchSelected({ title_ar: next })}
                value={selected.title_ar ?? ""}
              />
              <Choice
                checked={!!selected.mandatory}
                kind="checkbox"
                label={s.mandatory}
                name={`mandatory-${versionId}`}
                onChange={next => patchSelected({ mandatory: next })}
                value="1"
              />
              <ol className={styles.itemList}>
                {(selected.items ?? []).map((code, index) => (
                  <li className={styles.itemRow} key={code}>
                    <button className={styles.itemCode} onClick={() => setSelectedItem(code)} type="button">
                      <Mono tone={code === selectedItem ? "primary" : "muted"}>{code}</Mono>
                    </button>
                    <IconButton
                      disabled={index === 0}
                      icon="moveUp"
                      label={`${s.moveUp} ${code}`}
                      onClick={() => moveItem(code, -1)}
                      size="sm"
                    />
                    <IconButton
                      disabled={index === (selected.items?.length ?? 0) - 1}
                      icon="moveDown"
                      label={`${s.moveDown} ${code}`}
                      onClick={() => moveItem(code, 1)}
                      size="sm"
                    />
                    <IconButton
                      icon="remove"
                      label={`${s.removeAria} ${code}`}
                      onClick={() => { patchSelected({ items: (selected.items ?? []).filter(item => item !== code) }); setSelectedItem(""); }}
                      size="sm"
                    />
                  </li>
                ))}
              </ol>
              <SaqeelSelect
                label={s.addItemAria}
                onChange={addItem}
                options={catalog
                  .filter(item => !(selected.items ?? []).includes(item.code))
                  .map(item => ({ value: item.code, label: `${item.code} — ${item.title}` }))}
                placeholder={s.addItem}
                value=""
              />
            </>
          ) : <Text role="label" tone="muted">{s.emptyBody}</Text>}

          {selectedItem && rule ? (
            <ItemRulePanel
              code={selectedItem}
              forms={def.action_forms ?? []}
              onPatch={patchRule}
              rule={rule}
              strings={s}
              versionId={versionId}
              violations={violations}
            />
          ) : null}

          <div className={styles.paneNote}>
            <Text role="bodyStrong">{s.validationTitle}</Text>
            {validationIssues.length ? (
              <ul role="alert">
                {validationIssues.map(issue => (
                  <li key={issue}><Text as="span" role="label" tone="danger">{issue}</Text></li>
                ))}
              </ul>
            ) : (
              <Text live="status" role="label" tone="success">{s.validationClear} {s.circularCheck}</Text>
            )}
          </div>

          <div className={styles.feedback} ref={feedbackRef} tabIndex={-1}>
            {state.error ? <span className={styles.multiline}><Text live="alert" role="label" tone="danger">{state.error}</Text></span> : null}
            {state.ok ? <StatusPill tone="success">{s.draftSaved}</StatusPill> : null}
          </div>

          <div className={styles.actionRow}>
            {!dirty && !state.ok ? <Text as="span" role="label" tone="muted">{s.noChanges}</Text> : null}
            <Button
              busy={pending}
              disabled={pending || !dirty || validationIssues.length > 0}
              size="lg"
              type="submit"
              variant="primary"
            >
              {pending ? s.saving : s.save}
            </Button>
          </div>
        </section>

        <aside className={`${styles.studioPane} ${styles.previewPane}`}>
          <Heading level={4} visual="subheading">{s.preview}</Heading>
          {preview}
          <ActionFormsPane
            forms={def.action_forms ?? []}
            onAdd={addForm}
            onPatch={patchForm}
            onRemove={removeForm}
            strings={s}
            templates={templates}
            versionId={versionId}
          />
        </aside>
      </div>
    </form>
  );
}
