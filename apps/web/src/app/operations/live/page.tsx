import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import LiveOps, { type LiveOpsStrings } from "./LiveOps";
import type { LiveFactory, LiveRegion, LiveInspector, RagBand } from "./types";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";

export const dynamic = "force-dynamic";

// SCR-WEB-500 (live prototype) — the national "FlightRadar" operations view.
// This is the authenticated home for live coverage intelligence: real factory
// names, region RAG posture, and inspectors moving toward their targets. It is
// deliberately NOT on the public login (that would broadcast enforcement
// posture) — see governance DEC-011 / SAQEEL-07. RLS scopes every row to the
// signed-in user's authority; the map only ever shows what they may already see.

type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  risk_score: number | null; risk_band: string | null;
};
type VisitRow = {
  id: string; operational_state: string; planning_status: string;
  window_start: string | null; window_end: string | null; factory_id: string | null;
  factories: { id: string; name: string; region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

const BAND: Record<string, RagBand> = { high: "high", medium: "medium", low: "low" };
function bandFromScore(score: number | null): RagBand {
  if (score == null) return "low";
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}
// Deterministic 0..1 from a string — a stable phase/direction per inspector so
// the projected routes fan out instead of marching in lockstep.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export default async function LiveOperations() {
  const { t } = await useT();
  const sb = await supabaseServer();

  const [factoriesRes, visitsRes] = await Promise.all([
    collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, risk_score, risk_band")
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

  // ---- factory pins (real names, banded) ----
  const factories: LiveFactory[] = factoryRows.map(f => ({
    id: `f:${f.id}`, rawId: f.id, name: f.name, region: f.region, city: f.city,
    lat: Number(f.official_lat), lng: Number(f.official_lng),
    band: f.risk_band && BAND[f.risk_band] ? BAND[f.risk_band] : bandFromScore(f.risk_score),
    riskScore: f.risk_score,
  }));

  // ---- region RAG zones (centroid + aggregate posture) ----
  const byRegion = new Map<string, LiveFactory[]>();
  for (const f of factories) {
    if (!f.region) continue;
    (byRegion.get(f.region) ?? byRegion.set(f.region, []).get(f.region)!).push(f);
  }
  const regions: LiveRegion[] = [...byRegion.entries()].map(([name, fs]) => {
    const lat = fs.reduce((a, f) => a + f.lat, 0) / fs.length;
    const lng = fs.reduce((a, f) => a + f.lng, 0) / fs.length;
    const scores = fs.map(f => f.riskScore).filter((n): n is number => n != null);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const high = fs.filter(f => f.band === "high").length;
    // posture: high if a quarter of the region is high-band or avg risk is high;
    // medium if any elevated presence; else low.
    const posture: RagBand =
      high / fs.length >= 0.25 || (avg ?? 0) >= 60 ? "high"
        : high > 0 || fs.some(f => f.band === "medium") || (avg ?? 0) >= 33 ? "medium"
          : "low";
    return {
      id: name, name, lat, lng,
      radiusM: Math.min(180000, 70000 + fs.length * 14000),
      posture, factories: fs.length, avgRisk: avg == null ? null : Math.round(avg),
    };
  });

  // ---- inspectors on projected routes ----
  const enumLabel = (v: string) => t(`enum.${v}`, v.replace(/_/g, " "));
  const inspectors: LiveInspector[] = [];
  for (const v of visitRows) {
    const f = v.factories;
    const name = v.assignments?.[0]?.profiles?.full_name;
    if (!f || f.official_lat == null || f.official_lng == null || !name) continue;
    const destLat = Number(f.official_lat), destLng = Number(f.official_lng);
    // Projected origin: offset ~1.1–1.6° from the factory on a stable bearing.
    // This is a route projection for the operations picture, not GPS telemetry
    // (DEC-002 open) — the legend says so.
    const h = hash01(v.id);
    const ang = h * Math.PI * 2;
    const dist = 1.1 + hash01(v.id + "d") * 0.5;
    const originLat = destLat + Math.sin(ang) * dist;
    const originLng = destLng + Math.cos(ang) * dist;
    // base progress from the visit window (clamped so pins sit on the leg)
    let baseFraction = 0.15 + h * 0.5;
    const ws = v.window_start ? Date.parse(v.window_start) : NaN;
    const we = v.window_end ? Date.parse(v.window_end) : NaN;
    if (!Number.isNaN(ws) && !Number.isNaN(we) && we > ws) {
      baseFraction = Math.min(0.9, Math.max(0.08, (Date.now() - ws) / (we - ws)));
    }
    inspectors.push({
      id: `i:${v.id}`, inspector: name,
      factoryId: `f:${f.id}`, factoryName: f.name,
      state: v.operational_state as LiveInspector["state"],
      stateLabel: enumLabel(v.operational_state),
      destLat, destLng, originLat, originLng, baseFraction,
      seed: h, etaMin: 12 + Math.round(h * 40),
    });
  }

  const strings: LiveOpsStrings = {
    loading: t("ops.live.loading", "Bringing the national picture online…"),
    enRoute: t("ops.live.enRoute", "Inspectors en route"),
    executing: t("ops.live.executing", "On site now"),
    completed: t("ops.live.factories", "Factories monitored"),
    legendTitle: t("ops.live.legend", "Inspection posture"),
    high: t("ops.live.high", "High risk"),
    medium: t("ops.live.medium", "Elevated"),
    low: t("ops.live.low", "In control"),
    inspector: t("ops.live.inspectorLegend", "Inspector (projected route)"),
    projected: t("ops.live.projectedNote", "Inspector positions are projected from the visit window, not live GPS (pending telemetry integration)."),
  };

  const title = t("ops.live.title", "Live Operations — Saudi Arabia");
  return (
    <Shell current="/operations/live" title={title}>
      <LiveOps factories={factories} regions={regions} inspectors={inspectors} strings={strings} />
    </Shell>
  );
}
