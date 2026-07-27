import type { PlanningVisitRow } from "@/lib/planning/visit-list";

export default function RevampPlanningInsights({
  rows,
  total,
  returned,
  strings,
}: {
  rows: PlanningVisitRow[];
  total: number;
  returned: number | string;
  strings: {
    insights: string; withheld: string; highPriority: string; returned: string;
    expiring: string; matching: string; unavailable: string; factsAvailable: string;
    recommendations: string; priority: string; windowEnds: string; regionUnavailable: string;
    plan: string; review: string; noCandidates: string; quickActions: string;
    returnedVisits: string; highPriorityVisits: string; nearestExpiry: string;
    bulkPlanning: string; singleVisit: string; immediateVisit: string;
  };
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
        <strong>{strings.insights}</strong>
        <p>{strings.withheld}</p>
        <ul>
          <li>{strings.highPriority.replace("{n}", String(highRisk.length))}</li>
          <li>{strings.returned.replace("{n}", String(returned))}</li>
          <li>{strings.expiring.replace("{n}", String(expiring.length))}</li>
          <li>{strings.matching.replace("{n}", String(total))}</li>
        </ul>
        <div className="sq-planning-insights__meta">
          <span>{strings.unavailable}</span>
          <small>{strings.factsAvailable}</small>
        </div>
      </div>
      <div>
        <strong>{strings.recommendations}</strong>
        {/* CLASS-CONTRACT.md § Planning — recommendation cards are div.panel,
            each carrying btn-secondary "Plan" + btn-ghost "Review". Confidence
            and generation-time provenance are NOT rendered: no governed value
            for them exists, and __meta already states that honestly. */}
        {recommendations.length ? recommendations.map(row => (
          <article className="panel" key={row.id}>
            <div><strong>{row.factoryName ?? row.visitReference ?? row.id.slice(0, 8)}</strong><span>{strings.priority} · {row.priority}</span></div>
            <p>{row.region ?? strings.regionUnavailable} · {strings.windowEnds} {new Date(row.windowEnd).toLocaleDateString("en-GB")}</p>
            <div><a className="btn btn-secondary" href="/planning/single">{strings.plan}</a><a className="btn btn-ghost" href={`/visits/${row.id}`}>{strings.review}</a></div>
          </article>
        )) : <p className="desc">{strings.noCandidates}</p>}
      </div>
      <div>
        <strong>{strings.quickActions}</strong>
        {/* CLASS-CONTRACT.md § Planning — six bucket controls, each a
            btn-secondary carrying a span.badge count. */}
        <a className="btn btn-secondary" href="/planning?tab=returned"><span>{strings.returnedVisits}</span><span className="badge">{returned}</span></a>
        <a className="btn btn-secondary" href="/planning?priority=high"><span>{strings.highPriorityVisits}</span><span className="badge">{highRisk.length}</span></a>
        <a className="btn btn-secondary" href="/planning?sort=window_asc"><span>{strings.nearestExpiry}</span><span className="badge">{expiring.length}</span></a>
        <a className="btn btn-secondary" href="/planning/bulk"><span>{strings.bulkPlanning}</span><span className="badge">→</span></a>
        <a className="btn btn-secondary" href="/planning/single"><span>{strings.singleVisit}</span><span className="badge">→</span></a>
        <a className="btn btn-secondary" href="/planning/immediate"><span>{strings.immediateVisit}</span><span className="badge">→</span></a>
      </div>
    </section>
  );
}
