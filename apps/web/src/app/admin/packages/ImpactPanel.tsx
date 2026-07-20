"use client";

// M09-013 — Impact panel. Everything here is SERVER-COMPUTED from live data and
// passed in as props (SB19); this component only renders. Three real signals a
// checker needs BEFORE Approve & publish:
//   1) how many in-flight visits/inspections are pinned to PRIOR published
//      versions of this package (aggregate RPC, 0024 — they run frozen);
//   2) which OTHER published packages reference the same items in this version
//      (shared-item fan-out — edits here ripple to those packages too);
//   3) the added / removed / moved items and action forms vs the currently
//      published version of this package.

export type PinnedImpact = {
  active_visits: number; active_inspections: number; prior_count: number;
  prior: { label: string; visits: number; inspections: number }[];
};
export type ReferencingPackage = { code: string; title: string; label: string; sharedItems: string[] };
export type DefinitionDiff = {
  isCurrentPublished: boolean;
  comparedLabel: string | null;
  added: string[]; removed: string[]; moved: string[];
  formsAdded: string[]; formsRemoved: string[];
};
export type ImpactData = {
  pinned: PinnedImpact | null;
  referencing: ReferencingPackage[];
  diff: DefinitionDiff | null;
};

export type ImpactStrings = {
  title: string;
  pinnedTitle: string; pinnedNone: string; pinnedVisits: string; pinnedInspections: string;
  pinnedHint: string; pinnedUnavailable: string; priorLead: string; priorLine: string;
  refTitle: string; refNone: string; refShares: string;
  diffTitle: string; diffVsCurrent: string; diffIsCurrent: string; diffNoBaseline: string;
  added: string; removed: string; moved: string; formsAdded: string; formsRemoved: string; noChanges: string;
};

const fmt = (t: string, vars: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

function CodeList({ label, codes, tone }: { label: string; codes: string[]; tone: string }) {
  if (codes.length === 0) return null;
  return (
    <div className="row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap", alignItems: "baseline" }}>
      <span className="t-caption">{label}</span>
      {codes.map(c => <span key={c} className={`ax-lozenge ${tone}`}>{c}</span>)}
    </div>
  );
}

export default function ImpactPanel({ data, strings: s }: { data: ImpactData; strings: ImpactStrings }) {
  const { pinned, referencing, diff } = data;
  const diffEmpty = diff && !diff.isCurrentPublished
    && diff.added.length + diff.removed.length + diff.moved.length + diff.formsAdded.length + diff.formsRemoved.length === 0;

  return (
    <div className="ax-panel ax-impact" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)", borderInlineStart: "4px solid var(--ax-color-primary)" }}>
      <h4 style={{ font: "var(--ax-text-body-strong)", margin: 0 }}>{s.title}</h4>

      {/* 1 · in-flight items pinned to prior published versions */}
      <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <span className="ax-field__label">{s.pinnedTitle}</span>
        {pinned == null ? (
          <p className="t-caption" role="status"><span aria-hidden="true">⚠ </span>{s.pinnedUnavailable}</p>
        ) : (pinned.active_visits + pinned.active_inspections === 0) ? (
          <p className="t-caption" role="status"><span aria-hidden="true">✓ </span>{s.pinnedNone}</p>
        ) : (
          <>
            <div className="row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap" }}>
              <span className="ax-lozenge ax-lozenge--warning">{fmt(s.pinnedVisits, { n: pinned.active_visits })}</span>
              <span className="ax-lozenge ax-lozenge--warning">{fmt(s.pinnedInspections, { n: pinned.active_inspections })}</span>
            </div>
            {pinned.prior.length > 0 && (
              <ul className="t-caption" style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)" }}>
                <li style={{ listStyle: "none", marginInlineStart: "calc(-1 * var(--ax-space-300))" }}>{s.priorLead}</li>
                {pinned.prior.map(p => (
                  <li key={p.label}>{fmt(s.priorLine, { label: p.label, visits: p.visits, inspections: p.inspections })}</li>
                ))}
              </ul>
            )}
            <p className="t-caption">{s.pinnedHint}</p>
          </>
        )}
      </div>

      {/* 2 · other published packages sharing these items */}
      <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <span className="ax-field__label">{s.refTitle}</span>
        {referencing.length === 0 ? (
          <p className="t-caption">{s.refNone}</p>
        ) : (
          <ul className="t-caption" style={{ margin: 0, paddingInlineStart: "var(--ax-space-300)" }}>
            {referencing.map(r => (
              <li key={`${r.code}-${r.label}`}>
                <strong>{r.code}</strong> {r.title} <span className="numeric">({r.label})</span> — {fmt(s.refShares, { n: r.sharedItems.length })}: {r.sharedItems.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3 · definition diff vs currently-published version */}
      <div className="stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <span className="ax-field__label">{s.diffTitle}</span>
        {(() => {
          if (diff == null) return <p className="t-caption">{s.diffNoBaseline}</p>;
          if (diff.isCurrentPublished) return <p className="t-caption">{s.diffIsCurrent}</p>;
          return (
            <>
              <p className="t-caption">{fmt(s.diffVsCurrent, { label: diff.comparedLabel ?? "" })}</p>
              {diffEmpty ? <p className="t-caption">{s.noChanges}</p> : (
                <>
                  <CodeList label={s.added} codes={diff.added} tone="ax-lozenge--success" />
                  <CodeList label={s.removed} codes={diff.removed} tone="ax-lozenge--critical" />
                  <CodeList label={s.moved} codes={diff.moved} tone="ax-lozenge--info" />
                  <CodeList label={s.formsAdded} codes={diff.formsAdded} tone="ax-lozenge--success" />
                  <CodeList label={s.formsRemoved} codes={diff.formsRemoved} tone="ax-lozenge--critical" />
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
