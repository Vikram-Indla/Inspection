import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import LiveOps, { type LiveOpsStrings } from "./LiveOps";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation, BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { resolveRegionId, type KsaRegionCollection } from "@/lib/ksa-regions";
import ksaRegionsJson from "../../../../../public/geo/sau-regions.geo.json";
import { redirect } from "next/navigation";
import Link from "next/link";
import { IconBlocked } from "@/app/icons";

// SCR-WEB-500 / WA-DES-034-C3 — read-only national operations observation.
// This view never claims GPS telemetry, route navigation, ETA or risk policy.

type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  source: string; is_temporary: boolean; factory_code: string | null;
};
type VisitRow = {
  id: string; operational_state: string; planning_status: string;
  window_start: string | null; window_end: string | null; factory_id: string | null; notes: string | null;
  factories: { id: string; name: string; region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null;
    source: string; is_temporary: boolean; factory_code: string | null } | null;
  assignments: { profiles: { full_name: string; email: string | null } | null }[] | null;
};
type GeoPositionRow = {
  id: string;
  visit_id: string;
  observed_lat: number;
  observed_lng: number;
  occurred_at: string;
  integration_mode: string | null;
  kind: string;
};

function isVerificationRecord(factory: VisitRow["factories"], notes: string | null): boolean {
  return factory?.source === "verification_fixture"
    || isTestFixtureEstablishment(factory)
    || /\b(?:verification|test) fixture\b/i.test(notes ?? "");
}

const CLEAN_FACTORY_CODES = new Set([
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
]);
const TEST_ACCOUNT_EMAILS = new Set([
  "planner@mim.gov.sa",
  "inspector@mim.gov.sa",
  "reviewer@mim.gov.sa",
  "admin@mim.gov.sa",
  "ops@mim.gov.sa",
]);

function isCleanFactory(factory: VisitRow["factories"] | FactoryRow | null): boolean {
  return Boolean(factory?.factory_code && CLEAN_FACTORY_CODES.has(factory.factory_code));
}

function sourceInspectorName(
  profile: { full_name: string; email: string | null } | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!profile?.email || !TEST_ACCOUNT_EMAILS.has(profile.email.toLowerCase())) return fallback;
  const name = profile.full_name.trim();
  if (!name) return fallback;
  const hasArabic = /[\u0600-\u06ff]/.test(name);
  return (locale === "ar") === hasArabic ? name : fallback;
}

