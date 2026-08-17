import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  buildHref,
  PAGE_SIZE,
  parseParams,
  type EstablishmentQuery,
  type EstablishmentSearchParams,
} from "./params";
import { toCardRows, type EstablishmentCardRow } from "./rows";

const LIST_COLUMNS =
  "id, factory_code, name, cr_number, license_number, region, city, risk_band, activity_class, source, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number)";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

export type EstablishmentsData = {
  query: EstablishmentQuery;
  regions: readonly string[];
  cities: readonly string[];
  rows: readonly EstablishmentCardRow[];
  shown: number;
  total: number;
  licensedCount: number;
  unlicensedCount: number;
  pageCount: number;
  failed: boolean;
  showEmptyHint: boolean;
  hrefFor: (overrides?: Partial<{ status: string; page: number; filter: string; q: string }>) => string;
};

type FactoryQuery<T> = { or(fragment: string): T };

function excludeFixtures<T extends FactoryQuery<T>>(query: T): T {
  return query
    .or("name.not.imatch.[0-9]{13}")
    .or("factory_code.is.null,factory_code.not.imatch.[0-9]{13}");
}

export async function loadEstablishments(
  rawParams: EstablishmentSearchParams,
): Promise<EstablishmentsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const { data: facetData } = await sb.from("factories")
    .select("region, city")
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .order("region");
  const regions = Array.from(
    new Set((facetData ?? []).map(row => row.region).filter((value): value is string => Boolean(value))),
  ).sort();
  const cities = Array.from(
    new Set((facetData ?? []).map(row => row.city).filter((value): value is string => Boolean(value))),
  ).sort();

  const query = parseParams(rawParams, { regions, cities });
  const first = (query.page - 1) * PAGE_SIZE;
  const searchOr = `name.ilike.%${query.q}%,factory_code.ilike.%${query.q}%,cr_number.ilike.%${query.q}%,license_number.ilike.%${query.q}%`;

  let listQuery = sb.from("factories")
    .select(LIST_COLUMNS, { count: "exact" })
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .eq("is_temporary", query.status === "unlicensed")
    .order("name")
    .range(first, first + PAGE_SIZE - 1);
  if (query.q) listQuery = listQuery.or(searchOr);
  if (query.risk) listQuery = listQuery.eq("risk_band", query.risk);
  if (query.region) listQuery = listQuery.eq("region", query.region);
  if (query.city) listQuery = listQuery.eq("city", query.city);
  listQuery = excludeFixtures(listQuery);

  const countFor = (temporary: boolean) => {
    let countQuery = sb.from("factories").select("id", { count: "exact", head: true })
      .in("factory_code", [...CLEAN_FACTORY_CODES])
      .eq("is_temporary", temporary);
    if (query.q) countQuery = countQuery.or(searchOr);
    if (query.risk) countQuery = countQuery.eq("risk_band", query.risk);
    if (query.region) countQuery = countQuery.eq("region", query.region);
    if (query.city) countQuery = countQuery.eq("city", query.city);
    return excludeFixtures(countQuery);
  };

  const [listRes, licensedRes, unlicensedRes] = await Promise.all([
    listQuery,
    countFor(false),
    countFor(true),
  ]);
  if (listRes.error) logProviderError("field establishments load", listRes.error);

  const rows = toCardRows(listRes.data);
  const total = listRes.count ?? rows.length;
  const failed = Boolean(listRes.error);

  return {
    query,
    regions,
    cities,
    rows,
    shown: rows.length,
    total,
    licensedCount: licensedRes.count ?? 0,
    unlicensedCount: unlicensedRes.count ?? 0,
    pageCount: Math.max(1, Math.ceil((listRes.count ?? 0) / PAGE_SIZE)),
    failed,
    showEmptyHint: query.status === "licensed" && Boolean(query.q) && !failed && rows.length === 0,
    hrefFor: overrides => buildHref(query, overrides),
  };
}
