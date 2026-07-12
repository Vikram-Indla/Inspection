import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  ActionFormControls, MarkNotificationHandled,
  type ActionFormControlsStrings, type MarkHandledStrings,
} from "./Controls";
import { MonitoringTable, RegionCityFilter, type MonitoringStrings } from "./Monitoring";
import OpsMap, { type OpsPin, type OpsMapStrings } from "./OpsMap";
import OpsExport, { type ExportDataset, type OpsExportStrings } from "./OpsExport";
import type { MonitorRow } from "./actions";
import type { GeoTone } from "@/components/GeoMap";

export const dynamic = "force-dynamic";

// SCR-WEB-500 — Operations Center (SB12, M08). Read legs + write legs
// (acknowledge/close corrective actions; mark notifications handled) +
// KSA map (M08-002), high-risk board (M08-006), region/city filter (M08-010),
// SLA watch (ENG-09) and auto-refreshing live monitoring (M08-003).

type FactoryEmbed = { id: string; name: string; region: string | null; city: string | null } | null;
type VisitRow = {
  id: string;
  operational_state: string;
  planning_status: string;
  window_start: string;
  window_end: string;
  factory_id: string | null;
  factories: FactoryEmbed;
  assignments: { profiles: { full_name: string } | null }[] | null;
};
type GeoRow = { visit_id: string; kind: string; geofence_result: string | null; accuracy_m: number; occurred_at: string };
type ActionRow = {
  id: string;
  form_type: string;
  owner_name: string | null;
  owner_role: string | null;
  due_at: string | null;
  status: string;
  is_blocking: boolean;
  required_correction: string | null;
  inspections: { visit_id: string; visits: { factories: { id: string; name: string } | null } | null } | null;
};
type NotifRow = { id: string; event_key: string; channel: string; delivery_state: string; created_at: string };
type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  geofence_radius_m: number | null; risk_score: number | null; risk_band: string | null;
  activity_class: string | null;
};
type EngineRow = { engine: string; settings: Record<string, unknown> };

const NOTIF_TONE: Record<string, string> = {
  queued: "ax-lozenge--warning",
  sent: "ax-lozenge--info",
  delivered: "ax-lozenge--info",
  handled: "ax-lozenge--success",
  failed: "ax-lozenge--critical",
};

const BAND_TONE: Record<string, string> = {
  high: "ax-lozenge--critical",
  medium: "ax-lozenge--warning",
  low: "ax-lozenge--success",
};

// Active operational states → map pin tone (GeoMap resolves tones to ax tokens).
const ACTIVE_TONE: Record<string, GeoTone> = {
  on_the_way: "medium",
  arrived: "medium",
  executing: "low",
};

// ---------- ENG-09 SLA math (engine_settings 'sla' — configuration, not code) ----------
type SlaConf = {
  calendar?: { days?: string; hours?: string; tz?: string };
  reminders?: number[];
  escalation?: Record<string, string>;
  review_business_days?: number;
  resubmission_business_days?: number;
  action_due_calendar_days?: number;
};
type SlaFlag = {
  visit: VisitRow;
  kind: "overdue_start" | "overdue_submit" | "reminder";
  pct?: number;
  deadlineMs: number;
  escalation: "L1" | "L2" | null;
};

const DAY_IDX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
// Asia/Riyadh is fixed UTC+3 (no DST), so a constant offset is exact for day-of-week math.
const RIYADH_OFFSET_MS = 3 * 3_600_000;

/** Parse "Sun-Thu" → set of working weekday indexes; null when unparsable (then no L2 math — never invent). */
function workingDays(spec: string | undefined): Set<number> | null {
  const m = /^([A-Za-z]{3})-([A-Za-z]{3})$/.exec(spec ?? "");
  if (!m) return null;
  const a = DAY_IDX[m[1]], b = DAY_IDX[m[2]];
  if (a === undefined || b === undefined) return null;
  const s = new Set<number>();
  for (let d = a; ; d = (d + 1) % 7) { s.add(d); if (d === b) break; }
  return s;
}

function addBusinessDays(ms: number, n: number, wd: Set<number>): number {
  let t = ms, added = 0;
  while (added < n) {
    t += 86_400_000;
    if (wd.has(new Date(t + RIYADH_OFFSET_MS).getUTCDay())) added++;
  }
  return t;
}

