import { redirect } from "next/navigation";
import { getLocale, type Locale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation, BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { readPages } from "@/lib/postgrest/read";
import { CLEAN_FACTORY_CODES, isCleanFactory } from "../factory-codes";
import { loadAuthorizedScope } from "../sources/profile";
import { buildGeographyFilter } from "./geography";
import { liveFactoryRow, liveGeoRow, liveVisitRow } from "./shapes";
import type { LiveFactoryRow, LiveGeoRow, LiveVisitRow } from "./types";

const FACTORY_COLUMNS =
  "id, name, region, city, official_lat, official_lng, source, is_temporary, factory_code";
const VISIT_COLUMNS =
  "id, operational_state, planning_status, window_start, window_end, factory_id, notes, factories(id, name, region, city, official_lat, official_lng, source, is_temporary, factory_code), assignments(profiles(full_name, email))";
const GEO_COLUMNS =
  "id, visit_id, observed_lat, observed_lng, occurred_at, integration_mode, kind";
const ACTIVE_STATES = ["on_the_way", "arrived", "executing"];

export type LiveOperationsData = {
  locale: Locale;
  observedAt: Date;
  factories: LiveFactoryRow[];
  visits: LiveVisitRow[];
  geoEvents: LiveGeoRow[];
  visitReadError: boolean;
  positionReadError: boolean;
  factoryReadError: boolean;
  excludedRecordCount: number;
  outOfScopeRecordCount: number;
};

export type LiveOperationsResult =
  | { kind: "denied" }
  | { kind: "ready"; data: LiveOperationsData };

function isVerificationRecord(factory: LiveVisitRow["factories"], notes: string | null): boolean {
  return factory?.source === "verification_fixture"
    || isTestFixtureEstablishment(factory)
    || /\b(?:verification|test) fixture\b/i.test(notes ?? "");
}

export async function loadLiveOperations(): Promise<LiveOperationsResult> {
  const locale = await getLocale();
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) redirect("/login");
  const { data: routeRoles, error: routeRoleError } = await sb
    .from("user_roles")
    .select("role_key")
    .eq("user_id", user.id);
  const routeRoleKeys = (routeRoles ?? []).map(row => row.role_key);
  const operationsDestination = routeRoleError
    ? null
    : buildShellNavigation(routeRoleKeys)
      .flatMap(group => group.items)
      .find(item => item.href === "/operations");
  const hasOperationalRole = routeRoleKeys.some(role => BUSINESS_ROLE_KEYS.includes(role));
  const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;
  if (!mayViewOperations) return { kind: "denied" };

  const authorizedScope = await loadAuthorizedScope(sb, user.id);
  const inAuthorizedGeography = buildGeographyFilter(authorizedScope);

  const observedAt = new Date();
  const [factoriesRead, visitsRead] = await Promise.all([
    readPages((from, to) => sb.from("factories")
      .select(FACTORY_COLUMNS)
      .in("factory_code", [...CLEAN_FACTORY_CODES])
      .not("official_lat", "is", null)
      .order("id", { ascending: true })
      .range(from, to), liveFactoryRow, "operations.live.factories"),
    readPages((from, to) => sb.from("visits")
      .select(VISIT_COLUMNS)
      .in("operational_state", ACTIVE_STATES)
      .order("id", { ascending: true })
      .range(from, to), liveVisitRow, "operations.live.visits"),
  ]);

  const integrityFilteredVisits = visitsRead.rows.filter(visit => {
    if (!isCleanFactory(visit.factories) || isVerificationRecord(visit.factories, visit.notes)) return false;
    const startsAt = visit.window_start ? Date.parse(visit.window_start) : NaN;
    return Number.isNaN(startsAt) || startsAt <= observedAt.getTime();
  });
  const visits = integrityFilteredVisits.filter(visit =>
    inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null));
  const outOfScopeRecordCount = integrityFilteredVisits.length - visits.length;

  const activeVisitIds = visits.map(visit => visit.id);
  const geoRead = activeVisitIds.length > 0
    ? await readPages((from, to) => sb.from("geo_events")
      .select(GEO_COLUMNS)
      .in("visit_id", activeVisitIds)
      .or("integration_mode.is.null,integration_mode.eq.production")
      .lte("occurred_at", observedAt.toISOString())
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to), liveGeoRow, "operations.live.geo_events")
    : { rows: [] as LiveGeoRow[], failed: false, reason: null };

  const activeFactoryIds = new Set(visits.map(visit => visit.factory_id).filter(Boolean));
  const factories = factoriesRead.rows.filter(factory =>
    isCleanFactory(factory)
    && activeFactoryIds.has(factory.id)
    && inAuthorizedGeography(factory.region, factory.city));

  return {
    kind: "ready",
    data: {
      locale,
      observedAt,
      factories,
      visits,
      geoEvents: geoRead.rows,
      visitReadError: visitsRead.failed,
      positionReadError: geoRead.failed,
      factoryReadError: factoriesRead.failed,
      excludedRecordCount: visitsRead.rows.length - integrityFilteredVisits.length,
      outOfScopeRecordCount,
    },
  };
}
