import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import LiveOps, { type LiveOpsStrings } from "./LiveOps";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation } from "@/lib/shell-navigation";
import { redirect } from "next/navigation";

// SCR-WEB-500 / WA-DES-034-C3 — read-only national operations observation.
// This view never claims GPS telemetry, route navigation, ETA or risk policy.

type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
};
type VisitRow = {
  id: string; operational_state: string; planning_status: string;
  window_start: string | null; window_end: string | null; factory_id: string | null;
  planner_lat: number | null; planner_lng: number | null;
  factories: { id: string; name: string; region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};
// M3-MAP-PROVENANCE-001 — the one bounded, non-N+1 geo_events read for this
// page: a single call scoped to the full monitored visit-id set, never a
// per-visit loop.
type GeoEventRow = {
  id: string; visit_id: string; kind: string;
  observed_lat: number | null; observed_lng: number | null;
  accuracy_m: number | null; occurred_at: string;
};
const POSITION_KINDS = ["telemetry", "arrival", "checkin"] as const;

type PositionResolution = {
  lat: number | null; lng: number | null; provenance: "recorded" | "projected" | "unavailable";
  observedAt?: string; accuracyM?: number; scheduledAt?: string; coordinateSource?: "planner" | "factory";
};

/** Tier 1 (recorded) → tier 2 (projected from assignment/schedule) → tier 3
 * (unavailable). Never drops the inspector entity — caller keeps lat/lng null
 * and provenance "unavailable" instead of filtering it out. */
function resolveLivePosition(
  v: VisitRow,
  f: { official_lat: number | null; official_lng: number | null },
  recorded: GeoEventRow | undefined,
): PositionResolution {
  if (recorded && recorded.observed_lat != null && recorded.observed_lng != null) {
    return {
      lat: Number(recorded.observed_lat), lng: Number(recorded.observed_lng), provenance: "recorded",
      observedAt: recorded.occurred_at, accuracyM: recorded.accuracy_m ?? undefined,
    };
  }
  const hasAssignment = (v.assignments?.length ?? 0) > 0;
  const plannerLat = v.planner_lat, plannerLng = v.planner_lng;
  const coordLat = plannerLat ?? f.official_lat;
  const coordLng = plannerLng ?? f.official_lng;
  if (hasAssignment && v.window_start && coordLat != null && coordLng != null) {
    return {
      lat: Number(coordLat), lng: Number(coordLng), provenance: "projected",
      scheduledAt: v.window_start,
      coordinateSource: plannerLat != null && plannerLng != null ? "planner" : "factory",
    };
  }
  return { lat: null, lng: null, provenance: "unavailable" };
}

export default async function LiveOperations({ searchParams }: {
  searchParams: Promise<{ wallboard?: string }>;
}) {
  const { t, locale } = await useT();
  const wallboard = (await searchParams).wallboard === "1";
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
  const mayViewOperations = operationsDestination?.enabled === true;
  if (!mayViewOperations) {
    return (
      <Shell current="/operations/live" title={t("ops.live.title", "Live Operations — Saudi Arabia")}>
        <EmptyState
          glyph="⛨"
          title={t("ops.unauthorized.title", "Operations access required")}
          body={t("ops.unauthorized.body", "No operational data has been loaded because this destination is not enabled in your assigned navigation.")}
        >
          <a className="sq-btn sq-btn--secondary" href="/launch">{t("ops.unauthorized.return", "Return to my workspace")}</a>
        </EmptyState>
      </Shell>
    );
  }

  const observedAt = new Date();
  const [factoriesRes, visitsRes] = await Promise.all([
    // M3-MAP-PROVENANCE-001 — the prior official-coordinate WHERE-clause
    // exclusion is removed: a factory without an official coordinate on file
    // is still a real, counted record. Only the map-pin step (LiveMapInner)
    // skips a coordinate-less factory; this list-level read never drops it.
    collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng")
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, planner_lat, planner_lng, factories(id, name, region, city, official_lat, official_lng), assignments(profiles(full_name))")
      .in("operational_state", ["on_the_way", "arrived", "executing"])
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
  ]);

  if (factoriesRes.error) console.error(`[operations live] factories read failed: ${factoriesRes.error.message}`);
  if (visitsRes.error) console.error(`[operations live] visits read failed: ${visitsRes.error.message}`);

  const factoryRows = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const visitRows = (visitsRes.data ?? []) as unknown as VisitRow[];

  // M3-MAP-PROVENANCE-001 — the one bounded, non-N+1 geo_events read: a
  // single call scoped to the full monitored visit-id set (never a per-visit
  // loop), restricted to permitted position kinds at the query level since
  // this page has no pre-existing unfiltered consumer of geo_events to
  // protect (unlike /operations's shared geoRes/latestGeofence).
  const monitoredVisitIds = visitRows.map(v => v.id);
  const geoEventsRes = monitoredVisitIds.length > 0
    ? await sb.from("geo_events")
        .select("id, visit_id, kind, observed_lat, observed_lng, accuracy_m, occurred_at")
        .in("visit_id", monitoredVisitIds)
        .in("kind", POSITION_KINDS as unknown as string[])
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
    : { data: [] as GeoEventRow[], error: null };
  if (geoEventsRes.error) console.error(`[operations live] geo_events read failed: ${geoEventsRes.error.message}`);
  const geoEventRows = (geoEventsRes.data ?? []) as unknown as GeoEventRow[];
  const latestPositionByVisit = new Map<string, GeoEventRow>();
  for (const g of geoEventRows) {
    if (!latestPositionByVisit.has(g.visit_id)) latestPositionByVisit.set(g.visit_id, g);
  }

  // A geo_events read failure must surface as its own error state, never be
  // silently reinterpreted as "confirmed no GPS" (every entity would
  // otherwise falsely downgrade to tier 2/3).
  const hasReadError = Boolean(factoriesRes.error || visitsRes.error || geoEventsRes.error);
  const factories: LiveFactory[] = factoryRows.map(f => ({
    id: `f:${f.id}`, rawId: f.id, name: f.name, region: f.region, city: f.city,
    lat: f.official_lat != null ? Number(f.official_lat) : null,
    lng: f.official_lng != null ? Number(f.official_lng) : null,
  }));

  const byRegion = new Map<string, LiveFactory[]>();
  for (const f of factories) {
    if (!f.region || f.lat == null || f.lng == null) continue;
    (byRegion.get(f.region) ?? byRegion.set(f.region, []).get(f.region)!).push(f);
  }
  const regions: LiveRegion[] = [...byRegion.entries()].map(([name, fs]) => {
    const lat = fs.reduce((a, f) => a + (f.lat as number), 0) / fs.length;
    const lng = fs.reduce((a, f) => a + (f.lng as number), 0) / fs.length;
    return {
      id: name, name, lat, lng,
    };
  });

  const enumLabel = (v: string) => t(`enum.${v}`, v.replace(/_/g, " "));
  const inspectors: LiveInspector[] = [];
  for (const v of visitRows) {
    const f = v.factories;
    const name = v.assignments?.[0]?.profiles?.full_name;
    if (!f || !name) continue;
    const position = resolveLivePosition(v, f, latestPositionByVisit.get(v.id));
    inspectors.push({
      id: `i:${v.id}`, visitId: v.id, inspector: name,
      factoryId: `f:${f.id}`, factoryName: f.name,
      region: f.region ?? f.city ?? t("ops.live.regionUnknown", "Region not recorded"),
      state: v.operational_state as LiveInspector["state"],
      stateLabel: enumLabel(v.operational_state),
      lat: position.lat, lng: position.lng,
      provenance: position.provenance,
      observedAt: position.observedAt, accuracyM: position.accuracyM,
      scheduledAt: position.scheduledAt, coordinateSource: position.coordinateSource,
      sinceLabel: v.window_start
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
            dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
          }).format(new Date(v.window_start))
        : t("ops.live.sinceUnknown", "Not recorded"),
    });
  }

  const strings: LiveOpsStrings = {
    loading: t("ops.live.loading", "Bringing the national picture online…"),
    enRoute: t("ops.live.enRoute", "Inspectors en route"),
    executing: t("ops.live.executing", "On site now"),
    completed: t("ops.live.factories", "Factories monitored"),
    inspector: t("ops.live.inspectorLegend", "Operational position marker"),
    positionLegend: t("ops.live.positionLegend", "Positions are last-recorded GPS, schedule-projected, or unavailable — never a live feed."),
    provenanceRecorded: t("ops.map.provenance.recorded", "Last recorded GPS — not guaranteed live"),
    provenanceProjected: t("ops.map.provenance.projected", "Projected from assignment/schedule — not live GPS"),
    provenanceUnavailable: t("ops.map.provenance.unavailable", "Location unavailable — no recorded GPS and no assignment/factory coordinate available"),
    freshnessPolicy: t("ops.live.freshnessPolicy", "Staleness cadence not yet configured — showing last-observed time only."),
    lastObserved: t("ops.live.lastObserved", "Last observed"),
    activeList: t("ops.live.activeList", "Active inspectors"),
    since: t("ops.live.since", "Since"),
    noScope: t("ops.live.noScope", "No active visits in your scope right now"),
    noPositions: t("ops.live.noPositions", "No inspectors currently active"),
    loadError: t("ops.live.loadError", "Live map could not load"),
    retry: t("common.retry", "Retry"),
    providerFailed: t("ops.live.providerFailed", "Live map unavailable — basemap provider failed."),
    mapUnavailable: t("ops.live.map.unavailable", "Live map unavailable — basemap provider failed."),
    mapboxNotConfigured: t("ops.live.map.notConfigured", "Live map unavailable — basemap provider failed."),
    mapAriaLabel: t("ops.live.map.ariaLabel", "Mapbox operations map"),
    wallboardExit: t("ops.live.wallboardExit", "Exit wallboard"),
    selectedInspector: t("ops.live.selectedInspector", "Inspector details"),
    inspectorName: t("ops.live.inspectorName", "Inspector"),
    factoryName: t("ops.live.factoryName", "Factory"),
    regionName: t("ops.live.regionName", "Region"),
    operationalState: t("ops.live.operationalState", "Operational state"),
    visitReference: t("ops.live.visitReference", "Visit reference"),
    closeDetails: t("ops.live.closeDetails", "Close inspector details"),
  };

  const title = t("ops.live.title", "Live Operations — Saudi Arabia");
  return (
    <Shell current="/operations/live" title={title}>
      <LiveOps
        factories={factories}
        regions={regions}
        inspectors={inspectors}
        strings={strings}
        observedAt={observedAt.toISOString()}
        wallboard={wallboard}
        hasReadError={hasReadError}
      />
    </Shell>
  );
}
