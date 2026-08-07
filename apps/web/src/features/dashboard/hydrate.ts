import type {
  FactoryRef, GeoRow, InspectionRow, ResponseRow, ReviewRow, ViolationRow, VisitRow,
} from "@/app/(app)/dashboard/metrics";
import type { Collected } from "./sources/paginate";

type WithFactoryId = { factory_id?: string | null; factories?: FactoryRef | null };
type WithVisit = { visits?: WithFactoryId | null };
type WithInspection = { inspections?: WithVisit | null };

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
  const resolve = (factoryId: string | null | undefined) =>
    (factoryId && byId.get(factoryId)) || null;

  const attachDirect = (rows: readonly WithFactoryId[]) => {
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

  attachDirect(targets.visits.rows as unknown as WithFactoryId[]);
  attachViaVisit(targets.inspections.rows as unknown as WithVisit[]);
  attachViaVisit(targets.geo.rows as unknown as WithVisit[]);
  attachViaInspection(targets.reviews.rows as unknown as WithInspection[]);
  attachViaInspection(targets.responses.rows as unknown as WithInspection[]);
  attachViaInspection(targets.violations.rows as unknown as WithInspection[]);
}
