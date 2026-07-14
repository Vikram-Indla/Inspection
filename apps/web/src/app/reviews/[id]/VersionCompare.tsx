"use client";
import { useMemo, useRef, useState } from "react";

// CD-030 / SCR-WEB-320 — Version Comparison, route-neutral compare mode inside
// /reviews/:id. The signature interaction is the Tamper-evident Scope Rail: it
// classifies every changed answer against the review's STORED returned scope
// (reviews.returned_sections) — never inferred from the diff itself. Categories:
//   expected     — changed inside the returned scope (the inspector was asked to)
//   unexpected   — changed OUTSIDE the returned scope (a locked-section change / tamper)
//   unchanged    — identical across the two versions
//   unavailable  — cannot be classified (no returned scope on record, or the
//                  answer maps to no known section). NEVER downgraded to "unchanged".
// Comparison is navigation-only: selecting a rail row scrolls to the diff row.
// There is no accept/merge action (HANDOFF_BLOCKED_ACCEPT). Evidence/media,
// package-semantic and metadata/section-order comparisons are not derived in the
// runtime and are shown explicitly unavailable, never "unchanged"
// (HANDOFF_BLOCKED_MEDIADIFF / _PKGSEMANTIC / _METADIFF).

export type CompareVersion = { n: number; answers: Record<string, string> };
export type ItemSection = Record<string, { key: string; title: string }>;

export type VersionCompareStrings = {
  heading: string;
  scopeSource: string;          // "Returned scope authority: {label}"
  noScope: string;              // no returned scope on record
  from: string; to: string;
  colItem: string; colSection: string; colClass: string;
  catExpected: string; catUnexpected: string; catUnchanged: string; catUnavailable: string;
  tamperTitle: string; tamperBody: string;
  cleanTitle: string; cleanBody: string;
  noPrior: string;
  emptyDiff: string;
  navHint: string;
  unavailableHeading: string;
  unavailEvidence: string; unavailPackage: string; unavailMetadata: string;
  unavailNote: string;
  enumLabels: Record<string, string>;   // stored answer value -> translated label
};

type Category = "expected" | "unexpected" | "unchanged" | "unavailable";
const GLYPH: Record<Category, string> = { expected: "✔", unexpected: "▲", unchanged: "=", unavailable: "○" };
const LOZ: Record<Category, string> = {
  expected: "ax-lozenge ax-lozenge--success",
  unexpected: "ax-lozenge ax-lozenge--critical",
  unchanged: "ax-lozenge",
  unavailable: "ax-lozenge ax-lozenge--warning",
};

