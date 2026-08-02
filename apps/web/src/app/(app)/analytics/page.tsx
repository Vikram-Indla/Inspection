import Link from "next/link";
import { StateSurface } from "@/components/saqeel";
import { supabaseServer } from "@/lib/supabase-server";
import { loadAnalytics } from "@/lib/analytics/loader";
import { parseAnalyticsQuery } from "@/lib/analytics/query-state";
import { ANALYTICS_METRICS, UNCONFIGURED_ANALYTICS } from "@/lib/analytics/metric-registry";
import { analyticsDrillHref } from "@/lib/analytics/drills";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
type Search = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { locale, t } = await useT();
  const title = t("analytics.title", locale === "ar" ? "التحليلات" : "Analytics");
  const parsed = parseAnalyticsQuery(await searchParams);
  if (!parsed.ok) return <StateSurface kind="error" locale={locale} title={t("analytics.query.invalid", "Invalid analytics query")} body={parsed.issues.join(" ")} />;
  const result = await loadAnalytics(await supabaseServer(), parsed.value);
  if (result.kind === "unauthorized") return <StateSurface kind="unauthorized" locale={locale} />;
  if (result.kind === "error") {
    const correlationId = crypto.randomUUID();
    console.error(`[analytics:${correlationId}]`, result.message);
    return <StateSurface kind="error" locale={locale} body={`${result.message} Reference ${correlationId}.`} />;
  }
  return (
    <main className="sq-content" aria-labelledby="analytics-title">
      <header className="page-header"><div>
        <h1 id="analytics-title">{title}</h1>
        <p className="desc">Governed aggregates for {parsed.value.periodFrom} through {parsed.value.periodTo}. Values reflect only records visible to your role and scope.</p>
        {parsed.value.compareFrom && parsed.value.compareTo ? <p className="desc">Comparison period {parsed.value.compareFrom} through {parsed.value.compareTo}: Decision required before numeric comparison is enabled.</p> : null}
      </div>
        <div className="row">
          <span className={`badge ${result.kind === "degraded" ? "badge-warning" : result.stale ? "badge-pending" : "badge-compliant"}`}>
            {result.kind === "degraded" ? "Source degraded" : result.stale ? "Source stale" : "Source available"}
          </span>
          <Link className="btn btn-secondary btn-sm" href="/operations">Operations</Link>
          <Link className="btn btn-secondary btn-sm" href="/execution">Execution</Link>
          <Link className="btn btn-secondary btn-sm" href="/reviews">Review queue</Link>
        </div>
      </header>
      <form className="grid-toolbar" method="get" action="/analytics" aria-label="Analytics filters">
        <div className="field"><label htmlFor="analytics-from">From</label><input className="input" id="analytics-from" type="date" name="periodFrom" defaultValue={parsed.value.periodFrom} /></div>
        <div className="field"><label htmlFor="analytics-to">To</label><input className="input" id="analytics-to" type="date" name="periodTo" defaultValue={parsed.value.periodTo} /></div>
        <div className="field"><label htmlFor="analytics-compare-from">Compare from</label><input className="input" id="analytics-compare-from" type="date" name="compareFrom" defaultValue={parsed.value.compareFrom ?? ""} /></div>
        <div className="field"><label htmlFor="analytics-compare-to">Compare to</label><input className="input" id="analytics-compare-to" type="date" name="compareTo" defaultValue={parsed.value.compareTo ?? ""} /></div>
        <div className="field"><label htmlFor="analytics-region">Region</label><input className="input" id="analytics-region" type="search" name="region" defaultValue={parsed.value.region ?? ""} /></div>
        <div className="field"><label htmlFor="analytics-method">Inspection type</label><select className="select" id="analytics-method" name="method" defaultValue={parsed.value.method ?? ""}><option value="">All</option><option value="bulk">Bulk</option><option value="single">Single</option><option value="immediate">Immediate</option></select></div>
        <div className="field"><label htmlFor="analytics-status">Status</label><select className="select" id="analytics-status" name="status" defaultValue={parsed.value.status ?? ""}><option value="">All</option><option value="published">Published</option><option value="executing">Executing</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <button className="btn btn-primary" type="submit">Apply filters</button>
        <span className="grow" aria-hidden="true"></span>
        <Link className="btn btn-ghost" href="/analytics">Reset</Link>
        <button type="button" className="btn btn-secondary" disabled>Export · unavailable</button>
      </form>
      {result.kind === "degraded" ? <StateSurface kind="degraded" locale={locale} body={`Affected source: ${result.affectedSource}. Available governed results remain visible.`} /> : null}
      {result.stale ? <StateSurface kind="stale" locale={locale} title="Stale analytics result" body={`Last successful refresh: ${result.refreshedAt}.`} /> : null}
      {result.rows.length === 0 ? <StateSurface kind="empty" locale={locale} /> : <section aria-labelledby="configured-metrics">
        <h2 id="configured-metrics">Executive KPI band</h2>
        <p className="desc">Source refresh: <time dateTime={result.refreshedAt}>{result.refreshedAt}</time>. Every metric exposes its governed lineage key.</p>
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
            <code className="id-code">{metric.trace}</code>
            <h3 className="kpi-label">{metric.title}</h3>
            <p className="kpi-value">{governed ? display : <span className="badge badge-pending">{display}</span>}</p>
            <p className="desc">{metric.definition}</p>
            {row?.breakdown ? <dl>{Object.entries(row.breakdown).map(([label,value]) => <div key={label}><dt>{label.replaceAll("_"," ")}</dt><dd>{String(value)}</dd></div>)}</dl> : null}
            <Link className="btn btn-ghost btn-sm" href={analyticsDrillHref(metric.key, parsed.value)}>View governed records</Link>
          </article>;
        })}</div>
      </section>}
      <section className="sq-grid-2" aria-label="Analytics investigations">
        <article className="panel stack">
          <h2>Planning-to-execution</h2>
          <p className="desc">Chronology is sourced through governed metric snapshots. No unavailable stage is represented as zero.</p>
          <div className="alert alert-warning"><div><strong>Insufficient evidence.</strong> Stage-level conversion is unavailable from the current aggregate contract.</div></div>
        </article>
        <article className="panel stack">
          <h2>Regional and factory investigation</h2>
          <p className="desc">Factory drill-through remains available from governed metric cards where the source provides supporting records.</p>
          <div className="alert alert-warning"><div><strong>Insufficient evidence.</strong> No ranked regional result is inferred from the current response.</div></div>
        </article>
      </section>
      <section aria-labelledby="unconfigured-metrics"><h2 id="unconfigured-metrics">Operational bottlenecks</h2>
        {/* Same anatomy as the metric cards above: a bordered row per item,
            label leading, state badge trailing — not a bullet list. */}
        <div className="stack">
          {UNCONFIGURED_ANALYTICS.map(item => (
            <div className="panel panel-row" key={item.title}>
              <strong>{item.title}</strong><span className="badge badge-pending">{item.state}</span>
            </div>
          ))}
          <div className="panel panel-row">
            <strong>Strategic inspection brief</strong><span className="badge badge-pending">Not configured. It cannot approve, publish, assign, penalise or enforce.</span>
          </div>
          <div className="panel panel-row">
            <strong>Operational attention queue</strong><span className="badge badge-pending">Not configured. No live AI request is made.</span>
          </div>
          <div className="panel panel-row">
            <strong>Export</strong><span className="badge badge-pending">Unavailable pending a canonical audit and correlation contract.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
