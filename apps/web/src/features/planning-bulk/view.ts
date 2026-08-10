import type { FactoryRow, InspectionRow, ViolationRow } from "./shapes";

export type CriteriaFactory = FactoryRow & {
  readonly license_type: string | null;
  readonly license_status: string | null;
  readonly plant_state: string | null;
  readonly investment_type: string | null;
  readonly investment_size: number | null;
  readonly previous_violation_count: number;
  readonly previous_outcome: string | null;
  readonly last_inspection_date: string | null;
};

type LastInspection = { readonly date: string | null; readonly outcome: string | null };

function countByFactory(violations: readonly ViolationRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of violations) {
    if (row.factoryId) counts.set(row.factoryId, (counts.get(row.factoryId) ?? 0) + 1);
  }
  return counts;
}

function latestByFactory(inspections: readonly InspectionRow[]): Map<string, LastInspection> {
  const latest = new Map<string, LastInspection>();
  for (const row of inspections) {
    if (!row.factoryId || latest.has(row.factoryId)) continue;
    const outcome = row.decisions.find((decision): decision is string =>
      typeof decision === "string" && decision.trim() !== "") ?? null;
    latest.set(row.factoryId, { date: row.submitted_at, outcome });
  }
  return latest;
}

export function toCriteriaFactories(
  factories: readonly FactoryRow[],
  violations: readonly ViolationRow[],
  inspections: readonly InspectionRow[],
): CriteriaFactory[] {
  const violationCounts = countByFactory(violations);
  const lastInspections = latestByFactory(inspections);
  return factories.map(factory => {
    const licence = factory.industrial_licenses?.[0] ?? null;
    const last = lastInspections.get(factory.id);
    return {
      ...factory,
      license_type: licence?.license_type ?? null,
      license_status: licence?.status ?? null,
      plant_state: licence?.stage ?? null,
      investment_type: licence?.investment_type ?? null,
      investment_size: licence?.investment_size ?? null,
      previous_violation_count: violationCounts.get(factory.id) ?? 0,
      previous_outcome: last?.outcome ?? null,
      last_inspection_date: last?.date ?? null,
    };
  });
}

export function distinctValues(
  factories: readonly CriteriaFactory[],
  key: keyof CriteriaFactory,
): string[] {
  return [...new Set(factories
    .map(factory => factory[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0))].sort();
}

export function citiesByRegion(factories: readonly CriteriaFactory[]): Record<string, string[]> {
  const byRegion = new Map<string, Set<string>>();
  for (const factory of factories) {
    const region = factory.region?.trim();
    const city = factory.city?.trim();
    if (!region || !city) continue;
    const cities = byRegion.get(region) ?? new Set<string>();
    cities.add(city);
    byRegion.set(region, cities);
  }
  return Object.fromEntries([...byRegion].map(([region, cities]) => [region, [...cities].sort()]));
}

export function countBy(
  factories: readonly CriteriaFactory[],
  key: keyof CriteriaFactory,
  unknownLabel: string,
): Record<string, number> {
  return factories.reduce<Record<string, number>>((counts, factory) => {
    const value = factory[key];
    const label = typeof value === "string" && value.trim() ? value : unknownLabel;
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
}
