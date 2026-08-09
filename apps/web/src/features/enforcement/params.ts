export const ENFORCEMENT_ALIAS_ROUTE = "/admin/violations";
export const ENFORCEMENT_ROUTE = "/enforcement-library";

export const ENFORCEMENT_RANGES = [30, 90, 365] as const;
export type EnforcementRange = (typeof ENFORCEMENT_RANGES)[number];

export type EnforcementScopeInput = Record<string, string | string[] | undefined>;

export type EnforcementScope = {
  readonly routeBase: string;
  readonly search: string;
  readonly status: string;
  readonly range: EnforcementRange | 0;
  readonly region: string;
  readonly violationId: string;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const isRange = (value: number): value is EnforcementRange =>
  (ENFORCEMENT_RANGES as readonly number[]).includes(value);

export function readEnforcementScope(input: EnforcementScopeInput): EnforcementScope {
  const range = Number.parseInt(first(input.range), 10);
  return {
    routeBase: first(input.__shellRoute) === ENFORCEMENT_ALIAS_ROUTE ? ENFORCEMENT_ALIAS_ROUTE : ENFORCEMENT_ROUTE,
    search: first(input.q).trim(),
    status: first(input.status).trim(),
    range: isRange(range) ? range : 0,
    region: first(input.region).trim(),
    violationId: first(input.violation).trim(),
  };
}

function enforcementQuery(scope: EnforcementScope, overrides: Partial<EnforcementScope>): URLSearchParams {
  const next = { ...scope, violationId: "", ...overrides };
  const query = new URLSearchParams();
  if (next.search) query.set("q", next.search);
  if (next.status) query.set("status", next.status);
  if (next.range) query.set("range", String(next.range));
  if (next.region) query.set("region", next.region);
  if (next.violationId) query.set("violation", next.violationId);
  return query;
}

export function enforcementHref(scope: EnforcementScope, overrides: Partial<EnforcementScope>): string {
  const suffix = enforcementQuery(scope, overrides).toString();
  return suffix ? `${scope.routeBase}?${suffix}` : scope.routeBase;
}

/**
 * The export carries the filters but never the open record — a spreadsheet of
 * one row because a drawer happened to be open is not what the button offers.
 */
export function enforcementExportHref(scope: EnforcementScope): string {
  const suffix = enforcementQuery(scope, { violationId: "" }).toString();
  return `${ENFORCEMENT_ROUTE}/export${suffix ? `?${suffix}` : ""}`;
}