export default function VersionCompare({ versions, itemSection, returnedScope, scopeLabel, strings }: {
  versions: CompareVersion[];          // sorted newest-first
  itemSection: ItemSection;            // answer-key -> owning section
  returnedScope: string[] | null;      // stored section keys; null when no return on record
  scopeLabel: string | null;           // human label of the return that set the scope
  strings: VersionCompareStrings;
}) {
  const numbers = versions.map(v => v.n);
  const latest = numbers[0];
  const prior = numbers[1];
  const [toN, setToN] = useState<number>(latest);
  const [fromN, setFromN] = useState<number | undefined>(prior);
  const [open, setOpen] = useState<Record<Category, boolean>>({ expected: true, unexpected: true, unchanged: false, unavailable: true });
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const from = versions.find(v => v.n === fromN);
  const to = versions.find(v => v.n === toN);

  const rows = useMemo(() => {
    if (!from || !to) return [];
    const keys = Array.from(new Set([...Object.keys(from.answers), ...Object.keys(to.answers)])).sort();
    return keys.map(k => {
      const a = from.answers[k];
      const b = to.answers[k];
      const changed = a !== b;
      const sect = itemSection[k];
      let category: Category;
      if (!changed) {
        category = "unchanged";
      } else if (returnedScope == null || !sect) {
        // Scope cannot be established for this change — never call it "unchanged".
        category = "unavailable";
      } else {
        category = returnedScope.includes(sect.key) ? "expected" : "unexpected";
      }
      return { key: k, prev: a, latest: b, changed, section: sect, category };
    });
  }, [from, to, itemSection, returnedScope]);

  const counts: Record<Category, number> = { expected: 0, unexpected: 0, unchanged: 0, unavailable: 0 };
  rows.forEach(r => { counts[r.category] += 1; });
  const changedRows = rows.filter(r => r.changed);
  const tamper = counts.unexpected > 0;
  const scopeKnown = returnedScope != null;

  function goToRow(key: string) {
    const el = rowRefs.current[key];
    if (el) { el.scrollIntoView({ block: "center", behavior: "auto" }); el.focus(); }
  }

  const categories: Category[] = ["unexpected", "expected", "unavailable", "unchanged"];

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
      <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.heading}</h4>

      {/* Version selectors — explicit from/to. Default latest vs prior. */}
      <div className="ax-row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-200)" }}>
        <div className="ax-field" style={{ maxInlineSize: 220 }}>
          <label className="ax-field__label" htmlFor="cmp-from">{strings.from}</label>
          <select id="cmp-from" className="ax-select" value={fromN ?? ""} onChange={e => setFromN(e.target.value === "" ? undefined : Number(e.target.value))}>
            {numbers.map(n => <option key={n} value={n}>v{n}</option>)}
          </select>
        </div>
        <div className="ax-field" style={{ maxInlineSize: 220 }}>
          <label className="ax-field__label" htmlFor="cmp-to">{strings.to}</label>
          <select id="cmp-to" className="ax-select" value={toN} onChange={e => setToN(Number(e.target.value))}>
            {numbers.map(n => <option key={n} value={n}>v{n}</option>)}
          </select>
        </div>
      </div>

      {/* Returned-scope authority — always stated; never inferred from the diff. */}
      <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-150)" }}>
        {scopeKnown
          ? strings.scopeSource.replace("{label}", scopeLabel ?? "—")
          : strings.noScope}
      </p>

      {/* Navigation-only is a property of the whole surface — stated even in the
          no-prior state where there is no rail to scroll. */}
      <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.navHint}</p>

      {fromN === undefined ? (
        <div className="ax-banner" role="status"><div>{strings.noPrior}</div></div>
      ) : (
        <>
          {/* One blocking alert for tamper; otherwise a clean status. */}
          {tamper ? (
            <div className="ax-banner ax-banner--critical" role="alert">
              <div><strong>{strings.tamperTitle}</strong> {strings.tamperBody}</div>
            </div>
          ) : scopeKnown && changedRows.length > 0 ? (
            <div className="ax-banner ax-banner--success" role="status">
              <div><strong>{strings.cleanTitle}</strong> {strings.cleanBody}</div>
            </div>
          ) : null}

          {/* Tamper-evident Scope Rail — keyboard disclosure list, non-color glyphs. */}
          <div className="ax-stack" style={{ gap: "var(--ax-space-100)", marginBlock: "var(--ax-space-200)" }} aria-label={strings.heading}>
            {categories.map(cat => {
              const items = rows.filter(r => r.category === cat && (cat === "unchanged" ? true : r.changed));
              if (cat !== "unchanged" && items.length === 0 && counts[cat] === 0 && !(cat === "unavailable" && !scopeKnown)) return null;
              const label = cat === "expected" ? strings.catExpected : cat === "unexpected" ? strings.catUnexpected : cat === "unchanged" ? strings.catUnchanged : strings.catUnavailable;
              const panelId = `cmp-cat-${cat}`;
              return (
                <div key={cat} className="ax-surface" style={{ padding: "var(--ax-space-150)" }}>
                  <button type="button" className="ax-btn ax-btn--subtle" aria-expanded={open[cat]} aria-controls={panelId}
                    onClick={() => setOpen(o => ({ ...o, [cat]: !o[cat] }))}
                    style={{ inlineSize: "100%", justifyContent: "flex-start", gap: "var(--ax-space-150)" }}>
                    <span className={LOZ[cat]} aria-hidden="true">{GLYPH[cat]}</span>
                    <span>{label}</span>
                    <span className="ax-numeric" style={{ marginInlineStart: "auto" }}>{cat === "unchanged" ? counts.unchanged : items.length}</span>
                  </button>
                  {open[cat] && (
                    <ul id={panelId} style={{ listStyle: "none", margin: 0, padding: "var(--ax-space-100) 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                      {items.length === 0
                        ? <li className="ax-caption">{cat === "unavailable" && !scopeKnown ? strings.noScope : "—"}</li>
                        : items.map(r => (
                          <li key={r.key}>
                            <button type="button" className="ax-btn ax-btn--subtle" onClick={() => goToRow(r.key)}
                              style={{ inlineSize: "100%", justifyContent: "flex-start", gap: "var(--ax-space-150)" }}>
                              <span className="ax-numeric">{r.key}</span>
                              {r.section && <span className="ax-caption">{r.section.title}</span>}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Answer diff — stored snapshots, union of keys. Classification column. */}
          {changedRows.length === 0 ? (
            <div className="ax-banner" role="status"><div>{strings.emptyDiff}</div></div>
          ) : (
            <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr>
                <th>{strings.colItem}</th>
                <th>{strings.colSection}</th>
                <th>v{fromN}</th>
                <th>v{toN}</th>
                <th>{strings.colClass}</th>
              </tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.key} id={`cmp-${r.key}`} tabIndex={-1}
                  ref={el => { rowRefs.current[r.key] = el; }}
                  style={r.category === "unexpected" ? { borderInlineStart: "4px solid var(--ax-color-critical)" } : undefined}>
                  <td><strong className="ax-numeric">{r.key}</strong></td>
                  <td>{r.section ? r.section.title : <span className="ax-lozenge ax-lozenge--warning" aria-hidden="false">{GLYPH.unavailable} {strings.catUnavailable}</span>}</td>
                  <td>{r.prev != null ? (strings.enumLabels[r.prev] ?? r.prev) : "—"}</td>
                  <td>{r.latest != null ? (strings.enumLabels[r.latest] ?? r.latest) : "—"}</td>
                  <td><span className={LOZ[r.category]}><span aria-hidden="true">{GLYPH[r.category]}</span>{" "}{
                    r.category === "expected" ? strings.catExpected : r.category === "unexpected" ? strings.catUnexpected : r.category === "unchanged" ? strings.catUnchanged : strings.catUnavailable
                  }</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </>
      )}

      {/* Explicitly unavailable comparison categories — never rendered as "unchanged". */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-150)", marginBlockStart: "var(--ax-space-200)" }}>
        <p className="ax-overline" style={{ marginBlockEnd: 8 }}>{strings.unavailableHeading}</p>
        <p className="ax-caption"><span className="ax-lozenge ax-lozenge--warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailEvidence}</p>
        <p className="ax-caption"><span className="ax-lozenge ax-lozenge--warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailPackage}</p>
        <p className="ax-caption"><span className="ax-lozenge ax-lozenge--warning" aria-hidden="true">{GLYPH.unavailable}</span> {strings.unavailMetadata}</p>
        <p className="ax-caption" style={{ marginBlockStart: 8 }}>{strings.unavailNote}</p>
      </div>
    </div>
  );
}