/** ENG-09 — compute SLA flags from REAL visit windows (no timers, no synthetic clocks). */
function computeSlaFlags(visits: VisitRow[], sla: SlaConf, nowMs: number): SlaFlag[] {
  const reminders = (Array.isArray(sla.reminders) ? sla.reminders : []).filter(r => typeof r === "number");
  const wd = workingDays(sla.calendar?.days);
  // escalation.L2 is contract-encoded as "breach+1bd" — parse the business-day offset.
  const l2Match = /\+(\d+)bd$/.exec(sla.escalation?.L2 ?? "");
  const l2Bd = l2Match ? Number.parseInt(l2Match[1], 10) : null;

  const flags: SlaFlag[] = [];
  for (const v of visits) {
    const ws = Date.parse(v.window_start), we = Date.parse(v.window_end);
    if (Number.isNaN(ws) || Number.isNaN(we)) continue;
    const notStarted = v.operational_state === "new" || v.operational_state === "prepared";
    const notSubmitted = v.operational_state !== "submitted";

    let flag: SlaFlag | null = null;
    if (notStarted && nowMs > ws) {
      flag = { visit: v, kind: "overdue_start", deadlineMs: ws, escalation: "L1" };
    } else if (notSubmitted && nowMs > we) {
      flag = { visit: v, kind: "overdue_submit", deadlineMs: we, escalation: "L1" };
    } else if (notSubmitted && nowMs > ws && we > ws && reminders.length > 0) {
      const frac = (nowMs - ws) / (we - ws);
      const hit = [...reminders].sort((a, b) => b - a).find(r => frac >= r);
      if (hit !== undefined) flag = { visit: v, kind: "reminder", pct: Math.round(hit * 100), deadlineMs: we, escalation: null };
    }
    if (!flag) continue;
    if (flag.escalation && wd && l2Bd !== null && nowMs > addBusinessDays(flag.deadlineMs, l2Bd, wd)) {
      flag.escalation = "L2";
    }
    flags.push(flag);
  }
  // Breaches first (L2 before L1), then reminders; oldest deadline first within each.
  const rank = (f: SlaFlag) => (f.kind === "reminder" ? 2 : f.escalation === "L2" ? 0 : 1);
  return flags.sort((a, b) => rank(a) - rank(b) || a.deadlineMs - b.deadlineMs);
}

