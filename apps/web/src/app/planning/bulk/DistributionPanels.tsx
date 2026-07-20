// CD-021 (SCR-WEB-110) — distribution panels (design frame 1a).
// List-first, accessible distributions of the eligible set across region, risk
// band and activity class. Every panel shows its denominator and an explicit
// "unknown" bucket (null/blank values are surfaced, never dropped). Pure counts
// over the already-evaluated set — no AI, no ranking, no auto-selection.
// A map view is a later optional channel (COMPONENT_MAP GeoMap PRESERVE); the
// list is the equivalent primary channel and is always present.

export type Bucket = { label: string; count: number; unknown?: boolean };
export type Distribution = { key: string; heading: string; total: number; buckets: Bucket[] };

export type DistributionStrings = {
  heading: string;
  ofDenominator: string; // "of {n}"
  unknown: string;       // "unknown"
  riskAdvisory: string;  // ENG-04 advisory label
};

function Panel({ dist, strings, focusedValue }: { dist: Distribution; strings: DistributionStrings; focusedValue?: string }) {
  const max = Math.max(1, ...dist.buckets.map(b => b.count));
  return (
    <section className="ax-surface" aria-label={dist.heading}
      style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h4 style={{ margin: 0 }}>{dist.heading}</h4>
        <span className="t-caption numeric">{strings.ofDenominator.replace("{n}", String(dist.total))}</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
        {dist.buckets.map(b => {
          const pct = Math.round((b.count / max) * 100);
          const isFocused = focusedValue != null && b.label.toLowerCase() === focusedValue.toLowerCase();
          return (
            <li key={b.label} className="row"
              style={{ gap: "var(--ax-space-150)", alignItems: "center", outline: isFocused ? "2px solid var(--ax-color-primary)" : undefined, borderRadius: "var(--ax-radius-small)" }}>
              <span style={{ minInlineSize: 120, flexShrink: 0 }}>
                {b.unknown ? <span className="badge badge-warning">? {strings.unknown}</span> : <bdi>{b.label}</bdi>}
              </span>
              <span aria-hidden="true" style={{
                blockSize: 8, inlineSize: `${pct}%`, minInlineSize: 2,
                background: "var(--ax-color-primary)", borderRadius: "var(--ax-radius-small)",
              }} />
              <span className="numeric t-caption" style={{ marginInlineStart: "auto" }}>{b.count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function DistributionPanels({ distributions, strings, focusedField, focusedValue }: {
  distributions: Distribution[];
  strings: DistributionStrings;
  focusedField?: string | null;
  focusedValue?: string | null;
}) {
  return (
    <section aria-label={strings.heading}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "var(--ax-space-200)" }}>
      {distributions.map(d => (
        <div key={d.key}>
          <Panel dist={d} strings={strings} focusedValue={d.key === focusedField ? (focusedValue ?? undefined) : undefined} />
          {d.key === "risk_band" && <p className="t-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>{strings.riskAdvisory}</p>}
        </div>
      ))}
    </section>
  );
}
