import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { resolveRegionId, type KsaRegionCollection } from "@/lib/ksa-regions";
import ksaRegionsJson from "../../../../public/geo/sau-regions.geo.json";
import type { LiveFactory, LiveInspector, LiveRegion } from "@/app/(app)/operations/live/types";
import type { LiveOperationsData } from "./queries";
import type { LiveGeoRow, LiveVisitRow } from "./types";

const TEST_ACCOUNT_EMAILS = new Set([
  "planner@mim.gov.sa",
  "inspector@mim.gov.sa",
  "reviewer@mim.gov.sa",
  "admin@mim.gov.sa",
  "ops@mim.gov.sa",
]);

const KSA_REGION_NAMES = new Map(
  (ksaRegionsJson as KsaRegionCollection).features.map(feature => [feature.properties.id, feature.properties]),
);

const ACTIVE_STATE_KEY: Record<string, keyof ReturnType<typeof stateLabels>> = {
  on_the_way: "onTheWay",
  arrived: "arrived",
  executing: "executing",
};

function stateLabels(locale: Locale) {
  return getMessages(locale).operations.live.state;
}

function isActiveState(value: string): value is LiveInspector["state"] {
  return value === "on_the_way" || value === "arrived" || value === "executing";
}

function sourceInspectorName(
  profile: { full_name: string; email: string | null } | null | undefined,
  locale: Locale,
  fallback: string,
): string {
  if (!profile?.email || !TEST_ACCOUNT_EMAILS.has(profile.email.toLowerCase())) return fallback;
  const name = profile.full_name.trim();
  if (!name) return fallback;
  const hasArabic = /[؀-ۿ]/.test(name);
  return (locale === "ar") === hasArabic ? name : fallback;
}

function validObservedPosition(position: LiveGeoRow, snapshotMs: number): boolean {
  const occurredAt = Date.parse(position.occurred_at);
  const lat = Number(position.observed_lat);
  const lng = Number(position.observed_lng);
  return Number.isFinite(occurredAt)
    && occurredAt <= snapshotMs
    && Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180;
}

function localizedRegionName(sourceName: string, locale: Locale): string {
  const regionId = resolveRegionId(sourceName);
  const region = regionId ? KSA_REGION_NAMES.get(regionId) : null;
  if (!region) return sourceName;
  return locale === "ar" ? region.name_ar : region.name_en;
}

export type LiveOperationsView = {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  positionObservedAt: string | null;
};

export function buildLiveOperationsView(data: LiveOperationsData): LiveOperationsView {
  const { locale, observedAt, visits, geoEvents } = data;
  const messages = getMessages(locale).operations.live;
  const snapshotMs = observedAt.getTime();
  const latestPositionByVisit = new Map<string, LiveGeoRow>();
  const rejectedPositionVisitIds = new Set<string>();
  for (const position of geoEvents) {
    if (!validObservedPosition(position, snapshotMs)) {
      rejectedPositionVisitIds.add(position.visit_id);
    } else if (!latestPositionByVisit.has(position.visit_id)) {
      latestPositionByVisit.set(position.visit_id, position);
    }
  }
  const positionObservedAt = [...latestPositionByVisit.values()]
    .map(position => position.occurred_at)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

  const factories: LiveFactory[] = data.factories.map(factory => ({
    id: `f:${factory.id}`,
    rawId: factory.id,
    name: factory.name,
    region: factory.region,
    city: factory.city,
    lat: Number(factory.official_lat),
    lng: Number(factory.official_lng),
  }));

  const byRegion = new Map<string, LiveFactory[]>();
  for (const factory of factories) {
    if (!factory.region) continue;
    byRegion.set(factory.region, [...(byRegion.get(factory.region) ?? []), factory]);
  }
  const regions: LiveRegion[] = [...byRegion.entries()].map(([name, group]) => ({
    id: name,
    name,
    lat: group.reduce((total, factory) => total + factory.lat, 0) / group.length,
    lng: group.reduce((total, factory) => total + factory.lng, 0) / group.length,
  }));

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  });
  const positionSourceLabel = (kind: string): string => {
    const known: Record<string, string> = messages.positionSource;
    return known[kind] ?? getMessages(locale).common.state.unavailable;
  };

  const inspectors: LiveInspector[] = [];
  for (const visit of visits) {
    const factory = visit.factories;
    if (!factory || factory.official_lat == null || factory.official_lng == null) continue;
    if (!isActiveState(visit.operational_state)) continue;
    const position = latestPositionByVisit.get(visit.id);
    const profile = visit.assignments?.[0]?.profiles;
    inspectors.push({
      id: `i:${visit.id}`,
      visitId: visit.id,
      inspector: sourceInspectorName(profile, locale, messages.fallback.inspectorName),
      factoryId: `f:${factory.id}`,
      factoryName: factory.name,
      region: factory.region
        ? localizedRegionName(factory.region, locale)
        : factory.city ?? messages.fallback.region,
      state: visit.operational_state,
      stateLabel: stateLabels(locale)[ACTIVE_STATE_KEY[visit.operational_state]],
      lat: position ? Number(position.observed_lat) : null,
      lng: position ? Number(position.observed_lng) : null,
      sinceAt: visit.window_start,
      sinceLabel: visit.window_start
        ? timeFormatter.format(new Date(visit.window_start))
        : messages.fallback.since,
      positionObservedAt: position?.occurred_at ?? null,
      positionObservedLabel: position
        ? timeFormatter.format(new Date(position.occurred_at))
        : messages.fallback.position,
      positionSourceLabel: position ? positionSourceLabel(position.kind) : null,
      positionState: position
        ? "recorded"
        : rejectedPositionVisitIds.has(visit.id) ? "rejected" : "unavailable",
    });
  }

  return { factories, regions, inspectors, positionObservedAt };
}

