import type { PlanningVisitRow } from "@/lib/planning/visit-list";
import type { PlanningAiResult } from "@/lib/planning/ai-recommendations";

export default function RevampPlanningInsights({
  rows,
  returned,
  ai,
  strings,
}: {
  rows: PlanningVisitRow[];
  returned: number | string;
  ai: PlanningAiResult;
  strings: {
    insights: string; withheld: string; highPriority: string; returned: string;
    expiring: string; matching: string; unavailable: string; factsAvailable: string;
    connected: string; advisory: string;
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
  const aiRecommendationRows = ai.recommendations.flatMap(recommendation => {
    const row = rows.find(candidate => candidate.id === recommendation.visitId);
    return row ? [{ row, rationale: recommendation.rationale }] : [];
  });
  const recommendations = ai.available
    ? aiRecommendationRows.slice(0, 1)
    : highRisk.slice(0, 1).map(row => ({ row, rationale: null }));
  return (
    <section className="sq-planning-insights">
      <div>
        <strong>{strings.insights}</strong>
        <p>{ai.available ? strings.advisory : strings.withheld}</p>
        {ai.available ? (
          <ul>{ai.summary.slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul>
        ) : (
          <ul>
            <li>{strings.highPriority.replace("{n}", String(highRisk.length))}</li>
            <li>{strings.returned.replace("{n}", String(returned))}</li>
            <li>{strings.expiring.replace("{n}", String(expiring.length))}</li>
          </ul>
        )}
        {!ai.available ? <small>{strings.factsAvailable}</small> : null}
      </div>
      <div>
        <strong>{strings.recommendations}</strong>
        {/* CLASS-CONTRACT.md § Planning — recommendation cards are div.panel,
            each carrying btn-secondary "Plan" + btn-ghost "Review". Confidence
            and generation-time provenance are NOT rendered: no governed value
            for them exists, and __meta already states that honestly. */}
        {recommendations.length ? recommendations.map(({ row, rationale }) => (
          <article className="panel" key={row.id}>
            <div><strong>{row.factoryName ?? row.visitReference ?? strings.regionUnavailable}</strong><span>{strings.priority} · {row.priority}</span></div>
            <p>{rationale ?? `${row.region ?? strings.regionUnavailable} · ${strings.windowEnds} ${new Date(row.windowEnd).toLocaleDateString("en-GB")}`}</p>
            <div><a className="btn btn-secondary" href="/planning/single">{strings.plan}</a><a className="btn btn-ghost" href={`/visits/${row.id}`}>{strings.review}</a></div>
          </article>
        )) : <p className="desc">{strings.noCandidates}</p>}
      </div>
      <div>
        <strong>{strings.quickActions}</strong>
        {/* Creation shortcuts stay here; status and expiry navigation belongs
            to the governed KPI row immediately below this compact rail. */}
        <a className="btn btn-secondary" href="/planning/bulk"><span>{strings.bulkPlanning}</span><span className="badge">→</span></a>
        <a className="btn btn-secondary" href="/planning/single"><span>{strings.singleVisit}</span><span className="badge">→</span></a>
        <a className="btn btn-secondary" href="/planning/immediate"><span>{strings.immediateVisit}</span><span className="badge">→</span></a>
      </div>
    </section>
  );
}
