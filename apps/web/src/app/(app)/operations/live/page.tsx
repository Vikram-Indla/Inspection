import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import LiveOps, { type LiveOpsStrings } from "./LiveOps";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation } from "@/lib/shell-navigation";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { resolveRegionId, type KsaRegionCollection } from "@/lib/ksa-regions";
import ksaRegionsJson from "../../../../../public/geo/sau-regions.geo.json";
import { redirect } from "next/navigation";

// SCR-WEB-500 / WA-DES-034-C3 — read-only national operations observation.
// This view never claims GPS telemetry, route navigation, ETA or risk policy.

type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  source: string; is_temporary: boolean;
};
type VisitRow = {
  id: string; operational_state: string; planning_status: string;
  window_start: string | null; window_end: string | null; factory_id: string | null; notes: string | null;
  factories: { id: string; name: string; region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null;
    source: string; is_temporary: boolean; factory_code: string | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

function isVerificationRecord(factory: VisitRow["factories"], notes: string | null): boolean {
  return factory?.source === "verification_fixture"
    || isTestFixtureEstablishment(factory)
    || /\b(?:verification|test) fixture\b/i.test(notes ?? "");
}

function sourceInspectorName(name: string | null | undefined, fallback: string): string {
  return name?.trim() || fallback;
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

// Deterministic 0..1 from a string — a stable phase/direction per inspector so
// the projected routes fan out instead of marching in lockstep.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
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
    collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, source, is_temporary")
      .not("official_lat", "is", null)
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, notes, factories(id, name, region, city, official_lat, official_lng, source, is_temporary, factory_code), assignments(profiles(full_name))")
      .in("operational_state", ["on_the_way", "arrived", "executing"])
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
  ]);

  if (factoriesRes.error) console.error(`[operations live] factories read failed: ${factoriesRes.error.message}`);
  if (visitsRes.error) console.error(`[operations live] visits read failed: ${visitsRes.error.message}`);

  const factoryRows = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const visitRows = (visitsRes.data ?? []) as unknown as VisitRow[];

  const hasReadError = Boolean(factoriesRes.error || visitsRes.error);
  const activeVisitRows = visitRows.filter(visit => {
    if (isVerificationRecord(visit.factories, visit.notes)) return false;
    const startsAt = visit.window_start ? Date.parse(visit.window_start) : NaN;
    // An operational position cannot be current before its visit window starts.
    // Reject future-dated rows instead of presenting impossible "Since" values.
    return Number.isNaN(startsAt) || startsAt <= observedAt.getTime();
  });
  const activeFactoryIds = new Set(activeVisitRows.map(visit => visit.factory_id).filter(Boolean));
  const factories: LiveFactory[] = factoryRows
    .filter(factory => activeFactoryIds.has(factory.id))
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
  const inspectors: LiveInspector[] = [];
  for (const v of activeVisitRows) {
    const f = v.factories;
    const name = v.assignments?.[0]?.profiles?.full_name;
    if (!f || f.official_lat == null || f.official_lng == null) continue;
    const destLat = Number(f.official_lat);
    const destLng = Number(f.official_lng);
    const h = hash01(v.id);
    const ang = h * Math.PI * 2;
    const dist = 1.1 + hash01(v.id + "d") * 0.5;
    const originLat = destLat + Math.sin(ang) * dist;
    const originLng = destLng + Math.cos(ang) * dist;
    let fraction = 0.15 + h * 0.5;
    const ws = v.window_start ? Date.parse(v.window_start) : NaN;
    const we = v.window_end ? Date.parse(v.window_end) : NaN;
    if (!Number.isNaN(ws) && !Number.isNaN(we) && we > ws) {
      fraction = Math.min(0.9, Math.max(0.08, (observedAt.getTime() - ws) / (we - ws)));
    }
    if (v.operational_state !== "on_the_way") fraction = 1;
    inspectors.push({
      id: `i:${v.id}`,
      visitId: v.id,
      inspector: sourceInspectorName(
        name,
        t("ops.live.inspectorFallback", local("Inspector name unavailable", "اسم المفتش غير متاح")),
      ),
      factoryId: `f:${f.id}`, factoryName: f.name,
      region: f.region
        ? localizedRegionName(f.region, locale)
        : f.city ?? t("ops.live.regionUnknown", local("Region not recorded", "المنطقة غير مسجّلة")),
      state: v.operational_state as LiveInspector["state"],
      stateLabel: enumLabel(v.operational_state),
      lat: originLat + (destLat - originLat) * fraction,
      lng: originLng + (destLng - originLng) * fraction,
      sinceAt: v.window_start,
      sinceLabel: v.window_start
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
            dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
          }).format(new Date(v.window_start))
        : t("ops.live.sinceUnknown", local("Not recorded", "غير مسجّل")),
    });
  }

  const strings: LiveOpsStrings = {
    loading: t("ops.live.loading", local("Bringing the national picture online…", "جارٍ تحميل المشهد التشغيلي الوطني…")),
    enRoute: t("ops.live.enRoute", local("Inspectors en route", "مفتشون في الطريق")),
    executing: t("ops.live.executing", local("On site now", "في الموقع الآن")),
    completed: t("ops.live.factories", local("Factories monitored", "مصانع قيد المتابعة")),
    inspector: t("ops.live.inspectorLegend", local("Operational position marker", "مؤشر موقع تشغيلي")),
    projected: t("ops.live.projectedNote", local("Projected route — not live GPS", "مسار متوقّع — ليس تتبعاً مباشراً عبر GPS")),
    freshnessPolicy: t("ops.live.freshnessPolicy", local(
      "Staleness cadence not yet configured — showing last-observed time only.",
      "لم يُضبط معيار حداثة البيانات بعد — يُعرض وقت آخر رصد فقط.",
    )),
    lastObserved: t("ops.live.lastObserved", local("Last observed", "آخر رصد")),
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
    selectedInspector: t("ops.live.selectedInspector", local("Inspector details", "تفاصيل المفتش")),
    inspectorName: t("ops.live.inspectorName", local("Inspector", "المفتش")),
    factoryName: t("ops.live.factoryName", local("Factory", "المصنع")),
    regionName: t("ops.live.regionName", local("Region", "المنطقة")),
    operationalState: t("ops.live.operationalState", local("Operational state", "الحالة التشغيلية")),
    visitReference: t("ops.live.visitReference", local("Visit reference", "مرجع الزيارة")),
    closeDetails: t("ops.live.closeDetails", local("Close inspector details", "إغلاق تفاصيل المفتش")),
    dataIntegrity: t(
      "ops.live.dataIntegrity",
      local(
        "Verification fixtures and future-dated visit windows are excluded from this live view. Excluded records:",
        "تُستبعد سجلات التحقق التجريبية ونوافذ الزيارات المستقبلية من العرض المباشر. السجلات المستبعدة:",
      ),
    ),
  };

  const title = t("ops.live.title", local("Live Operations — Saudi Arabia", "العمليات المباشرة — المملكة العربية السعودية"));
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
        excludedRecordCount={visitRows.length - activeVisitRows.length}
        locale={locale}
      />
    </Shell>
  );
}
