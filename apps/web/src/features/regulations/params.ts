export type RegulationScopeInput = Record<string, string | string[] | undefined>;

export const REGULATION_ALIAS_ROUTE = "/admin/regulations";
export const REGULATION_ROUTE = "/compliance";

export const UNRECORDED_AUTHORITY = "__unrecorded";

export const WORKSPACE_TABS = ["overview", "items", "violations", "penalties", "versions", "audit"] as const;
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export type RegulationScope = {
  readonly routeBase: string;
  readonly search: string;
  readonly authority: string;
  readonly status: string;
  readonly selectedId: string;
  readonly tab: WorkspaceTab;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const isTab = (value: string): value is WorkspaceTab => (WORKSPACE_TABS as readonly string[]).includes(value);

/**
 * `/admin/regulations` is rewritten to `/compliance` by the middleware, which
 * passes the pre-rewrite path in `__shellRoute`. Every link this screen builds
 * has to point back at whichever of the two the officer actually typed, or the
 * first click would silently move them to the other address.
 */
export function readRegulationScope(input: RegulationScopeInput): RegulationScope {
  return {
    routeBase: first(input.__shellRoute) === REGULATION_ALIAS_ROUTE ? REGULATION_ALIAS_ROUTE : REGULATION_ROUTE,
    search: first(input.q).trim(),
    authority: first(input.authority).trim(),
    status: first(input.status).trim(),
    selectedId: first(input.libraryId).trim(),
    tab: isTab(first(input.tab)) ? first(input.tab) as WorkspaceTab : "overview",
  };
}

/**
 * `libraryId` is dropped by every filter change: a workspace left open beside a
 * catalogue that no longer lists it is a lie about what is selected.
 */
export function regulationHref(scope: RegulationScope, overrides: Partial<RegulationScope>): string {
  const next = { ...scope, selectedId: "", tab: "overview" as WorkspaceTab, ...overrides };
  const query = new URLSearchParams();
  if (next.search) query.set("q", next.search);
  if (next.authority) query.set("authority", next.authority);
  if (next.status) query.set("status", next.status);
  if (next.selectedId) query.set("libraryId", next.selectedId);
  if (next.selectedId && next.tab !== "overview") query.set("tab", next.tab);
  const suffix = query.toString();
  return suffix ? `${scope.routeBase}?${suffix}` : scope.routeBase;
}
