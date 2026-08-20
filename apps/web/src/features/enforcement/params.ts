export const ENFORCEMENT_ALIAS_ROUTE = "/admin/violations";
export const ENFORCEMENT_ROUTE = "/enforcement-library";

export type EnforcementScopeInput = Record<string, string | string[] | undefined>;

export type EnforcementScope = {
  readonly routeBase: string;
  readonly search: string;
  readonly status: string;
  readonly from: string;
  readonly to: string;
  readonly region: string;
  readonly violationId: string;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (value: string) => (ISO_DAY.test(value.trim()) ? value.trim() : "");

export function readEnforcementScope(input: EnforcementScopeInput): EnforcementScope {
  const from = day(first(input.from));
  const to = day(first(input.to));
  const reversed = Boolean(from && to && from > to);
  return {
    routeBase: first(input.__shellRoute) === ENFORCEMENT_ALIAS_ROUTE ? ENFORCEMENT_ALIAS_ROUTE : ENFORCEMENT_ROUTE,
    search: first(input.q).trim(),
    status: first(input.status).trim(),
    from: reversed ? to : from,
    to: reversed ? from : to,
    region: first(input.region).trim(),
    violationId: first(input.violation).trim(),
  };
}

function enforcementQuery(scope: EnforcementScope, overrides: Partial<EnforcementScope>): URLSearchParams {
  const next = { ...scope, violationId: "", ...overrides };
  const query = new URLSearchParams();
  if (next.search) query.set("q", next.search);
  if (next.status) query.set("status", next.status);
  if (next.from) query.set("from", next.from);
  if (next.to) query.set("to", next.to);
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
