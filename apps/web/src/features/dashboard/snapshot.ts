import type { DashboardPersona } from "@/lib/dashboard-role";
import type {
  AuditRow, ChecklistItemRow, FactoryRef, GeoRow, InspectionRow,
  ResponseRow, ReviewRow, ViolationRow, VisitRow,
} from "@/app/(app)/dashboard/metrics";
import type { DashboardScope } from "./scope";
import { emptyCollection } from "./sources/paginate";
import { loadInspections, loadReviews, loadVisits } from "./sources/inspection-flow";
import { loadChecklistItems, loadResponses } from "./sources/compliance";
import { loadViolations } from "./sources/violations";
import { loadGeoEvents } from "./sources/geo";
import { loadFactories } from "./sources/factories";
import { loadLatestAudit } from "./sources/audit";
import { emptySlaSettings, loadSlaSettings } from "./sources/settings";
import type { DashboardClient, SourceBounds } from "./sources/client-type";
import { hydrateFactories } from "./hydrate";
import { loadDashboardPolicy } from "./policy";
import type { DashboardSnapshot, SourceKey } from "./types";

function boundsFor(scope: DashboardScope, strategic: boolean): SourceBounds {
  // An unbounded window cannot be narrowed by a lower bound, and it has no
  // previous equal window to reach back for either — so the read is unbounded
  // too rather than being silently clipped to today.
  const { fromMs, toMs } = scope.scope;
  if (fromMs === null || toMs === null) {
    return { boundIso: new Date(scope.today.fromMs).toISOString(), bounded: false };
  }
  const previousFromMs = fromMs - (toMs - fromMs + 1);
  return {
    boundIso: new Date(Math.min(previousFromMs, scope.today.fromMs)).toISOString(),
    bounded: strategic,
  };
}

export async function readDashboardSnapshot(
  sb: DashboardClient,
  scope: DashboardScope,
  persona: DashboardPersona,
): Promise<DashboardSnapshot> {
  const strategic = scope.view === "strategic";
  const bounds = boundsFor(scope, strategic);

  const [visits, inspections, reviews, responses, checklistItems, violations, geo, factories, sla, policy] =
    await Promise.all([
      loadVisits(sb, bounds),
      loadInspections(sb, bounds),
      loadReviews(sb, bounds),
      strategic ? loadResponses(sb, bounds) : emptyCollection<ResponseRow>(),
      strategic ? loadChecklistItems(sb) : emptyCollection<ChecklistItemRow>(),
      strategic ? loadViolations(sb, bounds) : emptyCollection<ViolationRow>(),
      !strategic || persona === "supervisor" ? loadGeoEvents(sb, bounds) : emptyCollection<GeoRow>(),
      loadFactories(sb),
      strategic ? Promise.resolve(emptySlaSettings()) : loadSlaSettings(sb),
      loadDashboardPolicy(sb),
    ]);

  hydrateFactories(factories.rows, { visits, inspections, reviews, responses, violations, geo });

  const audit = !strategic || persona === "admin"
    ? await loadLatestAudit(
        sb,
        [
          ...visits.rows.map(row => row.id),
          ...inspections.rows.map(row => row.id),
          ...reviews.rows.map(row => row.id),
          ...violations.rows.map(row => row.id),
        ],
        scope.scope.fromMs === null ? null : new Date(scope.scope.fromMs).toISOString(),
        scope.scope.toMs === null ? null : new Date(scope.scope.toMs).toISOString(),
      )
    : { rows: [] as AuditRow[], failed: false };

  const failedSources: SourceKey[] = ([
    visits.failed && "visits",
    inspections.failed && "inspections",
    reviews.failed && "reviews",
    responses.failed && "responses",
    checklistItems.failed && "checklistItems",
    violations.failed && "violations",
    geo.failed && "geo",
    factories.failed && "factories",
    audit.failed && "audit",
    sla.failed && "sla",
  ] as (SourceKey | false)[]).filter((key): key is SourceKey => Boolean(key));

  return {
    visits: visits.rows as VisitRow[],
    inspections: inspections.rows as InspectionRow[],
    reviews: reviews.rows as ReviewRow[],
    responses: responses.rows as ResponseRow[],
    checklistItems: checklistItems.rows as ChecklistItemRow[],
    violations: violations.rows as ViolationRow[],
    geo: geo.rows as GeoRow[],
    factories: factories.rows as FactoryRef[],
    audit: audit.rows,
    sla: sla.sla,
    policy: policy.policy,
    gates: policy.gates,
    failedSources,
  };
}
