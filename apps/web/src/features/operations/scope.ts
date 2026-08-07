export const OPERATIONS_VIEWS = ["map", "performance"] as const;

export type OperationsView = (typeof OPERATIONS_VIEWS)[number];

export type OperationsScope = {
  readonly view: OperationsView;
  readonly region: string;
  readonly city: string;
  readonly timelineVisit: string;
};

export type OperationsScopeInput = {
  view?: string;
  region?: string;
  city?: string;
  timelineVisit?: string;
};

function text(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readOperationsScope(input: OperationsScopeInput): OperationsScope {
  return {
    view: input.view === "performance" ? "performance" : "map",
    region: text(input.region),
    city: text(input.city),
    timelineVisit: text(input.timelineVisit),
  };
}

export function scopeFromSearchParams(params: URLSearchParams): OperationsScope {
  return readOperationsScope({
    view: params.get("view") ?? undefined,
    region: params.get("region") ?? undefined,
    city: params.get("city") ?? undefined,
    timelineVisit: params.get("timelineVisit") ?? undefined,
  });
}

export function scopeToSearchParams(scope: OperationsScope): URLSearchParams {
  const params = new URLSearchParams();
  if (scope.view === "performance") params.set("view", scope.view);
  if (scope.region) params.set("region", scope.region);
  if (scope.city) params.set("city", scope.city);
  if (scope.timelineVisit) params.set("timelineVisit", scope.timelineVisit);
  return params;
}

export function operationsScopeKey(scope: OperationsScope): string {
  return [scope.view, scope.region, scope.city].join("|");
}
