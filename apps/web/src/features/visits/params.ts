import {
  PLANNING_TABS, PLANNING_SORT_KEYS, DEFAULT_PLANNING_SORT,
  type PlanningTab, type PlanningListParams,
} from "@/lib/planning/visit-list";

export const VISIT_STATUS_TABS = ["draft", "published", "returned", "cancelled", "expired"] as const;
export type VisitStatusTab = (typeof VISIT_STATUS_TABS)[number];

export const VISIT_PAGE_SIZE = 100;
export const VISIT_PAGE_MAX = 1000;

export type VisitRouteBase = "/visits" | "/planning/visits";

export type VisitSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const isTab = (value: string): value is PlanningTab => (PLANNING_TABS as readonly string[]).includes(value);

export function parseVisitParams(sp: VisitSearchParams): PlanningListParams {
  const tabRaw = first(sp.tab);
  const sortRaw = first(sp.sort);
  const requested = Number.parseInt(first(sp.limit), 10) || VISIT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requested, VISIT_PAGE_SIZE), VISIT_PAGE_MAX);
  return {
    tab: isTab(tabRaw) ? tabRaw : "all",
    search: first(sp.q).trim(),
    filters: {
      visitType: first(sp.visitType) || undefined,
      executionMode: first(sp.mode) || undefined,
      region: first(sp.region) || undefined,
      city: first(sp.city) || undefined,
      windowFrom: first(sp.windowFrom) || undefined,
      windowTo: first(sp.windowTo) || undefined,
    },
    sort: PLANNING_SORT_KEYS.includes(sortRaw) ? sortRaw : DEFAULT_PLANNING_SORT,
    page: 1,
    pageSize,
    requireReference: false,
  };
}

export function visitHref(base: VisitRouteBase, sp: VisitSearchParams, overrides: Record<string, string>): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    const single = first(value);
    if (single && key !== "wa_route_base") merged[key] = single;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) merged[key] = value; else delete merged[key];
  }
  const query = new URLSearchParams(merged).toString();
  return query ? `${base}?${query}` : base;
}

export function hasActiveVisitFilters(params: PlanningListParams): boolean {
  const { filters } = params;
  return Boolean(
    params.search || params.tab !== "all" || filters.visitType || filters.executionMode
    || filters.region || filters.city || filters.windowFrom || filters.windowTo,
  );
}
