import type { EnforcementFilters } from "./types";

export type EnforcementSearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : "";

export function readEnforcementFilters(params: EnforcementSearchParams): EnforcementFilters {
  return {
    q: one(params.q).trim(),
    status: one(params.status),
    range: Number(one(params.range) || 0),
    region: one(params.region),
    violation: one(params.violation),
  };
}

export function enforcementQuery(filters: EnforcementFilters): URLSearchParams {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);
  if (filters.range) query.set("range", String(filters.range));
  if (filters.region) query.set("region", filters.region);
  return query;
}

export function enforcementListHref(filters: EnforcementFilters): string {
  const query = enforcementQuery(filters);
  return query.size ? `/enforcement-library?${query}` : "/enforcement-library";
}

export function enforcementDetailHref(filters: EnforcementFilters, id: string): string {
  const query = enforcementQuery(filters);
  query.set("violation", id);
  return `/enforcement-library?${query}`;
}

export function enforcementExportHref(filters: EnforcementFilters): string {
  return `/enforcement-library/export?${enforcementQuery(filters)}`;
}