function validObservedPosition(position: GeoPositionRow, snapshotMs: number): boolean {
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

const KSA_REGION_NAMES = new Map(
  (ksaRegionsJson as KsaRegionCollection).features.map(feature => [feature.properties.id, feature.properties]),
);

function localizedRegionName(sourceName: string, locale: string): string {
  const regionId = resolveRegionId(sourceName);
  const region = regionId ? KSA_REGION_NAMES.get(regionId) : null;
  if (!region) return sourceName;
  return locale === "ar" ? region.name_ar : region.name_en;
}

export default async function LiveOperations({ searchParams }: {
  searchParams: Promise<{ wallboard?: string }>;
}) {
  const { t, locale } = await useT();
  const local = (english: string, arabic: string) => locale === "ar" ? arabic : english;
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
  // DSG-CMD-020 — direct-route authorization: business-visible shell items are
  // unconditionally enabled for every web-portal persona, including admin-only
  // ones, so nav visibility cannot be the authorization. The route verifies the
  // caller independently holds an operational role.
  // PKT-RESPONSIVE-DASHBOARD-OPERATIONS-002 — the Inspector remains an
  // authorized read persona after the former field-only shell is removed.
  const hasOperationalRole = routeRoleKeys.some(role => BUSINESS_ROLE_KEYS.includes(role));
  const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;
  if (!mayViewOperations) {
    return (
      <Shell current="/operations/live" title={t("ops.live.title", "Live Operations — Saudi Arabia")}>
        <EmptyState
          icon={<IconBlocked size={24} />}
          title={t("ops.unauthorized.title", "Operations access required")}
          body={t("ops.unauthorized.body", "This page is not turned on for your account, so no data has loaded.")}
        >
          <Link className="sq-btn sq-btn--secondary" href="/launch">{t("ops.unauthorized.return", "Return to my area")}</Link>
        </EmptyState>
      </Shell>
    );
  }

  const { data: profileRow } = await sb
    .from("profiles")
    .select("region")
    .eq("user_id", user.id)
    .maybeSingle();
  // RBAC-008 data-scope: profiles.region is the sole existing authorized-geography
  // assignment (also used by task_assignments scope matching). A user with no
  // assigned region keeps the existing national visibility already granted by
  // the visits/factories RLS role policies; this filter only narrows that grant.
  const authorizedScope = profileRow?.region?.trim() ?? "";
  const authorizedRegionId = resolveRegionId(authorizedScope || null);
  const inAuthorizedGeography = (region: string | null, city: string | null) => {
    // Preserve the existing RLS grant when no narrower profile geography is
    // assigned. A configured assignment still fails closed on unknown rows.
    if (!authorizedScope) return true;
    if (authorizedRegionId) return resolveRegionId(region) === authorizedRegionId;
    const normalized = authorizedScope.toLocaleLowerCase("en");
    return [region, city].some(value => value?.trim().toLocaleLowerCase("en") === normalized);
  };

  const observedAt = new Date();
  const [factoriesRes, visitsRes] = await Promise.all([
    collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, source, is_temporary, factory_code")
      .in("factory_code", [...CLEAN_FACTORY_CODES])
      .not("official_lat", "is", null)
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, notes, factories(id, name, region, city, official_lat, official_lng, source, is_temporary, factory_code), assignments(profiles(full_name, email))")
      .in("operational_state", ["on_the_way", "arrived", "executing"])
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
  ]);

  if (factoriesRes.error) console.error(`[operations live] factories read failed: ${factoriesRes.error.message}`);
  if (visitsRes.error) console.error(`[operations live] visits read failed: ${visitsRes.error.message}`);

  const factoryRows = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const visitRows = (visitsRes.data ?? []) as unknown as VisitRow[];

  const integrityFilteredVisitRows = visitRows.filter(visit => {
    if (!isCleanFactory(visit.factories) || isVerificationRecord(visit.factories, visit.notes)) return false;
    const startsAt = visit.window_start ? Date.parse(visit.window_start) : NaN;
    // An operational position cannot be current before its visit window starts.
    // Reject future-dated rows instead of presenting impossible "Since" values.
    return Number.isNaN(startsAt) || startsAt <= observedAt.getTime();
  });
  // CR-439/CR-447: narrow to the caller's authorized geography (RBAC-008
  // profiles.region). A visit whose factory carries no region cannot be
  // proven in-scope, so it is excluded rather than assumed authorized.
  const activeVisitRows = integrityFilteredVisitRows.filter(visit =>
    inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null));
  const outOfScopeRecordCount = integrityFilteredVisitRows.length - activeVisitRows.length;
  const activeVisitIds = activeVisitRows.map(visit => visit.id);
  const geoPositionsRes = activeVisitIds.length > 0
    ? await collectPostgrestPages<GeoPositionRow>((from, to) => sb.from("geo_events")
      .select("id, visit_id, observed_lat, observed_lng, occurred_at, integration_mode, kind")
      .in("visit_id", activeVisitIds)
      .or("integration_mode.is.null,integration_mode.eq.production")
      .lte("occurred_at", observedAt.toISOString())
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<GeoPositionRow>>)
    : { data: [] as GeoPositionRow[], error: null };
  if (geoPositionsRes.error) {
    console.error(`[operations live] geo position read failed: ${geoPositionsRes.error.message}`);
  }
  const visitReadError = Boolean(visitsRes.error);
  const positionReadError = Boolean(geoPositionsRes.error);
  const factoryReadError = Boolean(factoriesRes.error);
  const latestPositionByVisit = new Map<string, GeoPositionRow>();
  const rejectedPositionVisitIds = new Set<string>();
  for (const position of (geoPositionsRes.data ?? []) as GeoPositionRow[]) {
    if (!validObservedPosition(position, observedAt.getTime())) {
      rejectedPositionVisitIds.add(position.visit_id);
    } else if (!latestPositionByVisit.has(position.visit_id)) {
      latestPositionByVisit.set(position.visit_id, position);
    }
  }
  const latestPositionObservedAt = [...latestPositionByVisit.values()]
    .map(position => position.occurred_at)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const activeFactoryIds = new Set(activeVisitRows.map(visit => visit.factory_id).filter(Boolean));
  const factories: LiveFactory[] = factoryRows
    .filter(factory => isCleanFactory(factory)
      && activeFactoryIds.has(factory.id)
      && inAuthorizedGeography(factory.region, factory.city))
    .map(f => ({
    id: `f:${f.id}`, rawId: f.id, name: f.name, region: f.region, city: f.city,
    lat: Number(f.official_lat), lng: Number(f.official_lng),
  }));

  const byRegion = new Map<string, LiveFactory[]>();
  for (const f of factories) {
    if (!f.region) continue;
    (byRegion.get(f.region) ?? byRegion.set(f.region, []).get(f.region)!).push(f);
  }
  const regions: LiveRegion[] = [...byRegion.entries()].map(([name, fs]) => {
    const lat = fs.reduce((a, f) => a + f.lat, 0) / fs.length;
    const lng = fs.reduce((a, f) => a + f.lng, 0) / fs.length;
    return {
      id: name, name, lat, lng,
    };
  });

  const enumLabel = (v: string) => t(`enum.${v}`, locale === "ar"
    ? ({ on_the_way: "في الطريق", arrived: "وصل", executing: "قيد التنفيذ" }[v] ?? v.replace(/_/g, " "))
    : v.replace(/_/g, " "));
  // Truth rule: every live-position claim must carry its source (geo_events.kind)
  // and observation timestamp, not just the visit window start.
  const positionSourceLabel = (kind: string) => t(`geoEvent.kind.${kind}`, locale === "ar"
    ? ({ telemetry: "تتبع تلقائي", arrival: "تسجيل وصول", checkin: "تسجيل دخول",
        override: "تجاوز يدوي", deviation: "انحراف مسار" }[kind] ?? kind.replace(/_/g, " "))
    : kind.replace(/_/g, " "));
  const positionTimeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  });
  const inspectors: LiveInspector[] = [];
  for (const v of activeVisitRows) {
    const f = v.factories;
    const position = latestPositionByVisit.get(v.id);
    const profile = v.assignments?.[0]?.profiles;
    if (!f || f.official_lat == null || f.official_lng == null) continue;
    inspectors.push({
      id: `i:${v.id}`,
      visitId: v.id,
      inspector: sourceInspectorName(
        profile,
        locale,
        t("ops.live.inspectorFallback", local("Inspector name unavailable", "اسم المفتش غير متاح")),
      ),
      factoryId: `f:${f.id}`, factoryName: f.name,
      region: f.region
        ? localizedRegionName(f.region, locale)
        : f.city ?? t("ops.live.regionUnknown", local("Region not recorded", "المنطقة غير مسجّلة")),
      state: v.operational_state as LiveInspector["state"],
      stateLabel: enumLabel(v.operational_state),
      lat: position ? Number(position.observed_lat) : null,
      lng: position ? Number(position.observed_lng) : null,
      sinceAt: v.window_start,
      sinceLabel: v.window_start
        ? positionTimeFormatter.format(new Date(v.window_start))
        : t("ops.live.sinceUnknown", local("Not recorded", "غير مسجّل")),
      positionObservedAt: position?.occurred_at ?? null,
      positionObservedLabel: position
        ? positionTimeFormatter.format(new Date(position.occurred_at))
        : t("ops.live.positionUnobserved", local("No recorded position for this visit", "لا يوجد موقع مسجّل لهذه الزيارة")),
      positionSourceLabel: position ? positionSourceLabel(position.kind) : null,
      positionState: position
        ? "recorded"
        : rejectedPositionVisitIds.has(v.id) ? "rejected" : "unavailable",
    });
  }

  const strings: LiveOpsStrings = {
    loading: t("ops.live.loading", local("Bringing the national picture online…", "جارٍ تحميل المشهد التشغيلي الوطني…")),
    enRoute: t("ops.live.enRoute", local("Inspectors en route", "مفتشون في الطريق")),
    executing: t("ops.live.executing", local("On site now", "في الموقع الآن")),
    completed: t("ops.live.factories", local("Factories monitored", "مصانع قيد المتابعة")),
    totalsLabel: t("ops.live.totalsLabel", local("Live operations totals", "إجماليات العمليات المباشرة")),
    inspector: t("ops.live.inspectorLegend", local("Recorded inspector position marker", "مؤشر موقع مسجّل للمفتش")),
    projected: t("ops.live.projectedNote", local("Recorded positions — not live GPS", "مواقع مسجّلة — ليست تتبعاً مباشراً عبر GPS")),
    // Product voice: state the fact about the data, not the state of the
    // roadmap. The old copy ("We don't track data freshness yet") narrated an
    // unbuilt capability in the first person; the disclosure it carried — that
    // times are recording times, not live — is preserved.
    freshnessPolicy: t("ops.live.freshnessPolicy", local(
      "Times shown are when each position was recorded.",
      "الأوقات المعروضة هي وقت تسجيل كل موقع.",
    )),
    lastObserved: t("ops.live.lastObserved", local("Last recorded position", "آخر موقع مسجّل")),
    snapshotGenerated: t("ops.live.snapshotGenerated", local("Snapshot generated", "وقت إنشاء اللقطة")),
    noRecordedPositions: t("ops.live.noRecordedPositions", local(
      "No recorded inspector positions in this snapshot",
      "لا توجد مواقع مسجّلة للمفتشين في هذه اللقطة",
    )),
    activeList: t("ops.live.activeList", local("Active inspectors", "المفتشون النشطون")),
    since: t("ops.live.since", local("Since", "منذ")),
    noScope: t("ops.live.noScope", local("No active visits in your scope right now", "لا توجد زيارات نشطة ضمن نطاقك حالياً")),
    noPositions: t("ops.live.noPositions", local("No inspectors currently active", "لا يوجد مفتشون نشطون حالياً")),
    loadError: t("ops.live.loadError", local("Live map could not load", "تعذّر تحميل خريطة العمليات المباشرة")),
    retry: t("common.retry", local("Retry", "إعادة المحاولة")),
    providerFailed: t("ops.live.providerFailed", local(
      "Live map unavailable — basemap provider failed.",
      "الخريطة المباشرة غير متاحة — تعذّر مزوّد الخريطة الأساسية.",
    )),
    mapUnavailable: t("ops.live.map.unavailable", local(
      "Live map unavailable — basemap provider failed.",
      "الخريطة المباشرة غير متاحة — تعذّر مزوّد الخريطة الأساسية.",
    )),
    mapboxNotConfigured: t("ops.live.map.notConfigured", local(
      "Live map unavailable — basemap provider failed.",
      "الخريطة المباشرة غير متاحة — تعذّر مزوّد الخريطة الأساسية.",
    )),
    mapAriaLabel: t("ops.live.map.ariaLabel", local("Mapbox operations map", "خريطة Mapbox للعمليات")),
    wallboardExit: t("ops.live.wallboardExit", local("Exit wallboard", "الخروج من شاشة المتابعة")),
    journeyLabel: t("ops.live.journeyLabel", local("Supervisor operations journey", "مسار العمليات للمشرف")),
    operationsCenter: t("ops.live.operationsCenter", local("Operations Center", "مركز العمليات")),
    exceptions: t("ops.live.exceptions", local("Exceptions", "الاستثناءات")),
    execution: t("ops.live.execution", local("Execution", "التنفيذ")),
    selectedInspector: t("ops.live.selectedInspector", local("Inspector details", "تفاصيل المفتش")),
    inspectorName: t("ops.live.inspectorName", local("Inspector", "المفتش")),
    factoryName: t("ops.live.factoryName", local("Factory", "المصنع")),
    regionName: t("ops.live.regionName", local("Region", "المنطقة")),
    operationalState: t("ops.live.operationalState", local("Visit status", "حالة الزيارة")),
    visitReference: t("ops.live.visitReference", local("Visit reference", "مرجع الزيارة")),
    closeDetails: t("ops.live.closeDetails", local("Close inspector details", "إغلاق تفاصيل المفتش")),
    dataIntegrity: t(
      "ops.live.dataIntegrity",
      local(
        // "Verification fixtures" is test-harness vocabulary, not something a
        // supervisor can act on. Same exclusion rule, named in product terms.
        "Sample records and visits scheduled for later are excluded from this view. Excluded:",
        "تُستبعد السجلات التجريبية والزيارات المجدولة لوقت لاحق من هذا العرض. المستبعدة:",
      ),
    ),
    outOfScopeGeography: t(
      "ops.live.outOfScopeGeography",
      local(
        "Records outside your authorized region are excluded from this live view. Excluded records:",
        "تُستبعد السجلات خارج نطاقك الجغرافي المخوَّل من العرض المباشر. السجلات المستبعدة:",
      ),
    ),
    positionSourceField: t("ops.live.positionSourceField", local("Position source", "مصدر الموقع")),
    positionObservedField: t("ops.live.positionObservedField", local("Position observed", "وقت رصد الموقع")),
    openVisit: t("ops.live.openVisit", local("Open visit record", "فتح سجل الزيارة")),
    active: t("ops.live.active", local("Active", "نشط")),
    arrived: t("ops.live.arrived", local("Arrived", "وصل")),
    recordedState: t("ops.live.recordedState", local(
      "Last recorded position — not guaranteed live",
      "آخر موقع مسجّل — ليس مضموناً أنه مباشر",
    )),
    unavailableState: t("ops.live.unavailableState", local("Location unavailable", "الموقع غير متاح")),
    rejectedState: t("ops.live.rejectedState", local(
      "Rejected implausible telemetry",
      "بيانات موقع غير معقولة ومرفوضة",
    )),
    partialSource: t("ops.live.partialSource", local(
      "Position data is unavailable. Active visits still appear, without a location.",
      "مصدر المواقع غير متاح. تبقى الزيارات النشطة مدرجة دون ادعاءات عن الموقع.",
    )),
    factorySourceUnavailable: t("ops.live.factorySourceUnavailable", local(
      "Factory marker data is unavailable. Inspector positions still show on their own.",
      "مصدر مؤشرات المصانع غير متاح. تبقى مشاهدات المفتشين مستقلة ومحدودة.",
    )),
    sourceNotRecorded: t("ops.live.sourceNotRecorded", local("Not recorded", "غير مسجّل")),
  };

  const title = t("ops.live.title", local("Live Operations — Saudi Arabia", "العمليات المباشرة — المملكة العربية السعودية"));
  return (
    <Shell current="/operations/live" title={title}>
      <LiveOps
        factories={factories}
        regions={regions}
        inspectors={inspectors}
        strings={strings}
        snapshotAt={observedAt.toISOString()}
        positionObservedAt={latestPositionObservedAt}
        wallboard={wallboard}
        visitReadError={visitReadError}
        positionReadError={positionReadError}
        factoryReadError={factoryReadError}
        excludedRecordCount={visitRows.length - integrityFilteredVisitRows.length}
        outOfScopeRecordCount={outOfScopeRecordCount}
        locale={locale}
      />
    </Shell>
  );
}
