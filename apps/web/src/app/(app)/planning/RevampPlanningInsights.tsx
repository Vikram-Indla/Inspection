import type { PlanningVisitRow } from "@/lib/planning/visit-list";

export default function RevampPlanningInsights({
  rows,
  total,
  returned,
}: {
  rows: PlanningVisitRow[];
  total: number;
  returned: number | string;
}) {
  const now = Date.now();
  const expiring = rows.filter(row => {
    const end = Date.parse(row.windowEnd);
    return Number.isFinite(end) && end >= now && end <= now + 72 * 60 * 60 * 1000;
  });
  const highRisk = rows.filter(row => ["high", "critical"].includes((row.priority ?? "").toLowerCase()));
  const recommendations = highRisk.slice(0, 4);
  return (
    <section className="sq-planning-insights">
      <div>
        <strong>AI insights</strong>
        <p>Provider output is withheld; current governed planning records show:</p>
        <ul>
          <li>{highRisk.length} high-priority visits in the loaded planning page.</li>
          <li>{returned} returned visits require planner attention.</li>
          <li>{expiring.length} loaded visits reach their recorded window end within 72 hours.</li>
          <li>{total} visits match the current RLS-scoped filters.</li>
        </ul>
        <div className="sq-planning-insights__meta">
          <span>AI provider unavailable</span>
          <small>Live record facts remain available</small>
        </div>
      </div>
      <div>
        <strong>AI recommendations</strong>
        {recommendations.length ? recommendations.map(row => (
          <article key={row.id}>
            <div><strong>{row.factoryName ?? row.visitReference ?? row.id.slice(0, 8)}</strong><span>Governed priority · {row.priority}</span></div>
            <p>{row.region ?? "Region unavailable"} · window ends {new Date(row.windowEnd).toLocaleDateString("en-GB")}</p>
            <div><a href="/planning/single">Plan</a><a href={`/visits/${row.id}`}>Review</a></div>
          </article>
        )) : <p className="sq-planning-insights__empty">No high-priority recommendation candidate is visible in this page.</p>}
      </div>
      <div>
        <strong>Quick actions</strong>
        <a href="/planning?tab=returned"><span>Returned visits</span><b>{returned}</b></a>
        <a href="/planning?priority=high"><span>High-priority visits</span><b>{highRisk.length}</b></a>
        <a href="/planning?sort=window_asc"><span>Nearest window expiry</span><b>{expiring.length}</b></a>
        <a href="/planning/bulk"><span>Bulk planning</span><b>→</b></a>
        <a href="/planning/single"><span>Single visit</span><b>→</b></a>
        <a href="/planning/immediate"><span>Immediate visit</span><b>→</b></a>
      </div>
    </section>
  );
}
