import type { CriteriaFactory } from "./view";

const STORAGE_KEY = "cd021-bulk-selection";

const ACTIVE_PLANNING_STATUSES = ["draft", "validated", "published", "returned"];

export type RestoredSelection = { kept: ReadonlySet<string>; dropped: number };

export function hasActiveVisit(factory: CriteriaFactory): boolean {
  return (factory.visits ?? []).some(visit =>
    ACTIVE_PLANNING_STATUSES.includes(visit.planning_status) && visit.visit_type === "periodic");
}

export function matchesQuery(factories: readonly CriteriaFactory[], query: string): readonly CriteriaFactory[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return factories;
  return factories.filter(factory =>
    [factory.name, factory.factory_code, factory.cr_number, factory.city, factory.region]
      .some(value => typeof value === "string" && value.toLowerCase().includes(needle)));
}

export function countSelectionBy(
  factories: readonly CriteriaFactory[],
  key: "risk_band" | "region",
): Record<string, number> {
  return factories.reduce<Record<string, number>>((counts, factory) => {
    const label = factory[key] ?? "—";
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
}

function storedIds(): string[] {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function readStoredSelection(availableIds: ReadonlySet<string>): RestoredSelection {
  const ids = storedIds();
  const kept = ids.filter(id => availableIds.has(id));
  return { kept: new Set(kept), dropped: ids.length - kept.length };
}

export function writeStoredSelection(selection: ReadonlySet<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selection]));
  } catch {
    return;
  }
}
