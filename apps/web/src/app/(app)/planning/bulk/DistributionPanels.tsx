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
    <section className="panel" aria-label={dist.heading}>
      <header className="panel-header">
        <h3 className="panel-title">{dist.heading}</h3>
        <span className="t-caption numeric">{strings.ofDenominator.replace("{n}", String(dist.total))}</span>
      </header>
      <ul className="panel-body stack">
        {dist.buckets.map(b => {
          const isFocused = focusedValue != null && b.label.toLowerCase() === focusedValue.toLowerCase();
          return (
            <li key={b.label} className="row" aria-current={isFocused ? "true" : undefined}>
              <span className="grow">
                {b.unknown ? <span className="badge badge-warning">? {strings.unknown}</span> : <bdi>{b.label}</bdi>}
              </span>
              <progress max={max} value={b.count} aria-label={`${b.label}: ${b.count}`} />
              <span className="numeric t-caption">{b.count}</span>
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
    <section className="sq-grid-2" aria-label={strings.heading}>
      {distributions.map(d => (
        <div key={d.key} className="stack">
          <Panel dist={d} strings={strings} focusedValue={d.key === focusedField ? (focusedValue ?? undefined) : undefined} />
          {d.key === "risk_band" && <p className="t-caption">{strings.riskAdvisory}</p>}
        </div>
      ))}
    </section>
  );
}
