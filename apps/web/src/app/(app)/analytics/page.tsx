import Link from "next/link";
import { StateSurface } from "@/components/saqeel";
import { supabaseServer } from "@/lib/supabase-server";
import { loadAnalytics } from "@/lib/analytics/loader";
import { parseAnalyticsQuery } from "@/lib/analytics/query-state";
import { ANALYTICS_METRICS, UNCONFIGURED_ANALYTICS } from "@/lib/analytics/metric-registry";
import { analyticsDrillHref } from "@/lib/analytics/drills";

export const dynamic = "force-dynamic";
type Search = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const parsed = parseAnalyticsQuery(await searchParams);
  if (!parsed.ok) return <StateSurface kind="error" title="Invalid analytics query" body={parsed.issues.join(" ")} />;
  const result = await loadAnalytics(await supabaseServer(), parsed.value);
  if (result.kind === "unauthorized") return <StateSurface kind="unauthorized" />;
  if (result.kind === "error") return <StateSurface kind="error" body={result.message} />;
  return (
    <main className="sq-stack" aria-labelledby="analytics-title">
      <header className="page-header"><div>
        <h1 id="analytics-title">Analytics</h1>
        <p className="desc">Governed aggregates for {parsed.value.periodFrom} through {parsed.value.periodTo}. Values reflect only records visible to your role and scope.</p>
        {parsed.value.compareFrom && parsed.value.compareTo ? <p className="desc">Comparison period {parsed.value.compareFrom} through {parsed.value.compareTo}: Decision required before numeric comparison is enabled.</p> : null}
      </div>
        {/* CLASS-CONTRACT.md § Analytics — export is genuinely unavailable
            (no canonical audit/correlation contract), so it renders as a
            disabled control, never as a working action. */}
        <button type="button" className="btn btn-secondary btn-sm" disabled>Export · unavailable</button>
      </header>
      {result.kind === "degraded" ? <StateSurface kind="degraded" body={`Affected source: ${result.affectedSource}. Available governed results remain visible.`} /> : null}
      {result.stale ? <StateSurface kind="stale" title="Stale analytics result" body={`Last successful refresh: ${result.refreshedAt}.`} /> : null}
      {result.rows.length === 0 ? <StateSurface kind="rls-denied" /> : <section aria-labelledby="configured-metrics">
        <h2 id="configured-metrics">Configured metrics</h2>
        <div className="kpi-grid">{ANALYTICS_METRICS.map(metric => {
          const row = result.rows.find(candidate => candidate.metric_key === metric.key);
          // A metric that is not resolvable to a governed number renders as a
          // state, never as an invented value (CLASS-CONTRACT.md § Analytics:
          // span.badge.badge-pending when not configured).
          const governed = !!row && (row.source_status === "ok" || row.source_status === "stale") && row.value !== null;
          const display = !row ? "Unavailable" : row.source_status === "ok" || row.source_status === "stale"
            ? row.value === null ? "N/A" : metric.format(row.value)
            : row.source_status === "not_applicable" ? "Not applicable"
            : row.source_status === "not_configured" ? "Not configured"
            : row.source_status === "decision_required" ? "Decision required" : "Unavailable";
          // Fixed vertical order per card so the grid aligns row-to-row:
          // id-code, label, value-or-state, definition, drill link.
          return <article className="panel kpi" key={metric.key}>
            <span className="id-code">{metric.trace}</span>
            <h3 className="kpi-label">{metric.title}</h3>
            <p className="kpi-value">{governed ? display : <span className="badge badge-pending">{display}</span>}</p>
            <p className="desc">{metric.definition}</p>
            {row?.breakdown ? <dl>{Object.entries(row.breakdown).map(([label,value]) => <div key={label}><dt>{label.replaceAll("_"," ")}</dt><dd>{String(value)}</dd></div>)}</dl> : null}
            <Link className="btn btn-ghost btn-sm" href={analyticsDrillHref(metric.key, parsed.value)}>View governed records</Link>
          </article>;
        })}</div>
      </section>}
      <section aria-labelledby="unconfigured-metrics"><h2 id="unconfigured-metrics">Governance-dependent analytics</h2>
        {/* Same anatomy as the metric cards above: a bordered row per item,
            label leading, state badge trailing — not a bullet list. */}
        <div className="stack">
          {UNCONFIGURED_ANALYTICS.map(item => (
            <div className="panel row" style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }} key={item.title}>
              <strong>{item.title}</strong><span className="badge badge-pending">{item.state}</span>
            </div>
          ))}
          <div className="panel row" style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }}>
            <strong>AI assistance</strong><span className="badge badge-pending">Not configured. No live AI request is made.</span>
          </div>
          <div className="panel row" style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }}>
            <strong>Export</strong><span className="badge badge-pending">Unavailable pending a canonical audit and correlation contract.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
