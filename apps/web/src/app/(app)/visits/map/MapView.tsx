import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import VisitMapTable from "@/components/sections/visits/visit-map-table/visit-map-table";
import { makeEnumLabel } from "@/i18n/enum-label";
import { getMessages } from "@/i18n/messages";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { regionLabel } from "@/lib/ksa-regions";
import {
  MAP_PAGE_SIZE, dayEndIso, dayStartIso, operationalTone, pageCountOf,
  resolveDate, resolvePage, resolveRegion, resolveRisk, RISK_BANDS,
  type VisitMapParams, type VisitMapRow,
} from "@/features/visits/map";
import VisitMapFilters from "@/components/sections/visits/visit-map-filters/visit-map-filters";
import VisitMap, { type MappedVisit } from "./VisitMap";
import CoveragePanel from "./CoveragePanel";
import VisitViewNavigation, { type VisitBasePath } from "../VisitViewNavigation";

type VisitRow = {
  id: string; factory_id: string; visit_reference: string | null; operational_state: string;
  window_start: string | null; window_end: string | null;
  factories: { name: string; region: string | null; city: string | null; official_lat: number | null; official_lng: number | null; risk_band: string | null } | null;
  assignments: { inspector_id: string; profiles: { full_name: string } | null }[];
};

export async function VisitsMapView({ basePath = "/visits", params = {} }: {
  basePath?: VisitBasePath;
  params?: VisitMapParams;
}) {
  const { locale } = await useT();
  const messages = getMessages(locale);
  const strings = messages.visits.map;
  const enumLabel = makeEnumLabel(locale);
  const uiLocale = locale === "ar" ? "ar" : "en";
  const filter = {
    region: resolveRegion(params.region),
    risk: resolveRisk(params.risk),
    from: resolveDate(params.from),
    to: resolveDate(params.to),
  };
  const page = resolvePage(params.page);
  const sb = await supabaseServer();

  const select = `id, factory_id, visit_reference, operational_state, window_start, window_end,
      factories!inner(name, region, city, official_lat, official_lng, risk_band),
      assignments(inspector_id, profiles(full_name))`;
  const scoped = sb.from("visits").select(select, { count: "exact" })
    .not("factories.official_lat", "is", null)
    .order("window_start", { ascending: false });
  const byRegion = filter.region === "" ? scoped : scoped.eq("factories.region", filter.region);
  const byRisk = filter.risk === "" ? byRegion : byRegion.eq("factories.risk_band", filter.risk);
  const byFrom = filter.from === "" ? byRisk : byRisk.gte("window_start", dayStartIso(filter.from));
  const paged = filter.to === "" ? byFrom : byFrom.lte("window_start", dayEndIso(filter.to));

  const [{ data: visits, error, count }, { data: geo }, { data: regionRows }] = await Promise.all([
    paged.range(page * MAP_PAGE_SIZE, page * MAP_PAGE_SIZE + MAP_PAGE_SIZE - 1),
    sb.from("geo_events").select("visit_id, observed_lat, observed_lng, occurred_at")
      .in("kind", ["telemetry", "arrival", "checkin", "override"]).order("occurred_at", { ascending: false }).limit(5000),
    sb.from("factories").select("region").not("region", "is", null).limit(1000),
  ]);

  if (error) {
    console.error(`[visits map] visit read failed: ${error.message}`);
    return (
      <Shell current={basePath} title={strings.title}>
        <EmptyState icon="map" tone="danger" title={strings.loadErrorTitle} description={strings.loadErrorNeutral} />
      </Shell>
    );
  }

  const latest = new Map<string, { observed_lat: number; observed_lng: number; occurred_at: string }>();
  for (const row of geo ?? []) if (!latest.has(row.visit_id)) latest.set(row.visit_id, row as never);

  const located = ((visits ?? []) as unknown as VisitRow[]).flatMap(v => {
    if (!v.factories || v.factories.official_lat == null || v.factories.official_lng == null) return [];
    const position = latest.get(v.id);
    const sourceRegion = v.factories.region ?? "";
    const sourceCity = v.factories.city ?? "";
    return [{
      id: v.id, factoryId: v.factory_id, factoryName: v.factories.name,
      reference: v.visit_reference ?? strings.referenceUnavailable,
      region: regionLabel(sourceRegion, uiLocale),
      city: sourceCity === sourceRegion ? "" : sourceCity,
      factoryLat: Number(v.factories.official_lat), factoryLng: Number(v.factories.official_lng),
      inspectorName: v.assignments?.[0]?.profiles?.full_name ?? "",
      inspectorLat: position ? Number(position.observed_lat) : null,
      inspectorLng: position ? Number(position.observed_lng) : null,
      inspectorAt: position?.occurred_at ?? null, operationalState: v.operational_state,
      riskBand: v.factories.risk_band, windowStart: v.window_start, windowEnd: v.window_end,
    }];
  });

  const mapped: MappedVisit[] = located.map(({ reference: _reference, ...visit }) => visit);
  const rows: readonly VisitMapRow[] = located.map(visit => ({
    id: visit.id,
    reference: visit.reference,
    factoryId: visit.factoryId,
    factoryName: visit.factoryName,
    region: visit.region,
    city: visit.city,
    inspectorLocation: visit.inspectorLat === null
      ? null
      : `${visit.inspectorName || strings.inspectorFallback} · ${visit.inspectorAt ? formatDateTime(visit.inspectorAt, uiLocale) : strings.latestLocation}`,
    stateLabel: enumLabel(visit.operationalState),
    stateTone: operationalTone(visit.operationalState),
  }));

  const total = count ?? rows.length;
  const regions = [...new Set((regionRows ?? []).map(row => String(row.region)).filter(Boolean))].sort();

  return (
    <Shell current={basePath} title={strings.title} context={<StatusPill tone="info">{strings.context}</StatusPill>}>
      <VisitViewNavigation
        basePath={basePath}
        active="map"
        ariaLabel={messages.planning.visit.views.aria}
        labels={{
          list: basePath === "/planning" ? messages.planning.home.title : messages.planning.visit.views.list,
          calendar: messages.planning.visit.views.calendar,
          map: messages.planning.visit.views.map,
          workload: messages.planning.visit.views.workload,
        }}
      />
      {basePath === "/planning" ? (
        <VisitMapFilters
          filter={filter}
          regions={regions}
          riskOptions={RISK_BANDS.map(band => ({ value: band, label: enumLabel(band) }))}
          basePath={basePath}
          locale={uiLocale}
          presetLabels={messages.common.scope}
          monthLabels={{ previous: messages.common.scope.previousMonth, next: messages.common.scope.nextMonth }}
          strings={messages.visits.coverage}
        />
      ) : null}
      <VisitMap
        visits={mapped}
        locale={locale}
        strings={{
          region: strings.region, allRegions: strings.allRegions,
          factoryVisitLegend: strings.legendFactory, inspectorLegend: strings.legendInspector,
          legendLabel: strings.legendLabel,
          noneInRegion: strings.noneInRegion, noneInRegionBody: strings.noneInRegionBody,
          assignedInspector: strings.inspectorFallback, inspectorFallback: strings.inspectorFallback,
          latestLocation: strings.latestLocation, openVisit: strings.openVisit,
        }}
      />
      <VisitMapTable
        rows={rows}
        page={page}
        pageCount={pageCountOf(total)}
        total={total}
        filter={filter}
        basePath={basePath}
        strings={strings}
      />
      {basePath === "/planning" ? <CoveragePanel visits={mapped} strings={messages.visits.coverage} /> : null}
    </Shell>
  );
}
