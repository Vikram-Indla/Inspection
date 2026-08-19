export const RISK_BANDS = ["low", "medium", "high"] as const;
export type RiskBand = (typeof RISK_BANDS)[number];

export const PAGE_SIZE = 50;

export type EstablishmentSearchParams = {
  q?: string;
  status?: string;
  risk?: string;
  region?: string;
  city?: string;
  page?: string;
  filter?: string;
};

export type EstablishmentQuery = {
  q: string;
  status: "licensed" | "unlicensed";
  risk: string;
  region: string;
  city: string;
  page: number;
  filterOpen: boolean;
};

export function normalizeSearch(value: string | undefined): string {
  return (value ?? "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function isRisk(value: string | undefined): boolean {
  return (RISK_BANDS as readonly string[]).includes(value ?? "");
}

export function parseParams(
  params: EstablishmentSearchParams,
  facets: { regions: readonly string[]; cities: readonly string[] },
): EstablishmentQuery {
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  return {
    q: normalizeSearch(params.q),
    status: params.status === "unlicensed" ? "unlicensed" : "licensed",
    risk: isRisk(params.risk) ? (params.risk as string) : "",
    region: facets.regions.includes(params.region ?? "") ? (params.region as string) : "",
    city: facets.cities.includes(params.city ?? "") ? (params.city as string) : "",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    filterOpen: params.filter === "1",
  };
}

export function buildHref(
  base: EstablishmentQuery,
  overrides: Partial<{ status: string; page: number; filter: string; q: string }> = {},
): string {
  const next = { status: base.status, page: 1, filter: "", q: base.q, ...overrides };
  const search = new URLSearchParams();
  if (next.q) search.set("q", next.q);
  if (next.status) search.set("status", next.status);
  if (base.risk) search.set("risk", base.risk);
  if (base.region) search.set("region", base.region);
  if (base.city) search.set("city", base.city);
  if (next.page > 1) search.set("page", String(next.page));
  if (next.filter) search.set("filter", next.filter);
  const query = search.toString();
  return `/field/establishments${query ? `?${query}` : ""}`;
}
