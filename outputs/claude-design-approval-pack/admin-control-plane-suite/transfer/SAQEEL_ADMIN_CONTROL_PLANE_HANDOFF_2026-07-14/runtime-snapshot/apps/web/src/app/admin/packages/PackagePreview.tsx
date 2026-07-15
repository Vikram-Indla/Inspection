"use client";
import { useState } from "react";

// M09-028 — "Preview" renders a package version EXACTLY as the inspector will
// see it in the field workspace: sections in order, each item with its response
// model (compliance buttons / date), evidence rule, conditional flag, guidance,
// regulation reference and the action-form template it triggers. Purely a
// read-only projection of the stored definition + item bank — no data writes,
// no server round-trip. It intentionally mirrors the ipad-q / ax-btn--field
// visual language of Workspace.tsx (SCR-IPAD-620) so the checker previews the
// real thing. Copy arrives via the strings prop (SB19), built with t() in page.tsx.

export type PreviewItem = {
  code: string; title: string;
  responses: string[];
  isDate: boolean;
  evidence: { type: string; min: number; mandatory: boolean } | null;
  conditional: string | null;
  guidance: string | null;
  clause: { clause_ref: string; legal_source: string | null } | null;
  ncViolation: string | null;
  ncActionForm: string | null;
  missing?: boolean;
};
export type PreviewSection = { key: string; title: string; items?: string[]; mandatory?: boolean };
export type PreviewActionForm = { key: string; title: string; blocking?: boolean; fields?: string[] };

export type PreviewStrings = {
  open: string; close: string; title: string; asInspector: string;
  conditionalBadge: string; conditionalWhen: string;
  guidanceLabel: string; dateLabel: string;
  evidenceLabel: string; evidenceMandatory: string; evidenceOptional: string; evidenceMin: string;
  noteLabel: string; notePlaceholder: string;
  ncViolation: string; triggersForm: string;
  formBlocking: string; formNonBlocking: string; formAppearsWhen: string;
  sectionMandatory: string; emptySection: string; missingItem: string; readOnly: string;
  enumLabels: Record<string, string>;
  afFieldLabels: Record<string, string>;
  evTypeLabels: Record<string, string>;
};

export default function PackagePreview({ sections, actionForms, itemMap, strings: s }: {
  sections: PreviewSection[];
  actionForms: PreviewActionForm[];
  itemMap: Record<string, PreviewItem>;
  strings: PreviewStrings;
}) {
  const [open, setOpen] = useState(false);
  const formByKey = Object.fromEntries(actionForms.map(f => [f.key, f]));

  return (
    <div className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-row">
        <button type="button" className="ax-btn ax-btn--secondary" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? s.close : s.open}
        </button>
        {open && <span className="ax-lozenge ax-lozenge--info">{s.readOnly}</span>}
      </div>

      {open && (
        <div className="ipad-preview ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)", background: "var(--ax-color-surface-sunken)", borderRadius: "var(--ax-radius-large)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ font: "var(--ax-text-body-strong)" }}>{s.title}</strong>
            <span className="ax-caption">{s.asInspector}</span>
          </div>

          {sections.map(sec => {
            const codes = sec.items ?? [];
            return (
              <section key={sec.key} className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
                <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
                  <h4 style={{ font: "var(--ax-text-heading-xs)" }}>{sec.title}</h4>
                  {sec.mandatory && <span className="ax-lozenge ax-lozenge--critical">{s.sectionMandatory}</span>}
                </div>
                {codes.length === 0 && <p className="ax-caption">{s.emptySection}</p>}
                {codes.map(code => {
                  const it = itemMap[code];
                  if (!it || it.missing) {
                    return <div key={code} className="ax-banner ax-banner--warning"><div><code>{code}</code> — {s.missingItem}</div></div>;
                  }
                  const form = it.ncActionForm ? formByKey[it.ncActionForm] : undefined;
                  return (
                    <div key={code} className="ipad-q" style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-large)", padding: "var(--ax-space-300)", background: "var(--ax-color-surface)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
                      <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)", alignItems: "baseline" }}>
                        <p style={{ font: "var(--ax-text-field)", fontWeight: 600 }}>{it.code} · {it.title}</p>
                        {it.clause && <span className="ax-caption">{it.clause.legal_source ?? ""} §{it.clause.clause_ref}</span>}
                        {it.conditional && <span className="ax-lozenge ax-lozenge--info" title={`${s.conditionalWhen} ${it.conditional}`}>{s.conditionalBadge}</span>}
                      </div>
                      {it.conditional && <p className="ax-caption">{s.conditionalWhen} <code>{it.conditional}</code></p>}
                      {it.guidance && <p className="ax-caption">💡 {s.guidanceLabel}: {it.guidance}</p>}

                      <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                        {it.isDate ? (
                          <label className="ax-field">
                            <span className="ax-field__label">{s.dateLabel}</span>
                            <input className="ax-input" type="date" disabled aria-disabled />
                          </label>
                        ) : it.responses.map(r => (
                          <span key={r} className="ax-btn ax-btn--field" aria-disabled style={{ background: "var(--ax-color-surface)", color: "var(--ax-color-text)", border: "1.5px solid var(--ax-color-border)", cursor: "default", opacity: 0.9 }}>
                            {s.enumLabels[r] ?? r.replace(/_/g, " ")}
                          </span>
                        ))}
                        {it.evidence && (
                          <span className={`ax-lozenge ${it.evidence.mandatory ? "ax-lozenge--warning" : "ax-lozenge--info"}`}>
                            {(s.evTypeLabels[it.evidence.type] ?? it.evidence.type)} · {it.evidence.mandatory ? s.evidenceMandatory : s.evidenceOptional}{it.evidence.min > 1 ? ` · ${s.evidenceMin} ${it.evidence.min}` : ""}
                          </span>
                        )}
                        {it.ncViolation && <span className="ax-lozenge ax-lozenge--warning">{s.ncViolation} {it.ncViolation}</span>}
                      </div>

                      <label className="ax-field">
                        <span className="ax-field__label">{s.noteLabel}</span>
                        <textarea className="ax-textarea" rows={2} placeholder={s.notePlaceholder} disabled aria-disabled />
                      </label>

                      {form && (
                        <div className="ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)", borderInlineStart: "4px solid var(--ax-color-critical)" }}>
                          <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                            <strong>{form.title}</strong>
                            <span className={`ax-lozenge ${form.blocking ? "ax-lozenge--critical" : "ax-lozenge--info"}`}>{form.blocking ? s.formBlocking : s.formNonBlocking}</span>
                          </div>
                          <p className="ax-caption">{s.formAppearsWhen}</p>
                          <div className="ax-grid-2">
                            {(form.fields ?? []).map(f => (
                              <label key={f} className="ax-field" style={f === "required_correction" ? { gridColumn: "1 / -1" } : undefined}>
                                <span className="ax-field__label">{s.afFieldLabels[f] ?? f.replace(/_/g, " ")}<span className="ax-req">*</span></span>
                                <input className="ax-input" type={f === "due_at" ? "date" : "text"} disabled aria-disabled />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
