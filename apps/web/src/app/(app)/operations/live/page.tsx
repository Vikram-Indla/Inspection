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
  factories: { id: string; name: string; region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

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
      .select("id, name, region, city, official_lat, official_lng")
      .not("official_lat", "is", null)
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, factories(id, name, region, city, official_lat, official_lng), assignments(profiles(full_name))")
      .in("operational_state", ["on_the_way", "arrived", "executing"])
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
  ]);

  if (factoriesRes.error) console.error(`[operations live] factories read failed: ${factoriesRes.error.message}`);
  if (visitsRes.error) console.error(`[operations live] visits read failed: ${visitsRes.error.message}`);

  const factoryRows = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const visitRows = (visitsRes.data ?? []) as unknown as VisitRow[];

  const hasReadError = Boolean(factoriesRes.error || visitsRes.error);
  const factories: LiveFactory[] = factoryRows.map(f => ({
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

  const enumLabel = (v: string) => t(`enum.${v}`, v.replace(/_/g, " "));
  const inspectors: LiveInspector[] = [];
  for (const v of visitRows) {
    const f = v.factories;
    const name = v.assignments?.[0]?.profiles?.full_name;
    if (!f || f.official_lat == null || f.official_lng == null || !name) continue;
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
      id: `i:${v.id}`, visitId: v.id, inspector: name,
      factoryId: `f:${f.id}`, factoryName: f.name,
      region: f.region ?? f.city ?? t("ops.live.regionUnknown", "Region not recorded"),
      state: v.operational_state as LiveInspector["state"],
      stateLabel: enumLabel(v.operational_state),
      lat: originLat + (destLat - originLat) * fraction,
      lng: originLng + (destLng - originLng) * fraction,
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
    projected: t("ops.live.projectedNote", "Projected route — not live GPS"),
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