export default async function Operations({ searchParams }: { searchParams: Promise<{ region?: string; city?: string }> }) {
  const sp = await searchParams;
  const region = typeof sp.region === "string" ? sp.region : "";
  const city = typeof sp.city === "string" ? sp.city : "";
  const { t } = await useT();
  const sb = await supabaseServer();
  const [visitsRes, geoRes, actionsRes, notifsRes, factoriesRes, engineRes, riskRes] = await Promise.all([
    // KPI counts by operational_state span ALL visits — operational state is its own
    // domain (FND-002); filtering by planning_status here previously zeroed the cards.
    sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, factories(id, name, region, city), assignments(profiles(full_name))")
      .order("window_start", { ascending: true }),
    sb.from("geo_events")
      .select("visit_id, kind, geofence_result, accuracy_m, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(200),
    // Corrective actions queue (M09-027 blocking flag; DEC-003 due default 14d)
    sb.from("action_forms")
      .select("id, form_type, owner_name, owner_role, due_at, status, is_blocking, required_correction, inspections(visit_id, visits(factories(id, name)))")
      .neq("status", "closed")
      .order("due_at", { ascending: true }),
    // ENG-11 notification outbox — latest 20
    sb.from("notifications")
      .select("id, event_key, channel, delivery_state, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    // Factory master for the KSA map + region/city options (M08-002/010)
    sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class")
      .order("name", { ascending: true }),
    // ENG-06/ENG-09 configuration — geofence default + SLA thresholds
    sb.from("engine_settings").select("engine, settings").in("engine", ["gis", "sla"]),
    // M08-006 — high-risk factory board (ENG-04 output, top scores)
    sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class")
      .not("risk_score", "is", null)
      .order("risk_score", { ascending: false })
      .limit(8),
  ]);

  const loadErrors = [
    visitsRes.error && `visits: ${visitsRes.error.message}`,
    geoRes.error && `geo_events: ${geoRes.error.message}`,
    actionsRes.error && `action_forms: ${actionsRes.error.message}`,
    notifsRes.error && `notifications: ${notifsRes.error.message}`,
    factoriesRes.error && `factories: ${factoriesRes.error.message}`,
    engineRes.error && `engine_settings: ${engineRes.error.message}`,
    riskRes.error && `factories(risk): ${riskRes.error.message}`,
  ].filter(Boolean) as string[];

  const visits = (visitsRes.data ?? []) as unknown as VisitRow[];
  const geo = (geoRes.data ?? []) as unknown as GeoRow[];
  const actions = (actionsRes.data ?? []) as unknown as ActionRow[];
  const notifs = (notifsRes.data ?? []) as unknown as NotifRow[];
  const factories = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const engines = (engineRes.data ?? []) as unknown as EngineRow[];
  const highRisk = (riskRes.data ?? []) as unknown as FactoryRow[];

  const gisConf = (engines.find(e => e.engine === "gis")?.settings ?? {}) as { geofence_default_radius_m?: number };
  const slaConf = (engines.find(e => e.engine === "sla")?.settings ?? {}) as SlaConf;

  const states = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted"] as const;
  const counts = Object.fromEntries(states.map(s => [s, visits.filter(v => v.operational_state === s).length]));
  const published = visits.filter(v => v.planning_status === "published");
  // M08-010 — region/city scope for monitoring + map + SLA watch
  const monitored = published.filter(v =>
    (!region || v.factories?.region === region) && (!city || v.factories?.city === city));

  // Latest geofence result per visit (geo list already newest-first) — M08-014
  const latestGeofence = new Map<string, string>();
  for (const g of geo) {
    if (g.geofence_result && !latestGeofence.has(g.visit_id)) latestGeofence.set(g.visit_id, g.geofence_result);
  }
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const enumLabel = (value: string) => t(`enum.${value}`, value.replace(/_/g, " "));

  // ---------- ENG-09 SLA watch: engine thresholds vs live visit windows ----------
  const slaFlags = computeSlaFlags(monitored, slaConf, now);

  // ---------- M08-002 KSA map pins ----------
  const scopedFactories = factories.filter(f =>
    (!region || f.region === region) && (!city || f.city === city));
  const gisDefault = typeof gisConf.geofence_default_radius_m === "number" ? gisConf.geofence_default_radius_m : undefined;
  const pins: OpsPin[] = [];
  const pinnedFactoryIds = new Set<string>();
  for (const v of monitored) {
    const tone = ACTIVE_TONE[v.operational_state];
    if (!tone) continue;
    const f = scopedFactories.find(x => x.id === (v.factories?.id ?? v.factory_id));
    if (!f || f.official_lat == null || f.official_lng == null) continue;
    pinnedFactoryIds.add(f.id);
    pins.push({
      id: `v:${v.id}`, kind: "visit",
      lat: Number(f.official_lat), lng: Number(f.official_lng),
      label: `${f.name} · ${enumLabel(v.operational_state)}`,
      tone, radiusM: f.geofence_radius_m ?? gisDefault,
      href: `/visits/${v.id}`,
    });
  }
  for (const f of scopedFactories) {
    if (pinnedFactoryIds.has(f.id) || f.official_lat == null || f.official_lng == null) continue;
    pins.push({
      id: `f:${f.id}`, kind: "factory",
      lat: Number(f.official_lat), lng: Number(f.official_lng),
      label: f.name, tone: "neutral",
      href: `/factories/${f.id}`,
    });
  }

  // ---------- M08-010 filter option lists (region-scoped cities) ----------
  const regions = [...new Set(factories.map(f => f.region).filter((r): r is string => !!r))].sort();
  const cities = [...new Set(factories
    .filter(f => !region || f.region === region)
    .map(f => f.city).filter((c): c is string => !!c))].sort();

  // ---------- M08-003 monitoring rows (client table seeds; auto-refresh re-fetches) ----------
  const monitorRows: MonitorRow[] = monitored.map(v => ({
    id: v.id,
    factory_id: v.factories?.id ?? v.factory_id,
    factory_name: v.factories?.name ?? null,
    operational_state: v.operational_state,
    geofence: latestGeofence.get(v.id) ?? null,
    inspector: v.assignments?.[0]?.profiles?.full_name ?? null,
  }));
  const enumLabels = Object.fromEntries(
    [...states, "inside", "outside", "override"].map(v => [v, enumLabel(v)]));

  const visitWord = t("ops.visit", "visit");
  const actionControlStrings: ActionFormControlsStrings = {
    acknowledge: t("ops.actions.acknowledge", "Acknowledge"),
    close: t("ops.actions.close", "Close"),
    updated: t("ops.actions.updated", "updated"),
  };
  const markHandledStrings: MarkHandledStrings = {
    markHandled: t("ops.notifs.markHandled", "Mark handled"),
    handled: t("ops.notifs.handled", "handled"),
  };
  const monitoringStrings: MonitoringStrings = {
    regionLabel: t("ops.filter.region", "Region"),
    cityLabel: t("ops.filter.city", "City"),
    allRegions: t("ops.filter.allRegions", "All regions"),
    allCities: t("ops.filter.allCities", "All cities"),
    thVisit: t("ops.live.th.visit", "Visit"),
    thFactory: t("ops.live.th.factory", "Factory"),
    thOperational: t("ops.live.th.operational", "Operational"),
    thGeofence: t("ops.live.th.geofence", "Geofence"),
    thInspector: t("ops.live.th.inspector", "Inspector"),
    emptyTitle: t("ops.live.empty.title", "No published visits to monitor"),
    emptyDesc: t("ops.live.empty.desc", "Visits appear here once planning publishes them (FLD-VIS-005)."),
    refreshedAt: t("ops.live.refreshedAt", "Refreshed"),
    refreshing: t("ops.live.refreshing", "Refreshing…"),
    autoNote: t("ops.live.autoNote", "auto-refreshes every 30 s"),
  };
  const mapStrings: OpsMapStrings = {
    loadingTitle: t("ops.map.loading.title", "Loading KSA map"),
    loadingBody: t("ops.map.loading.body", "Leaflet renders in the browser only."),
    open: t("ops.map.open", "Open"),
    selectHint: t("ops.map.selectHint", "Click a pin to open the visit or factory dossier."),
    legendExecuting: t("ops.map.legend.executing", "executing"),
    legendEnRoute: t("ops.map.legend.enRoute", "en route / arrived"),
    legendFactory: t("ops.map.legend.factory", "factory"),
  };

  const slaKindLabel = (f: SlaFlag) =>
    f.kind === "overdue_start" ? t("ops.sla.overdueStart", "Overdue to start")
      : f.kind === "overdue_submit" ? t("ops.sla.overdueSubmit", "Overdue to submit")
        : `${t("ops.sla.reminder", "Reminder")} ${f.pct}%`;

  // ---------- M08-017 CSV export — three tables, region/city scope honored ----------
  const fmtTs = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
  const exportStrings: OpsExportStrings = {
    heading: t("ops.export.heading", "Export CSV (M08-017):"),
    scopeNote: t("ops.export.scopeNote", "reflects the current region/city scope · UTF-8 BOM for Arabic"),
  };
  const exportDatasets: ExportDataset[] = [
    {
      key: "monitoring",
      label: t("ops.export.monitoring", "Live monitoring"),
      filename: "ops_monitoring.csv",
      headers: [
        t("ops.live.th.visit", "Visit"), t("ops.live.th.factory", "Factory"),
        t("ops.live.th.operational", "Operational"), t("ops.live.th.geofence", "Geofence"),
        t("ops.live.th.inspector", "Inspector"),
      ],
      rows: monitorRows.map(r => [
        r.id.slice(0, 8), r.factory_name ?? "—", enumLabel(r.operational_state),
        r.geofence ? enumLabel(r.geofence) : "—", r.inspector ?? "—",
      ]),
    },
    {
      key: "sla",
      label: t("ops.export.sla", "SLA watch"),
      filename: "ops_sla_watch.csv",
      headers: [
        t("ops.sla.th.visit", "Visit"), t("ops.sla.th.factory", "Factory"),
        t("ops.sla.th.operational", "Operational"), t("ops.sla.th.deadline", "Deadline"),
        t("ops.sla.th.sla", "SLA"), t("ops.sla.th.escalation", "Escalation"),
      ],
      rows: slaFlags.map(f => [
        f.visit.id.slice(0, 8), f.visit.factories?.name ?? "—",
        enumLabel(f.visit.operational_state), fmtTs(f.deadlineMs),
        slaKindLabel(f), f.escalation ?? "—",
      ]),
    },
    {
      key: "risk",
      label: t("ops.export.risk", "High-risk factories"),
      filename: "ops_high_risk.csv",
      headers: [
        t("ops.risk.th.factory", "Factory"), t("ops.export.activity", "Activity"),
        t("ops.risk.th.location", "Location"), t("ops.risk.th.score", "Score"),
        t("ops.risk.th.band", "Band"),
      ],
      rows: highRisk.map(f => [
        f.name, f.activity_class ?? "—",
        [f.region, f.city].filter(Boolean).join(" · ") || "—",
        f.risk_score != null ? String(f.risk_score) : "—",
        f.risk_band ? enumLabel(f.risk_band) : "—",
      ]),
    },
  ];

  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("ops.context", "SCR-WEB-500 · SB12 · operational state ≠ workflow status (FND-002)")}</span>}>
      {loadErrors.length > 0 && (
        <div className="ax-banner ax-banner--critical" role="alert"><div>
          <strong>{t("ops.err.partial", "Partial service — some panels could not load.")}</strong> {loadErrors.join(" · ")} — {t("ops.err.retry", "retry")}.
        </div></div>
      )}

      {/* KPI cards — visits by operational_state (all planning statuses; FND-002) */}
      <div className="ax-kpi-row">
        {states.map(s => (
          <div key={s} className="ax-surface ax-kpi"><span className="ax-overline">{enumLabel(s)}</span>
            <span className="ax-kpi__value ax-numeric">{counts[s]}</span></div>
        ))}
      </div>
      <p className="ax-caption"><span className="ax-numeric">{published.length}</span> {t("ops.kpi.of", "of")} <span className="ax-numeric">{visits.length}</span> {t("ops.kpi.publishedLive", "visits are published and monitored live below.")}</p>

      {/* M08-017 — CSV export of the live monitoring, SLA and high-risk tables */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-200) var(--ax-space-300)" }}>
        <OpsExport datasets={exportDatasets} strings={exportStrings} />
      </div>

      {/* Region/city scope — filters monitoring, map and SLA watch (M08-010) */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <RegionCityFilter region={region} city={city} regions={regions} cities={cities} strings={monitoringStrings} />
      </div>

      {/* KSA operations map — M08-002 */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.map.heading", "KSA operations map (M08-002 · ENG-06)")}</h4>
        {pins.length === 0 ? (
          <div className="ax-state"><span className="ax-state__glyph">🗺</span><h4>{t("ops.map.empty.title", "No mappable factories in scope")}</h4>
            <p className="ax-caption">{t("ops.map.empty.desc", "Factories gain map positions when GIS Admin records official coordinates (FLD-FACT-005/006).")}</p></div>
        ) : (
          <OpsMap pins={pins} strings={mapStrings} />
        )}
      </div>

      <div className="ax-grid-2">
        <div className="ax-stack">
          {/* Live monitoring — M08-003 (auto-refresh via server action) */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.live.heading", "Live visit monitoring (M08-003)")}</h4>
            <MonitoringTable initialRows={monitorRows} initialAt={nowIso} region={region} city={city}
              enumLabels={enumLabels} strings={monitoringStrings} />
          </div>

          {/* SLA watch — ENG-09 thresholds vs live visit windows */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.sla.heading", "SLA watch (ENG-09)")}</h4>
            {slaFlags.length === 0 ? (
              <div className="ax-state"><span className="ax-state__glyph">✓</span><h4>{t("ops.sla.empty.title", "No SLA breaches in scope")}</h4>
                <p className="ax-caption">{t("ops.sla.empty.desc", "Published visits are inside their planned windows; breaches surface here the moment a window lapses.")}</p></div>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("ops.sla.th.visit", "Visit")}</th><th>{t("ops.sla.th.factory", "Factory")}</th><th>{t("ops.sla.th.operational", "Operational")}</th><th>{t("ops.sla.th.deadline", "Deadline")}</th><th>{t("ops.sla.th.sla", "SLA")}</th><th>{t("ops.sla.th.escalation", "Escalation")}</th></tr></thead>
                <tbody>{slaFlags.map(f => (
                  <tr key={f.visit.id}>
                    <td><a className="ax-link" href={`/visits/${f.visit.id}`}>{f.visit.id.slice(0, 8)}</a></td>
                    <td>{f.visit.factories
                      ? <a className="ax-link" href={`/factories/${f.visit.factories.id}`}>{f.visit.factories.name}</a>
                      : "—"}</td>
                    <td><span className="ax-lozenge ax-lozenge--ops">{enumLabel(f.visit.operational_state)}</span></td>
                    <td><span className="ax-numeric">{new Date(f.deadlineMs).toISOString().slice(0, 16).replace("T", " ")}</span></td>
                    <td><span className={`ax-lozenge ${f.kind === "reminder" ? "ax-lozenge--warning" : "ax-lozenge--critical"}`}>{slaKindLabel(f)}</span></td>
                    <td>{f.escalation
                      ? <span className={`ax-lozenge ${f.escalation === "L2" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>{f.escalation}</span>
                      : <span className="ax-caption">—</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
              {t("ops.sla.confNote", "Thresholds from engine_settings (ENG-09):")}{" "}
              {t("ops.sla.confCalendar", "calendar")} <span className="ax-numeric">{slaConf.calendar?.days ?? "—"} {slaConf.calendar?.hours ?? ""}</span> ·{" "}
              {t("ops.sla.confReview", "review")} <span className="ax-numeric">{slaConf.review_business_days ?? "—"}</span>{t("ops.sla.confBd", "bd")} ·{" "}
              {t("ops.sla.confResub", "resubmission")} <span className="ax-numeric">{slaConf.resubmission_business_days ?? "—"}</span>{t("ops.sla.confBd", "bd")} ·{" "}
              {t("ops.sla.confAction", "action due")} <span className="ax-numeric">{slaConf.action_due_calendar_days ?? "—"}</span>{t("ops.sla.confDays", "d")} ·{" "}
              {t("ops.sla.confReminders", "reminders at")} <span className="ax-numeric">{(slaConf.reminders ?? []).map(r => `${Math.round(r * 100)}%`).join(", ") || "—"}</span>
            </p>
          </div>

          {/* Corrective actions queue — SB12 write leg */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.actions.heading", "Corrective actions queue (M09-027 · ENG-11)")}</h4>
            {actions.length === 0 ? (
              <div className="ax-state"><span className="ax-state__glyph">✓</span><h4>{t("ops.actions.empty.title", "No open corrective actions")}</h4>
                <p className="ax-caption">{t("ops.actions.empty.desc", "Action forms raised from violations land here until closed (FLD-ACT-001).")}</p></div>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("ops.actions.th.factory", "Factory")}</th><th>{t("ops.actions.th.owner", "Owner")}</th><th>{t("ops.actions.th.due", "Due")}</th><th>{t("ops.actions.th.blocking", "Blocking")}</th><th>{t("ops.actions.th.status", "Status")}</th><th>{t("ops.actions.th.resolve", "Resolve")}</th></tr></thead>
                <tbody>{actions.map(a => {
                  const overdue = a.due_at ? new Date(a.due_at).getTime() < now : false;
                  const factory = a.inspections?.visits?.factories ?? null;
                  return (
                    <tr key={a.id}>
                      <td>{factory
                        ? <a className="ax-link" href={`/factories/${factory.id}`}>{factory.name}</a>
                        : "—"}<br />
                        {a.inspections?.visit_id && <a className="ax-link ax-caption" href={`/visits/${a.inspections.visit_id}`}>{visitWord} {a.inspections.visit_id.slice(0, 8)}</a>}</td>
                      <td>{a.owner_name ?? "—"}{a.owner_role && <span className="ax-caption"> · {a.owner_role}</span>}</td>
                      <td>{a.due_at
                        ? <span className={overdue ? "ax-lozenge ax-lozenge--critical" : "ax-numeric"}>{new Date(a.due_at).toISOString().slice(0, 10)}{overdue ? ` ${t("ops.actions.overdue", "overdue")}` : ""}</span>
                        : "—"}</td>
                      <td>{a.is_blocking ? <span className="ax-lozenge ax-lozenge--critical">{t("ops.actions.blocking", "blocking")}</span> : <span className="ax-lozenge">{t("ops.actions.advisory", "advisory")}</span>}</td>
                      <td><span className={`ax-lozenge ${a.status === "acknowledged" ? "ax-lozenge--info" : "ax-lozenge--warning"}`}>{enumLabel(a.status)}</span></td>
                      <td><ActionFormControls actionFormId={a.id} status={a.status} strings={actionControlStrings} /></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            )}
          </div>
        </div>

        <div className="ax-stack">
          {/* High-risk factory board — M08-006 (ENG-04 output) */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.risk.heading", "High-risk factories (M08-006 · ENG-04)")}</h4>
            {highRisk.length === 0 ? (
              <div className="ax-state"><span className="ax-state__glyph">◎</span><h4>{t("ops.risk.empty.title", "No scored factories yet")}</h4>
                <p className="ax-caption">{t("ops.risk.empty.desc", "Factories appear here once the risk engine records a score (FLD-FACT-007/008).")}</p></div>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("ops.risk.th.factory", "Factory")}</th><th>{t("ops.risk.th.location", "Location")}</th><th>{t("ops.risk.th.score", "Score")}</th><th>{t("ops.risk.th.band", "Band")}</th></tr></thead>
                <tbody>{highRisk.map(f => (
                  <tr key={f.id}>
                    <td><a className="ax-link" href={`/factories/${f.id}`}>{f.name}</a>
                      {f.activity_class && <><br /><span className="ax-caption">{f.activity_class}</span></>}</td>
                    <td className="ax-caption">{[f.region, f.city].filter(Boolean).join(" · ") || "—"}</td>
                    <td><span className="ax-numeric">{f.risk_score}</span></td>
                    <td>{f.risk_band
                      ? <span className={`ax-lozenge ${BAND_TONE[f.risk_band] ?? ""}`}>{enumLabel(f.risk_band)}</span>
                      : <span className="ax-caption">—</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>

          {/* Location events — M08-014 immutable */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.geo.heading", "Location events — immutable tracking history (M08-014)")}</h4>
            {geo.length === 0 ? (
              <div className="ax-state"><span className="ax-state__glyph">📍</span><h4>{t("ops.geo.empty.title", "No location events yet")}</h4>
                <p className="ax-caption">{t("ops.geo.empty.desc", "Check-ins, arrivals and telemetry are recorded append-only (FLD-GEO-*).")}</p></div>
            ) : (
              <ul className="ax-timeline">{geo.slice(0, 10).map((g, i) => (
                <li key={i} className={g.kind === "checkin" ? "is-key" : undefined}>
                  <div><strong>{enumLabel(g.kind)}</strong> ±{g.accuracy_m}m{" "}
                    {g.geofence_result && <span className={`ax-lozenge ${g.geofence_result === "inside" ? "ax-lozenge--success" : g.geofence_result === "override" ? "ax-lozenge--warning" : "ax-lozenge--critical"}`}>{enumLabel(g.geofence_result)}</span>}{" "}
                    <a className="ax-link ax-caption" href={`/visits/${g.visit_id}`}>{visitWord} {g.visit_id.slice(0, 8)}</a><br />
                    <span className="ax-timeline__meta ax-numeric">{new Date(g.occurred_at).toISOString().slice(0, 19).replace("T", " ")}</span></div>
                </li>
              ))}</ul>
            )}
          </div>

          {/* Notifications — ENG-11 */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("ops.notifs.heading", "Notifications (ENG-11 · REF-014)")}</h4>
            {notifs.length === 0 ? (
              <div className="ax-state"><span className="ax-state__glyph">🔔</span><h4>{t("ops.notifs.empty.title", "No notifications")}</h4>
                <p className="ax-caption">{t("ops.notifs.empty.desc", "Event-keyed messages queue here as workflow events fire (REF-014).")}</p></div>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("ops.notifs.th.event", "Event")}</th><th>{t("ops.notifs.th.channel", "Channel")}</th><th>{t("ops.notifs.th.state", "State")}</th><th>{t("ops.notifs.th.at", "At")}</th><th></th></tr></thead>
                <tbody>{notifs.map(n => (
                  <tr key={n.id}>
                    <td><span className="ax-lozenge ax-lozenge--info">{n.event_key}</span></td>
                    <td className="ax-caption">{n.channel}</td>
                    <td><span className={`ax-lozenge ${NOTIF_TONE[n.delivery_state] ?? ""}`}>{enumLabel(n.delivery_state)}</span></td>
                    <td><span className="ax-numeric">{new Date(n.created_at).toISOString().slice(5, 16).replace("T", " ")}</span></td>
                    <td>{n.delivery_state !== "handled" && <MarkNotificationHandled notificationId={n.id} strings={markHandledStrings} />}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
              {t("ops.notifs.rlsNote", "delivery_state exists in schema; RLS policy notif_own currently grants SELECT only — mark-handled surfaces the database verdict verbatim.")}
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
