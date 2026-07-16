"use client";
import { useActionState, useState } from "react";
import { saveDraftDefinition, type PkgResult } from "./actions";

type Section = { key: string; title: string; items?: string[]; mandatory?: boolean; fields?: string[] };
type ActionForm = { key: string; title: string; blocking?: boolean; fields?: string[] };
type Definition = { sections?: Section[]; action_forms?: ActionForm[] };
type CatalogItem = { code: string; title: string };

export type DraftEditorStrings = {
  heading: string;
  editableWhileDraft: string;
  mandatory: string;
  sectionTitleAria: string;
  removeAria: string;
  addItem: string;
  addItemAria: string;
  newSectionTitle: string;
  addSection: string;
  draftSaved: string;
  saving: string;
  save: string;
};

// SCR-ADM-031 — draft-only structural editor. Published versions never render
// this component; the database rejects their edits regardless (M09-030).
// All copy arrives via the strings prop (SB19) — built with useT() in page.tsx.
export default function DraftEditor({ versionId, definition, catalog, strings: s }: {
  versionId: string; definition: Definition; catalog: CatalogItem[]; strings: DraftEditorStrings;
}) {
  const [state, formAction, pending] = useActionState<PkgResult, FormData>(saveDraftDefinition, {});
  const [def, setDef] = useState(definition);
  const [newSection, setNewSection] = useState("");

  const patch = (i: number, sec: Partial<Section>) =>
    setDef(d => ({ ...d, sections: (d.sections ?? []).map((x, j) => j === i ? { ...x, ...sec } : x) }));

  return (
    <form action={formAction} className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)", borderBlockStart: "1px solid var(--ax-color-border)", paddingBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="definition" value={JSON.stringify(def)} />
      <div className="ax-row" style={{ justifyContent: "space-between" }}>
        <strong>{s.heading}</strong>
        <span className="ax-lozenge ax-lozenge--warning">{s.editableWhileDraft}</span>
      </div>

      {(def.sections ?? []).map((sec, i) => (
        <div key={sec.key} style={{ border: "1px dashed var(--ax-color-border)", borderRadius: "var(--ax-radius-standard)", padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap" }}>
            <input className="ax-input" style={{ maxInlineSize: 280 }} value={sec.title}
              onChange={e => patch(i, { title: e.target.value })} aria-label={`${s.sectionTitleAria} — ${sec.key}`} />
            <label className="ax-choice" style={{ display: "flex" }}>
              <input type="checkbox" checked={!!sec.mandatory} onChange={e => patch(i, { mandatory: e.target.checked })} />
              <span>{s.mandatory}</span>
            </label>
          </div>
          <div className="ax-row" style={{ gap: 6, flexWrap: "wrap" }}>
            {(sec.items ?? []).map(code => (
              <span key={code} className="ax-lozenge ax-lozenge--info">
                {code}
                <button type="button" aria-label={`${s.removeAria} ${code}`} style={{ border: 0, background: "none", cursor: "pointer", marginInlineStart: 4 }}
                  onClick={() => patch(i, { items: (sec.items ?? []).filter(c => c !== code) })}>✕</button>
              </span>
            ))}
            <select className="ax-select" style={{ maxInlineSize: 260 }} value=""
              aria-label={`${s.addItemAria} — ${sec.title}`}
              onChange={e => { if (e.target.value) patch(i, { items: [...(sec.items ?? []), e.target.value] }); }}>
              <option value="">{s.addItem}</option>
              {catalog.filter(c => !(sec.items ?? []).includes(c.code)).map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
        <input className="ax-input" style={{ maxInlineSize: 280 }} placeholder={s.newSectionTitle}
          value={newSection} onChange={e => setNewSection(e.target.value)} />
        <button type="button" className="ax-btn" disabled={!newSection.trim()}
          onClick={() => { setDef(d => ({ ...d, sections: [...(d.sections ?? []), { key: `s${(d.sections ?? []).length + 1}-${newSection.trim().toLowerCase().replace(/\W+/g, "-").slice(0, 24)}`, title: newSection.trim(), items: [] }] })); setNewSection(""); }}>
          {s.addSection}
        </button>
      </div>

      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.draftSaved}</span>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.saving : s.save}</button>
      </div>
    </form>
  );
}
