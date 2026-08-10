import type {
  FactoryRef, GeoRow, InspectionRow, ResponseRow, ReviewRow, ViolationRow, VisitRow, VisitScopeRef,
} from "@/app/(app)/dashboard/metrics";
import type { Collected } from "./sources/paginate";

type WithVisit = { visits: VisitScopeRef | null };
type WithInspection = { inspections: { visits: VisitScopeRef | null } | null };

type HydrationTargets = {
  visits: Collected<VisitRow>;
  inspections: Collected<InspectionRow>;
  reviews: Collected<ReviewRow>;
  responses: Collected<ResponseRow>;
  violations: Collected<ViolationRow>;
  geo: Collected<GeoRow>;
};

export function hydrateFactories(factories: readonly FactoryRef[], targets: HydrationTargets): void {
  const byId = new Map(factories.map(factory => [factory.id, factory] as const));
  const resolve = (factoryId: string | null) => (factoryId && byId.get(factoryId)) || null;

  const attachDirect = (rows: readonly VisitScopeRef[]) => {
    rows.forEach(row => { row.factories = resolve(row.factory_id); });
  };
  const attachViaVisit = (rows: readonly WithVisit[]) => {
    rows.forEach(row => { if (row.visits) row.visits.factories = resolve(row.visits.factory_id); });
  };
  const attachViaInspection = (rows: readonly WithInspection[]) => {
    rows.forEach(row => {
      if (row.inspections?.visits) {
        row.inspections.visits.factories = resolve(row.inspections.visits.factory_id);
      }
    });
  };

  attachDirect(targets.visits.rows);
  attachViaVisit(targets.inspections.rows);
  attachViaVisit(targets.geo.rows);
  attachViaInspection(targets.reviews.rows);
  attachViaInspection(targets.responses.rows);
  attachViaInspection(targets.violations.rows);
}
