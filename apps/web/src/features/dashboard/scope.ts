import { parseDateScope, riyadhTodayScope, type DateScope, type SelectedScope } from "@/app/(app)/dashboard/metrics";

export const DASHBOARD_VIEWS = ["strategic", "operational"] as const;
export const DASHBOARD_LENSES = ["region", "city", "sector", "authority"] as const;

export type DashboardView = (typeof DASHBOARD_VIEWS)[number];
export type DashboardLens = (typeof DASHBOARD_LENSES)[number];

export type DashboardScope = {
  readonly view: DashboardView;
  readonly lens: DashboardLens;
  readonly query: string;
  readonly region: string;
  readonly scope: SelectedScope & { fromDate: string | null; toDate: string | null };
  readonly today: DateScope;
  readonly nowMs: number;
  readonly requestedView: string | null;
  readonly viewExplicit: boolean;
};

export type DashboardScopeInput = {
  view?: string;
  group?: string;
  q?: string;
  from?: string;
  to?: string;
  region?: string;
};

const MAX_QUERY_LENGTH = 120;

function asView(value: string | undefined): DashboardView | null {
  return DASHBOARD_VIEWS.find(view => view === value) ?? null;
}

function asLens(value: string | undefined): DashboardLens {
  return DASHBOARD_LENSES.find(lens => lens === value) ?? "region";
}

export function readDashboardScope(input: DashboardScopeInput, nowMs: number): DashboardScope {
  const requested = typeof input.view === "string" ? input.view : null;
  return {
    view: asView(input.view) ?? "strategic",
    lens: asLens(input.group),
    query: typeof input.q === "string" ? input.q.slice(0, MAX_QUERY_LENGTH) : "",
    region: typeof input.region === "string" ? input.region : "",
    scope: parseDateScope(input.from, input.to, nowMs),
    today: riyadhTodayScope(nowMs),
    nowMs,
    requestedView: requested && !asView(requested) ? requested : null,
    viewExplicit: asView(input.view) !== null,
  };
}

export function scopeFromSearchParams(params: URLSearchParams, nowMs: number): DashboardScope {
  return readDashboardScope({
    view: params.get("view") ?? undefined,
    group: params.get("group") ?? undefined,
    q: params.get("q") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    region: params.get("region") ?? undefined,
  }, nowMs);
}

export function scopeToSearchParams(scope: DashboardScope): URLSearchParams {
  // An absent bound is omitted, not written as an empty value: the URL is the
  // record of what the reader chose, and `from=` would claim a choice was made.
  return new URLSearchParams([
    ["view", scope.view],
    ["group", scope.lens],
    ["q", scope.query],
    ...(scope.scope.fromDate ? [["from", scope.scope.fromDate]] : []),
    ...(scope.scope.toDate ? [["to", scope.scope.toDate]] : []),
    ["region", scope.region],
  ]);
}

export function withView(scope: DashboardScope, view: DashboardView): DashboardScope {
  return scope.view === view ? scope : { ...scope, view };
}

export function effectiveView(scope: DashboardScope, isAdmin: boolean): DashboardView {
  return scope.viewExplicit || isAdmin ? scope.view : "operational";
}

export function scopeCacheKey(scope: DashboardScope): string {
  return [scope.view, scope.scope.fromDate, scope.scope.toDate, scope.region].join("|");
}