export function buildLiveOpsProps(data: LiveOperationsData, wallboard: boolean) {
  const view = buildLiveOperationsView(data);
  return {
    factories: view.factories,
    regions: view.regions,
    inspectors: view.inspectors,
    strings: buildLiveOpsStrings(data.locale),
    snapshotAt: data.observedAt.toISOString(),
    positionObservedAt: view.positionObservedAt,
    wallboard,
    visitReadError: data.visitReadError,
    positionReadError: data.positionReadError,
    factoryReadError: data.factoryReadError,
    excludedRecordCount: data.excludedRecordCount,
    outOfScopeRecordCount: data.outOfScopeRecordCount,
    locale: data.locale,
  };
}

export function buildLiveOpsStrings(locale: Locale) {
  const { live } = getMessages(locale).operations;
  return {
    loading: live.loading.detail,
    enRoute: live.stat.enRoute,
    totalsLabel: live.totalsLabel,
    inspector: live.map.markerLegend,
    freshnessPolicy: live.snapshot.policy,
    lastObserved: live.snapshot.lastObserved,
    snapshotGenerated: live.snapshot.generated,
    noRecordedPositions: live.snapshot.none,
    activeList: live.list.title,
    since: live.details.since,
    noScope: live.list.noScope,
    noPositions: live.list.noPositions,
    loadError: live.map.loadError,
    retry: live.map.retry,
    providerFailed: live.map.unavailable,
    mapUnavailable: live.map.unavailable,
    mapboxNotConfigured: live.map.unavailable,
    mapAriaLabel: live.map.ariaLabel,
    wallboardExit: live.wallboard.exit,
    selectedInspector: live.details.title,
    inspectorName: live.details.inspector,
    factoryName: live.details.factory,
    regionName: live.details.region,
    operationalState: live.details.state,
    visitReference: live.details.visitReference,
    closeDetails: live.details.close,
    dataIntegrity: live.notice.excluded,
    outOfScopeGeography: live.notice.outOfScope,
    positionSourceField: live.details.positionSource,
    positionObservedField: live.details.positionObserved,
    openVisit: live.details.open,
    active: live.stat.active,
    arrived: live.stat.arrived,
    recordedState: live.provenance.recorded,
    unavailableState: live.provenance.unavailable,
    rejectedState: live.provenance.rejected,
    partialSource: live.notice.partialSource,
    factorySourceUnavailable: live.notice.factorySource,
    sourceNotRecorded: live.fallback.source,
  };
}

export type { LiveVisitRow };
