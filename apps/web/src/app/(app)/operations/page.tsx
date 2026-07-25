import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/dates";
import {
  ActionFormControls, MarkNotificationHandled,
  type ActionFormControlsStrings, type MarkHandledStrings,
} from "./Controls";
import { MonitoringTable, type MonitoringStrings } from "./Monitoring";
import EmptyState from "@/components/EmptyState";
import { IconPin, IconBell } from "@/app/icons";
import OpsExport, { type ExportDataset, type OpsExportStrings } from "./OpsExport";
import OverrideQueue, { type GeoOverrideQueueRow, type OverrideQueueStrings } from "./OverrideQueue";
import CancellationQueue, { type CancellationQueueRow, type CancellationQueueStrings } from "./CancellationQueue";
import type { MonitorRow } from "./actions";
import type { GeoTone } from "@/components/GeoMap";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import { computeResubmissionFlags, type ResubmissionSource } from "./sla";
import { getVerifiedUser } from "@/lib/verified-user";
import { redirect } from "next/navigation";
import { buildShellNavigation } from "@/lib/shell-navigation";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";
import OperationsScopeFilter from "./OperationsScopeFilter";
import styles from "./operations.module.css";

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
  planner_lat: number | null;
  planner_lng: number | null;
  factories: FactoryEmbed;
  assignments: { profiles: { full_name: string } | null }[] | null;
};
// M3-DEC-PROJECTED-ROUTE-001 / M3-MAP-PROVENANCE-001 — observed_lat/observed_lng
// are additive SELECT columns on the existing geo_events ledger read (same
// request, same WHERE, same order, same pagination). They carry real position
// data already stored on the row; adding them does not filter or reorder the
// shared full ledger that latestGeofence depends on.
type GeoRow = {
  id: string; visit_id: string; kind: string; geofence_result: string | null;
  accuracy_m: number; occurred_at: string;
  observed_lat: number | null; observed_lng: number | null;
};
type PositionProvenance = "recorded" | "projected" | "unavailable";
type PositionResolution = {
  lat: number | null; lng: number | null; provenance: PositionProvenance;
  observedAt?: string; accuracyM?: number; scheduledAt?: string; coordinateSource?: "planner" | "factory";
};
// Permitted tier-1 kinds — override/deviation rows can never qualify as a
// recorded position (M3-MAP-PROVENANCE-001 §3). "as const" so the readonly
// tuple can be handed to Array.prototype.includes cleanly below.
const POSITION_KINDS = ["telemetry", "arrival", "checkin"] as const;
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
type OverrideRow = {
  id: string; visit_id: string; status: string; reason_label: string; explanation: string;
  safety_security_exception: boolean; observed_lat: number; observed_lng: number;
  accuracy_m: number; distance_m: number; device_occurred_at: string; requested_at: string; expires_at: string;
  visits: { factories: { name: string } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
};

const NOTIF_TONE: Record<string, string> = {
  queued: "sq-lozenge--warning",
  sent: "sq-lozenge--info",
  delivered: "sq-lozenge--info",
  handled: "sq-lozenge--success",
  failed: "sq-lozenge--critical",
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

export default async function Operations({ searchParams }: { searchParams: Promise<{ region?: string; city?: string; view?: string }> }) {
  preloadShell("/operations");
  const sp = await searchParams;
  const region = typeof sp.region === "string" ? sp.region : "";
  const city = typeof sp.city === "string" ? sp.city : "";
  const view = sp.view === "performance" ? "performance" : "map";
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  // DSG-CMD-020 — direct-route authorization must be identical to the accepted
  // shared navigation contract. Derive it from the same builder instead of
  // creating a second, narrower role list that can drift from the shell.
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
      <Shell current="/operations" title={t("ops.title", "Operations Center")}>
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
  // A page GET is read-only. Use one request-start timestamp to exclude elapsed
  // requests from the actionable queue without materializing workflow state.
  // decide_geo_override remains the database-authoritative race guard.
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const [visitsRes, geoRes, actionsRes, notifsRes, factoriesRes, engineRes, riskRes, overrideRes, overrideEvidenceRes] = await Promise.all([
    // KPI counts by operational_state span ALL visits — operational state is its own
    // domain (FND-002); filtering by planning_status here previously zeroed the cards.
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, planner_lat, planner_lng, factories(id, name, region, city), assignments(profiles(full_name))")
      .order("window_start", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
    // M08-014 location history must not silently disappear once the table
    // exceeds an arbitrary recent-row limit. Page the immutable ledger using a
    // stable order, then scope it to the monitored visits below. UNCHANGED
    // WHERE/order/pagination — latestGeofence needs the full ledger including
    // override/deviation rows; observed_lat/observed_lng are additive columns
    // only, read by the separate in-memory positionGeo derivation below.
    collectPostgrestPages<GeoRow>((from, to) => sb.from("geo_events")
      .select("id, visit_id, kind, geofence_result, accuracy_m, occurred_at, observed_lat, observed_lng")
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<GeoRow>>),
    // Corrective actions queue (M09-027 blocking flag; DEC-003 due default 14d)
    collectPostgrestPages<ActionRow>((from, to) => sb.from("action_forms")
      .select("id, form_type, owner_name, owner_role, due_at, status, is_blocking, required_correction, inspections(visit_id, visits(factories(id, name)))")
      .neq("status", "closed")
      .order("due_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<ActionRow>>),
    // ENG-11 notification outbox — latest 20
    sb.from("notifications")
      .select("id, event_key, channel, delivery_state, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    // Factory master for the KSA map + region/city options (M08-002/010)
    collectPostgrestPages<FactoryRow>((from, to) => sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class")
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    // ENG-06/ENG-09 configuration — geofence default + SLA thresholds
    // (+ engine_settings.field for governed cancellation reason labels, 0020)
    sb.from("engine_settings").select("engine, settings").in("engine", ["gis", "sla", "field"]),
    // M08-006 — high-risk factory board (ENG-04 output, top scores)
    sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class")
      .not("risk_score", "is", null)
      .order("risk_score", { ascending: false })
      .limit(8),
    // M04-043 / RBAC-008 — only Operations sees pending requests through RLS.
    sb.from("geo_override_requests")
      .select("id, visit_id, status, reason_label, explanation, safety_security_exception, observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at, requested_at, expires_at, visits(factories(name), assignments(profiles(full_name)))")
      .eq("status", "pending")
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: true }),
    sb.from("evidence")
      .select("linked_id, storage_path")
      .eq("linked_type", "geo_override").eq("evidence_type", "photo"),
  ]);

  const loadErrors = [
    visitsRes.error && "visit monitoring",
    geoRes.error && "geofence events",
    actionsRes.error && "corrective actions",
    notifsRes.error && "notifications",
    factoriesRes.error && "factory list",
    engineRes.error && "engine settings",
    riskRes.error && "risk board",
    overrideRes.error && "location exception requests",
    overrideEvidenceRes.error && "override evidence",
  ].filter(Boolean) as string[];
  if (visitsRes.error) console.error(`[operations] visits read failed: ${visitsRes.error.message}`);
  if (geoRes.error) console.error(`[operations] geo_events read failed: ${geoRes.error.message}`);
  if (actionsRes.error) console.error(`[operations] action_forms read failed: ${actionsRes.error.message}`);
  if (notifsRes.error) console.error(`[operations] notifications read failed: ${notifsRes.error.message}`);
  if (factoriesRes.error) console.error(`[operations] factories read failed: ${factoriesRes.error.message}`);
  if (engineRes.error) console.error(`[operations] engine_settings read failed: ${engineRes.error.message}`);
  if (riskRes.error) console.error(`[operations] risk read failed: ${riskRes.error.message}`);
  if (overrideRes.error) console.error(`[operations] override queue read failed: ${overrideRes.error.message}`);
  if (overrideEvidenceRes.error) console.error(`[operations] override evidence read failed: ${overrideEvidenceRes.error.message}`);

  const visits = (visitsRes.data ?? []) as unknown as VisitRow[];
  const geo = (geoRes.data ?? []) as unknown as GeoRow[];
  const actions = (actionsRes.data ?? []) as unknown as ActionRow[];
  const notifs = (notifsRes.data ?? []) as unknown as NotifRow[];
  const factories = (factoriesRes.data ?? []) as unknown as FactoryRow[];
  const engines = (engineRes.data ?? []) as unknown as EngineRow[];
  const highRisk = (riskRes.data ?? []) as unknown as FactoryRow[];
  const overrides = (overrideRes.data ?? []) as unknown as OverrideRow[];
  const evidenceByRequest = new Map<string, number>();
  const evidenceUrls = new Map<string, string>();
  const overrideIds = new Set(overrides.map(row => row.id));
  const overrideEvidence = (overrideEvidenceRes.data ?? []) as { linked_id: string; storage_path: string | null }[];
  for (const evidence of overrideEvidence) {
    evidenceByRequest.set(evidence.linked_id, (evidenceByRequest.get(evidence.linked_id) ?? 0) + 1);
  }
  await Promise.all(overrideEvidence
    .filter(evidence => overrideIds.has(evidence.linked_id) && !!evidence.storage_path)
    .map(async evidence => {
      const { data: signed } = await sb.storage.from("evidence").createSignedUrl(evidence.storage_path!, 600);
      if (signed?.signedUrl && !evidenceUrls.has(evidence.linked_id)) evidenceUrls.set(evidence.linked_id, signed.signedUrl);
    }));
  const overrideQueueRows: GeoOverrideQueueRow[] = overrides.map(row => ({
    id: row.id, visit_id: row.visit_id, reason_label: row.reason_label, explanation: row.explanation,
    safety_security_exception: row.safety_security_exception, observed_lat: Number(row.observed_lat), observed_lng: Number(row.observed_lng),
    accuracy_m: Number(row.accuracy_m), distance_m: Number(row.distance_m), device_occurred_at: row.device_occurred_at,
    requested_at: row.requested_at, expires_at: row.expires_at, evidence_count: evidenceByRequest.get(row.id) ?? 0,
    evidence_url: evidenceUrls.get(row.id) ?? null,
    factory_name: row.visits?.factories?.name ?? null,
    inspector_name: row.visits?.assignments?.[0]?.profiles?.full_name ?? null,
  }));

  // Governed cancellation reason labels (engine_settings.field, 0020 seed) —
  // labels are configuration data, localized from the config itself.
  const fieldCfg = (engines.find(e => e.engine === "field")?.settings ?? {}) as
    { cancellation_reasons?: { key: string; en: string; ar?: string }[] };
  const fieldCfgReasons = (fieldCfg.cancellation_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));

  // TASK-EXECUTION-MODULE-001 · Phase 4B — active-session cancellation queue
  // (plan §12). Tolerant read: while migration 20260721140000 is unapplied the
  // probe fails and the queue simply renders empty — the page never breaks.
  type CancellationReqRow = {
    id: string; visit_id: string; phase: string; reason_key: string; comment: string | null;
    evidence_id: string | null; requested_at: string;
    visits: { factories: { name: string } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
  };
  let cancellationQueueRows: CancellationQueueRow[] = [];
  {
    const { data: cancelRows, error: cancelError } = await sb.from("cancellation_requests")
      .select("id, visit_id, phase, reason_key, comment, evidence_id, requested_at, visits(factories(name), assignments(profiles(full_name)))")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });
    if (cancelError) {
      // Expected pre-migration (table absent) — degrade silently to an empty queue.
      if (!cancelError.message.includes("cancellation_requests")) {
        console.error(`[operations] cancellation queue read failed: ${cancelError.message}`);
        loadErrors.push("cancellation requests");
      }
    } else {
      const rows = (cancelRows ?? []) as unknown as CancellationReqRow[];
      const reasonLabels = new Map<string, string>();
      for (const r of fieldCfgReasons) reasonLabels.set(r.key, r.label);
      const evidenceIds = rows.map(r => r.evidence_id).filter((v): v is string => !!v);
      const cancelEvidenceUrls = new Map<string, string>();
      if (evidenceIds.length > 0) {
        const { data: cancelEvidence } = await sb.from("evidence")
          .select("id, storage_path").in("id", evidenceIds);
        await Promise.all(((cancelEvidence ?? []) as { id: string; storage_path: string | null }[])
          .filter(evidence => !!evidence.storage_path)
          .map(async evidence => {
            const { data: signed } = await sb.storage.from("evidence").createSignedUrl(evidence.storage_path!, 600);
            if (signed?.signedUrl) cancelEvidenceUrls.set(evidence.id, signed.signedUrl);
          }));
      }
      cancellationQueueRows = rows.map(row => ({
        id: row.id, visit_id: row.visit_id, phase: row.phase,
        reason_label: reasonLabels.get(row.reason_key) ?? row.reason_key,
        comment: row.comment, requested_at: row.requested_at,
        factory_name: row.visits?.factories?.name ?? null,
        inspector_name: row.visits?.assignments?.[0]?.profiles?.full_name ?? null,
        evidence_url: row.evidence_id ? cancelEvidenceUrls.get(row.evidence_id) ?? null : null,
      }));
    }
  }

  // TASK-EXECUTION-MODULE-001 · Phase 6 — resubmission SLA over RETURNED
  // inspections (plan §22, D-022). Display-only, same pattern as the review
  // queue SLA: deadline = latest decided Return + resubmission_business_days
  // working days from the configured calendar; no escalation writes.
  type ReturnedRow = {
    id: string; visit_id: string;
    reviews: { decision: string | null; decided_at: string | null }[] | null;
    visits: { factories: { name: string; region: string | null; city: string | null } | null } | null;
  };
  let resubmissionSources: ResubmissionSource[] = [];
  {
    const { data: returnedRows, error: returnedError } = await sb.from("inspections")
      .select("id, visit_id, reviews(decision, decided_at), visits(factories(name, region, city))")
      .eq("status", "returned");
    if (returnedError) {
      console.error(`[operations] returned-inspection SLA read failed: ${returnedError.message}`);
      loadErrors.push("resubmission deadlines");
    } else {
      resubmissionSources = ((returnedRows ?? []) as unknown as ReturnedRow[])
        .map(row => {
          const decided = (row.reviews ?? [])
            .filter(r => r.decision === "return" && !!r.decided_at)
            .map(r => r.decided_at!)
            .sort()
            .pop();
          if (!decided) return null;
          const f = row.visits?.factories ?? null;
          if (region && f?.region !== region) return null;
          if (city && f?.city !== city) return null;
          return { inspection_id: row.id, visit_id: row.visit_id, factory_name: f?.name ?? null, returned_at: decided };
        })
        .filter((x): x is ResubmissionSource => !!x);
    }
  }

  const gisConf = (engines.find(e => e.engine === "gis")?.settings ?? {}) as { geofence_default_radius_m?: number };
  const slaConf = (engines.find(e => e.engine === "sla")?.settings ?? {}) as SlaConf;

  // TASK-EXECUTION-MODULE-001 · Phase 7 (§29) — the bucket list spans the full
  // canonical stored vocabulary: 'prepared' (≡ Ready for Execution, D-002) and
  // 'under_review' (Phase 1/6 values) included; display-layer only.
  const states = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted", "under_review"] as const;
  const counts = Object.fromEntries(states.map(s => [s, visits.filter(v => v.operational_state === s).length]));
  // M08-010 — region/city scope for monitoring + map + SLA watch. An active
  // operational journey remains observable even if its planning window has
  // since lapsed: planning_status and operational_state are separate state
  // machines (FND-002), and expiry must not make an inspector disappear from
  // Operations while on_the_way/arrived/executing.
  const published = visits.filter(v => v.planning_status === "published");
  const monitored = visits.filter(v =>
    (v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)) &&
    (!region || v.factories?.region === region) && (!city || v.factories?.city === city));
  const monitoredVisitIds = new Set(monitored.map(v => v.id));
  const scopedGeo = geo.filter(g => monitoredVisitIds.has(g.visit_id));

  // Latest geofence result per visit (geo list already newest-first) — M08-014
  const latestGeofence = new Map<string, string>();
  for (const g of scopedGeo) {
    if (g.geofence_result && !latestGeofence.has(g.visit_id)) latestGeofence.set(g.visit_id, g.geofence_result);
  }
  const enumLabel = (value: string) => t(`enum.${value}`, value.replace(/_/g, " "));

  // M3-MAP-PROVENANCE-001 — a separate, in-memory-only subset of the SAME
  // already-fetched full `geo` ledger, scoped to monitored visits and
  // restricted to permitted position kinds. Does not mutate or filter `geo`
  // or `scopedGeo` (latestGeofence above still reads the unfiltered ledger,
  // including override/deviation rows). Sorted as a fresh copy — occurred_at
  // descending, then id descending as the deterministic tiebreak — so the
  // first-seen row per visit is unambiguously the latest.
  const positionGeo = geo
    .filter(g => monitoredVisitIds.has(g.visit_id) && (POSITION_KINDS as readonly string[]).includes(g.kind))
    .slice()
    .sort((a, b) => {
      const byTime = Date.parse(b.occurred_at) - Date.parse(a.occurred_at);
      return byTime !== 0 ? byTime : (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
    });
  const latestPositionByVisit = new Map<string, GeoRow>();
  for (const g of positionGeo) {
    if (!latestPositionByVisit.has(g.visit_id)) latestPositionByVisit.set(g.visit_id, g);
  }

  /** Tier 1 (recorded) → tier 2 (projected from assignment/schedule) → tier 3
   * (unavailable). Never drops the entity — callers keep it in the list with
   * lat/lng null and provenance "unavailable" rather than filtering it out. */
  function resolveVisitPosition(v: VisitRow, f: FactoryRow | undefined): PositionResolution {
    const recorded = latestPositionByVisit.get(v.id);
    if (recorded && recorded.observed_lat != null && recorded.observed_lng != null) {
      return {
        lat: Number(recorded.observed_lat), lng: Number(recorded.observed_lng), provenance: "recorded",
        observedAt: recorded.occurred_at, accuracyM: recorded.accuracy_m ?? undefined,
      };
    }
    const hasAssignment = (v.assignments?.length ?? 0) > 0;
    const plannerLat = v.planner_lat, plannerLng = v.planner_lng;
    const factoryLat = f?.official_lat ?? null, factoryLng = f?.official_lng ?? null;
    const coordLat = plannerLat ?? factoryLat;
    const coordLng = plannerLng ?? factoryLng;
    if (hasAssignment && v.window_start && coordLat != null && coordLng != null) {
      return {
        lat: Number(coordLat), lng: Number(coordLng), provenance: "projected",
        scheduledAt: v.window_start,
        coordinateSource: plannerLat != null && plannerLng != null ? "planner" : "factory",
      };
    }
    return { lat: null, lng: null, provenance: "unavailable" };
  }

  // ---------- ENG-09 SLA watch: engine thresholds vs live visit windows ----------
  const slaFlags = computeSlaFlags(monitored, slaConf, now);
  // Phase 6 (§22, D-022) — resubmission deadlines for returned inspections
  // (display-only). Absent config → honest "SLA unavailable", never invented.
  const resubSlaAvailable = typeof slaConf.resubmission_business_days === "number";
  const resubFlags = computeResubmissionFlags(resubmissionSources, slaConf, now);

  // ---------- M08-002 KSA map scope ----------
  const scopedFactories = factories.filter(f =>
    (!region || f.region === region) && (!city || f.city === city));
  const gisDefault = typeof gisConf.geofence_default_radius_m === "number" ? gisConf.geofence_default_radius_m : undefined;

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
    thOperational: t("ops.live.th.operational", "Visit status"),
    thGeofence: t("ops.live.th.geofence", "Geofence"),
    thInspector: t("ops.live.th.inspector", "Inspector"),
    emptyTitle: t("ops.live.empty.title", "No published visits to monitor"),
    emptyDesc: t("ops.live.empty.desc", "Visits appear here once planning publishes them (FLD-VIS-005)."),
    refreshedAt: t("ops.live.refreshedAt", "Refreshed"),
    refreshing: t("ops.live.refreshing", "Refreshing…"),
    autoNote: t("ops.live.scopeNote", "RLS-scoped monitoring records"),
  };
  const mapWorkspaceStrings: OperationsMapWorkspaceStrings = {
    mapLabel: t("ops.map.workspaceLabel", "Operations map"),
    loadingTitle: t("ops.map.loading.title", "Loading KSA map"),
    loadingBody: t("ops.map.loading.body", "Mapbox renders in the browser only."),
    listHeading: t("ops.map.list.heading", "Map records"),
    listDescription: t("ops.map.list.description", "The list and map use the same RLS-scoped records."),
    emptyTitle: t("ops.map.empty.title", "No mappable factories in scope"),
    emptyBody: t("ops.map.empty.desc", "Factories gain map positions when GIS Admin records official coordinates (FLD-FACT-005/006)."),
    open: t("ops.map.open", "Open"),
    selected: t("ops.map.selected", "Selected on map and list"),
    factory: t("ops.map.factory", "Factory 360"),
    visit: t("ops.map.visit", "visit"),
    preview: t("ops.map.preview", "Preview"),
    provenanceRecorded: t("ops.map.provenance.recorded", "Last recorded GPS — not guaranteed live"),
    provenanceProjected: t("ops.map.provenance.projected", "Projected from assignment/schedule — not live GPS"),
    provenanceUnavailable: t("ops.map.provenance.unavailable", "Location unavailable — no recorded GPS and no assignment/factory coordinate available"),
    previewStrings: {
      inspectorTitle: t("ops.preview.inspector", "Inspector preview"),
      factoryTitle: t("ops.preview.factory", "Factory quick card"),
      close: t("ops.preview.close", "Close preview"),
      currentVisit: t("ops.preview.currentVisit", "Current visit"),
      operationalState: t("ops.preview.operationalState", "Operational state"),
      assignments: t("ops.preview.assignments", "Assignments in current scope"),
      lastGeoEvent: t("ops.preview.lastGeoEvent", "Last geo event"),
      noGeoEvent: t("ops.preview.noGeoEvent", "No recorded position"),
      openVisit: t("ops.preview.openVisit", "Open full visit"),
      location: t("ops.preview.location", "Location"),
      riskScore: t("ops.preview.riskScore", "Raw risk score"),
      riskRank: t("ops.preview.riskRank", "RLS-visible rank"),
      riskUnavailable: t("ops.preview.riskUnavailable", "Unavailable"),
      activeVisits: t("ops.preview.activeVisits", "Active visits"),
      openActions: t("ops.preview.openActions", "Open corrective actions"),
      openFactory: t("ops.preview.openFactory", "Open Factory 360"),
    },
  };
  const overrideQueueStrings: OverrideQueueStrings = {
    heading: t("ops.override.heading", "Location exception requests"),
    caption: t("ops.override.caption", "Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes."),
    emptyTitle: t("ops.override.empty.title", "No override approvals pending"),
    emptyDesc: t("ops.override.empty.desc", "Outside-fence requests with their evidence appear here for Operations review."),
    factory: t("ops.override.factory", "Factory"), inspector: t("ops.override.inspector", "Inspector"),
    captured: t("ops.override.captured", "Captured"), accuracy: t("ops.override.accuracy", "Accuracy"),
    distance: t("ops.override.distance", "Distance"), evidence: t("ops.override.evidence", "Photo evidence"),
    safetyException: t("ops.override.safetyException", "Safety/security photo exception declared"), expires: t("ops.override.expires", "Expires"),
    viewEvidence: t("ops.override.viewEvidence", "View photo"), evidenceUnavailable: t("ops.override.evidenceUnavailable", "photo link unavailable"),
    approve: t("ops.override.approve", "Approve override"), reject: t("ops.override.reject", "Reject"),
    rejectReason: t("ops.override.rejectReason", "Rejection reason (mandatory to reject)"),
    deciding: t("ops.override.deciding", "Saving decision…"), decided: t("ops.override.decided", "Decision saved and the queue will refresh."),
    failure: t("ops.override.failure", "The decision could not be saved. Nothing changed."),
  };
  const cancellationQueueStrings: CancellationQueueStrings = {
    heading: t("ops.cancellation.heading", "Cancellation requests"),
    caption: t("ops.cancellation.caption", "Active-session cancellation requests from inspectors. Approval is terminal: the visit is cancelled, captured responses, evidence and location history are preserved for audit, and the assignment is freed. The requester cannot decide their own request."),
    emptyTitle: t("ops.cancellation.empty.title", "No cancellation requests pending"),
    emptyDesc: t("ops.cancellation.empty.desc", "Cancellation requests filed during a journey or inspection appear here for Operations review."),
    factory: t("ops.cancellation.factory", "Factory"), inspector: t("ops.cancellation.inspector", "Inspector"),
    phase: t("ops.cancellation.phase", "Phase"), requested: t("ops.cancellation.requested", "Requested"),
    evidence: t("ops.cancellation.evidence", "Evidence"), viewEvidence: t("ops.cancellation.viewEvidence", "View"),
    approve: t("ops.cancellation.approve", "Approve cancellation"), reject: t("ops.cancellation.reject", "Reject"),
    rejectReason: t("ops.cancellation.rejectReason", "Rejection reason (mandatory to reject)"),
    confirmTitle: t("ops.cancellation.confirmTitle", "Approve this cancellation?"),
    confirmBody: t("ops.cancellation.confirmBody", "This is terminal: the visit is cancelled and cannot be reopened. Everything captured so far is preserved for audit."),
    confirmApprove: t("ops.cancellation.confirmApprove", "Confirm — cancel the visit"),
    confirmBack: t("ops.cancellation.confirmBack", "Back"),
    deciding: t("ops.cancellation.deciding", "Saving decision…"),
    decided: t("ops.cancellation.decided", "Decision saved and the queue will refresh."),
    failure: t("ops.cancellation.failure", "The decision could not be saved. Nothing changed."),
  };

  const slaKindLabel = (f: SlaFlag) =>
    f.kind === "overdue_start" ? t("ops.sla.overdueStart", "Overdue to start")
      : f.kind === "overdue_submit" ? t("ops.sla.overdueSubmit", "Overdue to submit")
        : `${t("ops.sla.reminder", "Reminder")} ${f.pct}%`;

  // ---------- M08-017 CSV export — three tables, region/city scope honored ----------
  const fmtTs = (ms: number) => formatDateTime(ms, locale === "ar" ? "ar" : "en");
  const rankedFactories = scopedFactories
    .filter(factory => factory.risk_score != null)
    .sort((a, b) => Number(b.risk_score) - Number(a.risk_score));
  const riskRankByFactory = new Map(rankedFactories.map((factory, index) => [factory.id, index + 1]));
  const activeCountForFactory = (factoryId: string) => monitored.filter(visit =>
    (visit.factories?.id ?? visit.factory_id) === factoryId).length;
  const actionCountForFactory = (factoryId: string) => actions.filter(action =>
    action.inspections?.visits?.factories?.id === factoryId).length;
  const previewFields = (factory: FactoryRow | undefined, visit: VisitRow | undefined) => {
    const inspectorName = visit?.assignments?.[0]?.profiles?.full_name ?? null;
    const latestGeoEvent = visit ? scopedGeo.find(event => event.visit_id === visit.id) : null;
    return {
      factoryId: factory?.id ?? visit?.factories?.id ?? visit?.factory_id ?? null,
      factoryName: factory?.name ?? visit?.factories?.name ?? "—",
      region: factory?.region ?? visit?.factories?.region ?? null,
      city: factory?.city ?? visit?.factories?.city ?? null,
      visitId: visit?.id ?? null,
      inspectorName,
      assignmentCount: inspectorName
        ? monitored.filter(item => item.assignments?.[0]?.profiles?.full_name === inspectorName).length
        : 0,
      lastGeoAt: latestGeoEvent ? fmtTs(Date.parse(latestGeoEvent.occurred_at)) : null,
      riskScore: factory?.risk_score ?? null,
      riskRank: factory ? riskRankByFactory.get(factory.id) ?? null : null,
      riskRankTotal: rankedFactories.length,
      activeVisitCount: factory ? activeCountForFactory(factory.id) : 0,
      openActionCount: factory ? actionCountForFactory(factory.id) : 0,
    };
  };
  // M3-MAP-PROVENANCE-001 — built from the full monitored/scoped source
  // entities (not from a coordinate-prefiltered pins array), so a tier-3
  // (unavailable) entity is included with lat/lng null rather than dropped.
  // OperationsMapWorkspace's own mappedEntries derivation is what keeps
  // coordinate-less entries off the map while the synchronized list still
  // renders every one of them.
  const mapEntries: OperationsMapEntry[] = [];
  const pinnedFactoryIds = new Set<string>();
  for (const v of monitored) {
    const tone = ACTIVE_TONE[v.operational_state];
    if (!tone) continue;
    const factory = scopedFactories.find(x => x.id === (v.factories?.id ?? v.factory_id));
    if (factory) pinnedFactoryIds.add(factory.id);
    const position = resolveVisitPosition(v, factory);
    mapEntries.push({
      id: `v:${v.id}`, kind: "visit",
      lat: position.lat, lng: position.lng,
      label: factory ? `${factory.name} · ${enumLabel(v.operational_state)}` : enumLabel(v.operational_state),
      tone, radiusM: factory?.geofence_radius_m ?? gisDefault,
      href: `/visits/${v.id}`,
      provenance: position.provenance,
      observedAt: position.observedAt, accuracyM: position.accuracyM,
      scheduledAt: position.scheduledAt, coordinateSource: position.coordinateSource,
      ...previewFields(factory, v),
      state: enumLabel(v.operational_state),
    });
  }
  for (const factory of scopedFactories) {
    if (pinnedFactoryIds.has(factory.id)) continue;
    const hasCoord = factory.official_lat != null && factory.official_lng != null;
    mapEntries.push({
      id: `f:${factory.id}`, kind: "factory",
      lat: hasCoord ? Number(factory.official_lat) : null,
      lng: hasCoord ? Number(factory.official_lng) : null,
      label: factory.name, tone: "neutral",
      href: `/factories/${factory.id}`,
      // Factory pins are static official-record coordinates, never a
      // GPS-derived tier — "recorded" here means "on file," distinct from
      // the visit-position recorded/projected/unavailable GPS semantics.
      provenance: hasCoord ? "recorded" : "unavailable",
      ...previewFields(factory, undefined),
      state: t("ops.map.factoryState", "Factory"),
    });
  }
  const regionalMapEntries: OperationsMapEntry[] = scopedFactories.map(factory => {
    const hasCoord = factory.official_lat != null && factory.official_lng != null;
    return {
      id: `regional:${factory.id}`,
      kind: "factory",
      lat: hasCoord ? Number(factory.official_lat) : null,
      lng: hasCoord ? Number(factory.official_lng) : null,
      label: factory.name,
      tone: "neutral",
      href: `/factories/${factory.id}`,
      provenance: hasCoord ? "recorded" : "unavailable",
      ...previewFields(factory, undefined),
      state: t("ops.map.factoryState", "Factory"),
    };
  });
  const scopedQuery = [
    region ? `region=${encodeURIComponent(region)}` : "",
    city ? `city=${encodeURIComponent(city)}` : "",
  ].filter(Boolean).join("&");
  const mapViewHref = `/operations${scopedQuery ? `?${scopedQuery}` : ""}`;
  const performanceViewHref = `/operations?${["view=performance", scopedQuery].filter(Boolean).join("&")}`;
  const performanceAnchor = (anchor: string) => `${performanceViewHref}#${anchor}`;
  const overdueActions = actions.filter(action => action.due_at && Date.parse(action.due_at) < now);
  const failedNotifications = notifs.filter(notification => notification.delivery_state === "failed");
  const highlights = [
    ...slaFlags.map(flag => ({
      id: `sla:${flag.visit.id}`,
      label: t("ops.highlights.sla", "Deadline breach"),
      description: `${flag.visit.factories?.name ?? flag.visit.id.slice(0, 8)} · ${slaKindLabel(flag)}`,
      at: flag.deadlineMs,
      href: `/visits/${flag.visit.id}`,
      evidenceUrl: null as string | null,
    })),
    ...overdueActions.map(action => ({
      id: `action:${action.id}`,
      label: t("ops.highlights.action", "Corrective action overdue"),
      description: `${action.inspections?.visits?.factories?.name ?? action.owner_name ?? action.id.slice(0, 8)} · ${action.required_correction ?? enumLabel(action.status)}`,
      at: action.due_at ? Date.parse(action.due_at) : 0,
      href: action.inspections?.visit_id ? `/visits/${action.inspections.visit_id}` : performanceAnchor("corrective-actions"),
      evidenceUrl: null as string | null,
    })),
    ...failedNotifications.map(notification => ({
      id: `notification:${notification.id}`,
      label: t("ops.highlights.notification", "Notification failed"),
      description: `${notification.event_key} · ${notification.channel}`,
      at: Date.parse(notification.created_at),
      href: performanceAnchor("notifications"),
      evidenceUrl: null as string | null,
    })),
    ...overrideQueueRows.map(item => ({
      id: `override:${item.id}`,
      label: t("ops.highlights.override", "Override decision required"),
      description: `${item.factory_name ?? item.visit_id.slice(0, 8)} · ${item.inspector_name ?? "—"}`,
      at: Date.parse(item.requested_at),
      href: `/visits/${item.visit_id}`,
      evidenceUrl: item.evidence_url,
    })),
    ...cancellationQueueRows.map(item => ({
      id: `cancellation:${item.id}`,
      label: t("ops.highlights.cancellation", "Cancellation decision required"),
      description: `${item.factory_name ?? item.visit_id.slice(0, 8)} · ${item.reason_label}`,
      at: Date.parse(item.requested_at),
      href: `/visits/${item.visit_id}`,
      evidenceUrl: item.evidence_url,
    })),
  ].sort((a, b) => b.at - a.at);
  const regionSummaries = regions.map(regionName => {
    const regionFactories = factories.filter(factory => factory.region === regionName);
    const regionVisits = visits.filter(visit => visit.factories?.region === regionName);
    const active = regionVisits.filter(visit =>
      visit.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(visit.operational_state));
    return {
      name: regionName,
      factories: regionFactories.length,
      active: active.length,
      href: `/operations?view=performance&region=${encodeURIComponent(regionName)}`,
    };
  });
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
        t("ops.live.th.operational", "Visit status"), t("ops.live.th.geofence", "Geofence"),
        t("ops.live.th.inspector", "Inspector"),
      ],
      rows: monitorRows.map(r => [
        r.id.slice(0, 8), r.factory_name ?? "—", enumLabel(r.operational_state),
        r.geofence ? enumLabel(r.geofence) : "—", r.inspector ?? "—",
      ]),
    },
    {
      key: "sla",
      label: t("ops.export.sla", "Deadline alerts"),
      filename: "ops_sla_watch.csv",
      headers: [
        t("ops.sla.th.visit", "Visit"), t("ops.sla.th.factory", "Factory"),
        t("ops.sla.th.operational", "Visit status"), t("ops.sla.th.deadline", "Deadline"),
        t("ops.sla.th.sla", "Deadline status"), t("ops.sla.th.escalation", "Escalation"),
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
      context={<span className="sq-lozenge sq-lozenge--info">{t("ops.context", "National inspection activity and decisions")}</span>}>
      {loadErrors.length > 0 && (
        <div className="sq-banner sq-banner--critical" role="alert"><div>
          <strong>{t("ops.err.partial", "Some information could not be loaded.")}</strong> {loadErrors.join(" · ")} — {t("ops.err.retry", "retry")}.
        </div></div>
      )}

      <div className={styles.page}>
        <nav className={styles.viewSwitch} aria-label={t("ops.views.label", "Operations Center views")}>
          <a
            className={`${styles.viewLink} ${view === "map" ? styles.viewLinkActive : ""}`}
            href={mapViewHref}
            aria-current={view === "map" ? "page" : undefined}
          >
            {t("ops.views.map", "Operations Map")}
          </a>
          <a
            className={`${styles.viewLink} ${view === "performance" ? styles.viewLinkActive : ""}`}
            href={performanceViewHref}
            aria-current={view === "performance" ? "page" : undefined}
          >
            {t("ops.views.performance", "National Performance")}
          </a>
        </nav>

        <section aria-labelledby="operations-kpi-heading">
          <div className={styles.sectionHead}>
            <div>
              <h3 id="operations-kpi-heading">{t("ops.kpi.heading", "Operational position")}</h3>
              <p className="sq-caption">
                {t("ops.kpi.scope", "Current RLS-authorized region and city scope")}
              </p>
            </div>
          </div>
          <div className={styles.kpiGrid} data-testid="operations-kpi-grid">
            <article className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{t("ops.kpi.activeVisits", "Active Visits")}</div>
              <div className={`${styles.kpiValue} sq-numeric`}>{monitored.length}</div>
              <p className={styles.kpiNote}>{t("ops.kpi.activeNote", "Published or actively executing")}</p>
            </article>
            <article className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{t("ops.kpi.onTheWay", "On the Way")}</div>
              <div className={`${styles.kpiValue} sq-numeric`}>{counts.on_the_way}</div>
              <p className={styles.kpiNote}>{t("ops.kpi.operationalState", "Canonical operational state")}</p>
            </article>
            <article className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{t("ops.kpi.executing", "Executing")}</div>
              <div className={`${styles.kpiValue} sq-numeric`}>{counts.executing}</div>
              <p className={styles.kpiNote}>{t("ops.kpi.operationalState", "Canonical operational state")}</p>
            </article>
            <article className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{t("ops.kpi.submittedToday", "Submitted Today")}</div>
              <div className={styles.kpiValue}>
                {t("ops.kpi.unavailable", "Unavailable — decision required")}
              </div>
              <p className={styles.kpiNote}>{t("ops.kpi.submittedDecision", "Grain, source and Riyadh day boundary require sponsor decision")}</p>
            </article>
            <article className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{t("ops.kpi.activeAlerts", "Active Alerts")}</div>
              <div className={styles.kpiValue}>
                {t("ops.kpi.unavailable", "Unavailable — decision required")}
              </div>
              <p className={styles.kpiNote}>{t("ops.kpi.alertDecision", "Taxonomy and deduplication require sponsor decision")}</p>
            </article>
          </div>
          <p className={styles.decisionContext}>
            <span>{t("ops.kpi.submittedContext", "Submitted Today: distinct visits vs inspections vs versions remains open.")}</span>
            <span>
              {t("ops.kpi.alertContext", "Alert source context:")}{" "}
              <a className="sq-link" href={performanceAnchor("deadline-alerts")}>{t("ops.kpi.slaBreaches", "SLA breaches")} <span className="sq-numeric">{slaFlags.length}</span></a>{" · "}
              <a className="sq-link" href={performanceAnchor("corrective-actions")}>{t("ops.kpi.actionsOverdue", "actions overdue")} <span className="sq-numeric">{overdueActions.length}</span></a>{" · "}
              <a className="sq-link" href={performanceAnchor("notifications")}>{t("ops.kpi.notificationsFailed", "notifications failed")} <span className="sq-numeric">{failedNotifications.length}</span></a>{" · "}
              <a className="sq-link" href="#geo-override-queue-heading">{t("ops.kpi.overridesPending", "overrides pending")} <span className="sq-numeric">{overrideQueueRows.length}</span></a>
            </span>
          </p>
        </section>

        <section className="sq-surface" style={{ padding: "var(--space-4) var(--space-6)" }} aria-label={t("ops.filter.heading", "Geographic scope")}>
          <OperationsScopeFilter
            view={view}
            region={region}
            city={city}
            regions={regions}
            cities={cities}
            labels={{
              region: monitoringStrings.regionLabel,
              city: monitoringStrings.cityLabel,
              allRegions: monitoringStrings.allRegions,
              allCities: monitoringStrings.allCities,
            }}
          />
        </section>

        <OverrideQueue rows={overrideQueueRows} strings={overrideQueueStrings} locale={locale} />
        <CancellationQueue rows={cancellationQueueRows} strings={cancellationQueueStrings} locale={locale} />

        <section className="sq-surface" style={{ padding: "var(--space-4) var(--space-6)" }}>
          <OpsExport datasets={exportDatasets} strings={exportStrings} />
        </section>

        {view === "map" ? (
          <>
            <section className="sq-surface" style={{ padding: "var(--space-6)" }} aria-labelledby="operations-map-heading">
              <div className={styles.sectionHead}>
                <div>
                  <h3 id="operations-map-heading">{t("ops.map.heading", "Operations Map")}</h3>
                  <p className="sq-caption">
                    {t("ops.map.truth", "Official factory coordinates and canonical visit states · markers and status only")}
                  </p>
                </div>
                <a className="sq-link" href="/operations/live">{t("ops.map.liveLink", "Open Operations Live")}</a>
              </div>
              <OperationsMapWorkspace
                entries={mapEntries}
                strings={mapWorkspaceStrings}
              />
            </section>

            <section className="sq-surface" style={{ padding: "var(--space-6)" }} aria-labelledby="operational-highlights-heading">
              <div className={styles.sectionHead}>
                <div>
                  <h3 id="operational-highlights-heading">{t("ops.highlights.heading", "Operational Highlights")}</h3>
                  <p className="sq-caption">{t("ops.highlights.deterministic", "Deterministic operational records · no AI recommendation")}</p>
                </div>
                <a className="sq-link" href={performanceViewHref}>{t("ops.highlights.performance", "Review National Performance")}</a>
              </div>
              {highlights.length === 0 ? (
                <EmptyState
                  bare
                  glyph="✓"
                  title={t("ops.highlights.empty.title", "No open items in scope")}
                  body={t("ops.highlights.empty.body", "Deadline, decision, corrective-action and notification records will appear here.")}
                />
              ) : (
                <ul className={styles.highlightList}>
                  {highlights.slice(0, 8).map(item => (
                    <li className={styles.highlightItem} key={item.id}>
                      <div>
                        <strong>{item.label}</strong>
                        <div>{item.description}</div>
                        <span className={styles.highlightMeta}>{item.at ? fmtTs(item.at) : "—"}</span>
                      </div>
                      <div className="sq-row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {item.evidenceUrl && (
                          <a className="sq-link" href={item.evidenceUrl} target="_blank" rel="noreferrer">
                            {t("ops.highlights.evidence", "View evidence")}
                          </a>
                        )}
                        <a className="sq-link" href={item.href}>{t("ops.highlights.open", "Open record")}</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="sq-surface" style={{ padding: "var(--space-6)" }} aria-labelledby="operations-monitoring-heading">
              <h3 id="operations-monitoring-heading">{t("ops.live.heading", "Live visit monitoring (M08-003)")}</h3>
              <MonitoringTable
                initialRows={monitorRows}
                initialAt={nowIso}
                region={region}
                city={city}
                enumLabels={enumLabels}
                strings={monitoringStrings}
              />
            </section>
          </>
        ) : (
          <>
            <section className="sq-surface" style={{ padding: "var(--space-6)" }} aria-labelledby="regional-performance-heading">
              <div className={styles.sectionHead}>
                <div>
                  <h3 id="regional-performance-heading">{t("ops.performance.regions", "National → region drill")}</h3>
                  <p className="sq-caption">{t("ops.performance.regionTruth", "Factory and active-visit counts use the same RLS-scoped records as the map.")}</p>
                </div>
                {region && <a className="sq-link" href="/operations?view=performance">{t("ops.performance.national", "Return to national scope")}</a>}
              </div>
              {regionSummaries.length === 0 ? (
                <EmptyState bare title={t("ops.performance.emptyRegions", "No regions in scope")} body={t("ops.performance.emptyRegionsBody", "Authorized factories will appear here when region data is available.")} />
              ) : (
                <ul className={styles.regionList}>
                  {regionSummaries.map(item => (
                    <li className={styles.regionItem} key={item.name}>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="sq-caption">
                          <span className="sq-numeric">{item.factories}</span> {t("ops.performance.factories", "factories")} ·{" "}
                          <span className="sq-numeric">{item.active}</span> {t("ops.performance.activeVisits", "active visits")}
                        </div>
                      </div>
                      <a className="sq-link" href={item.href}>{t("ops.performance.openRegion", "Open region")}</a>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginBlockStart: "var(--space-5)" }}>
                <div className={styles.sectionHead}>
                  <div>
                    <h4>{t("ops.performance.map", "Regional performance map")}</h4>
                    <p className="sq-caption">
                      {t("ops.performance.mapTruth", "Neutral factory markers · select from the map or synchronized factory list")}
                    </p>
                  </div>
                </div>
                <OperationsMapWorkspace
                  entries={regionalMapEntries}
                  strings={mapWorkspaceStrings}
                />
              </div>
            </section>

            <div className="sq-grid-2">
        <div className="sq-stack">
          {/* Live monitoring — M08-003 (auto-refresh via server action) */}
          <div className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.live.heading", "Live visit monitoring (M08-003)")}</h4>
            <MonitoringTable initialRows={monitorRows} initialAt={nowIso} region={region} city={city}
              enumLabels={enumLabels} strings={monitoringStrings} />
          </div>

          {/* SLA watch — ENG-09 thresholds vs live visit windows */}
          <div id="deadline-alerts" className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.sla.heading", "Deadline alerts")}</h4>
            {slaFlags.length === 0 ? (
              <EmptyState bare glyph="✓" title={t("ops.sla.empty.title", "No deadline alerts in scope")}
                body={t("ops.sla.empty.desc", "Published visits are inside their planned windows; breaches surface here the moment a window lapses.")} />
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr><th scope="col">{t("ops.sla.th.visit", "Visit")}</th><th scope="col">{t("ops.sla.th.factory", "Factory")}</th><th scope="col">{t("ops.sla.th.operational", "Visit status")}</th><th scope="col">{t("ops.sla.th.deadline", "Deadline")}</th><th scope="col">{t("ops.sla.th.sla", "Deadline status")}</th><th scope="col">{t("ops.sla.th.escalation", "Escalation")}</th></tr></thead>
                <tbody>{slaFlags.map(f => (
                  <tr key={f.visit.id}>
                    <td><a className="sq-link" href={`/visits/${f.visit.id}`}>{f.visit.id.slice(0, 8)}</a></td>
                    <td>{f.visit.factories
                      ? <a className="sq-link" href={`/factories/${f.visit.factories.id}`}>{f.visit.factories.name}</a>
                      : "—"}</td>
                    <td><span className="sq-lozenge sq-lozenge--ops">{enumLabel(f.visit.operational_state)}</span></td>
                    <td><span className="sq-numeric">{fmtTs(f.deadlineMs)}</span></td>
                    <td><span className={`sq-lozenge ${f.kind === "reminder" ? "sq-lozenge--warning" : "sq-lozenge--critical"}`}>{slaKindLabel(f)}</span></td>
                    <td>{f.escalation
                      ? <span className={`sq-lozenge ${f.escalation === "L2" ? "sq-lozenge--critical" : "sq-lozenge--warning"}`}>{f.escalation}</span>
                      : <span className="sq-caption">—</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            {/* Phase 6 (§22, D-022) — resubmission SLA for returned inspections.
                Display-only flag, consistent with the review SLA: no escalation
                writes; absent config surfaces honestly as unavailable. */}
            <h5 style={{ marginBlock: "var(--space-4) var(--space-3)" }}>{t("ops.sla.resubHeading", "Resubmission deadlines (returned inspections)")}</h5>
            {!resubSlaAvailable ? (
              <p className="sq-caption">{t("ops.sla.resubUnavailable", "SLA unavailable — engine_settings.sla.resubmission_business_days is not configured.")}</p>
            ) : resubFlags.length === 0 ? (
              <p className="sq-caption">{t("ops.sla.resubEmpty", "No returned inspections awaiting resubmission in scope.")}</p>
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr><th scope="col">{t("ops.sla.resub.th.inspection", "Inspection")}</th><th scope="col">{t("ops.sla.th.factory", "Factory")}</th><th scope="col">{t("ops.sla.resub.th.returned", "Returned")}</th><th scope="col">{t("ops.sla.resub.th.due", "Resubmission due")}</th><th scope="col">{t("ops.sla.th.sla", "Deadline status")}</th></tr></thead>
                <tbody>{resubFlags.map(f => (
                  <tr key={f.inspection_id}>
                    <td><a className="sq-link" href={`/reviews/${f.inspection_id}`}>{f.inspection_id.slice(0, 8)}</a></td>
                    <td>{f.factory_name ?? "—"}</td>
                    <td><span className="sq-numeric">{fmtTs(Date.parse(f.returned_at))}</span></td>
                    <td><span className="sq-numeric">{fmtTs(f.deadlineMs)}</span></td>
                    <td><span className={`sq-lozenge ${f.overdue ? "sq-lozenge--critical" : "sq-lozenge--warning"}`}>
                      {f.overdue ? t("ops.sla.resubOverdue", "Resubmission overdue") : t("ops.sla.resubDue", "Resubmission pending")}
                    </span></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="sq-caption" style={{ marginBlockStart: "var(--space-3)" }}>
              {t("ops.sla.confNote", "Thresholds from engine_settings (ENG-09):")}{" "}
              {t("ops.sla.confCalendar", "calendar")} <span className="sq-numeric">{slaConf.calendar?.days ?? "—"} {slaConf.calendar?.hours ?? ""}</span> ·{" "}
              {t("ops.sla.confReview", "review")} <span className="sq-numeric">{slaConf.review_business_days ?? "—"}</span>{t("ops.sla.confBd", "bd")} ·{" "}
              {t("ops.sla.confResub", "resubmission")} <span className="sq-numeric">{slaConf.resubmission_business_days ?? "—"}</span>{t("ops.sla.confBd", "bd")} ·{" "}
              {t("ops.sla.confAction", "action due")} <span className="sq-numeric">{slaConf.action_due_calendar_days ?? "—"}</span>{t("ops.sla.confDays", "d")} ·{" "}
              {t("ops.sla.confReminders", "reminders at")} <span className="sq-numeric">{(slaConf.reminders ?? []).map(r => `${Math.round(r * 100)}%`).join(", ") || "—"}</span>
            </p>
          </div>

          {/* Corrective actions queue — SB12 write leg */}
          <div id="corrective-actions" className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.actions.heading", "Corrective actions queue (M09-027 · ENG-11)")}</h4>
            {actions.length === 0 ? (
              <EmptyState bare glyph="✓" title={t("ops.actions.empty.title", "No open corrective actions")}
                body={t("ops.actions.empty.desc", "Action forms raised from violations land here until closed (FLD-ACT-001).")} />
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr><th scope="col">{t("ops.actions.th.factory", "Factory")}</th><th scope="col">{t("ops.actions.th.owner", "Owner")}</th><th scope="col">{t("ops.actions.th.due", "Due")}</th><th scope="col">{t("ops.actions.th.blocking", "Blocking")}</th><th scope="col">{t("ops.actions.th.status", "Status")}</th><th scope="col">{t("ops.actions.th.resolve", "Resolve")}</th></tr></thead>
                <tbody>{actions.map(a => {
                  const overdue = a.due_at ? new Date(a.due_at).getTime() < now : false;
                  const factory = a.inspections?.visits?.factories ?? null;
                  return (
                    <tr key={a.id}>
                      <td>{factory
                        ? <a className="sq-link" href={`/factories/${factory.id}`}>{factory.name}</a>
                        : "—"}<br />
                        {a.inspections?.visit_id && <a className="sq-link sq-caption" href={`/visits/${a.inspections.visit_id}`}>{visitWord} {a.inspections.visit_id.slice(0, 8)}</a>}</td>
                      <td>{a.owner_name ?? "—"}{a.owner_role && <span className="sq-caption"> · {a.owner_role}</span>}</td>
                      <td>{a.due_at
                        ? <span className={overdue ? "sq-lozenge sq-lozenge--critical" : "sq-numeric"}>{formatDate(a.due_at, locale === "ar" ? "ar" : "en")}{overdue ? ` ${t("ops.actions.overdue", "overdue")}` : ""}</span>
                        : "—"}</td>
                      <td>{a.is_blocking ? <span className="sq-lozenge sq-lozenge--critical">{t("ops.actions.blocking", "blocking")}</span> : <span className="sq-lozenge">{t("ops.actions.advisory", "advisory")}</span>}</td>
                      <td><span className={`sq-lozenge ${a.status === "acknowledged" ? "sq-lozenge--info" : "sq-lozenge--warning"}`}>{enumLabel(a.status)}</span></td>
                      <td><ActionFormControls actionFormId={a.id} status={a.status} strings={actionControlStrings} /></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            )}
          </div>
        </div>

        <div className="sq-stack">
          {/* High-risk factory board — M08-006 (ENG-04 output) */}
          <div className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.risk.heading", "High-risk factories (M08-006 · ENG-04)")}</h4>
            {highRisk.length === 0 ? (
              <EmptyState bare glyph="◎" title={t("ops.risk.empty.title", "No scored factories yet")}
                body={t("ops.risk.empty.desc", "Factories appear here once the risk engine records a score (FLD-FACT-007/008).")} />
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr><th scope="col">{t("ops.risk.th.factory", "Factory")}</th><th scope="col">{t("ops.risk.th.location", "Location")}</th><th scope="col">{t("ops.risk.th.score", "Score")}</th><th scope="col">{t("ops.risk.th.rank", "RLS-visible rank")}</th></tr></thead>
                <tbody>{highRisk.map((f, index) => (
                  <tr key={f.id}>
                    <td><a className="sq-link" href={`/factories/${f.id}`}>{f.name}</a>
                      {f.activity_class && <><br /><span className="sq-caption">{f.activity_class}</span></>}</td>
                    <td className="sq-caption">{[f.region, f.city].filter(Boolean).join(" · ") || "—"}</td>
                    <td><span className="sq-numeric">{f.risk_score}</span></td>
                    <td><span className="sq-lozenge sq-numeric">{index + 1} / {highRisk.length}</span></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>

          {/* Location events — M08-014 immutable */}
          <div className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.geo.heading", "Location events — immutable tracking history (M08-014)")}</h4>
            {scopedGeo.length === 0 ? (
              <EmptyState bare icon={<IconPin size={28} />} title={t("ops.geo.empty.title", "No location events yet")}
                body={t("ops.geo.empty.desc", "Check-ins, arrivals and telemetry are recorded append-only (FLD-GEO-*).")} />
            ) : (
              <ul className="sq-timeline">{scopedGeo.slice(0, 10).map(g => (
                <li key={g.id} className={g.kind === "checkin" ? "is-key" : undefined}>
                  <div><strong>{enumLabel(g.kind)}</strong> ±{g.accuracy_m}m{" "}
                    {g.geofence_result && <span className={`sq-lozenge ${g.geofence_result === "inside" ? "sq-lozenge--success" : g.geofence_result === "override" ? "sq-lozenge--warning" : "sq-lozenge--critical"}`}>{enumLabel(g.geofence_result)}</span>}{" "}
                    <a className="sq-link sq-caption" href={`/visits/${g.visit_id}`}>{visitWord} {g.visit_id.slice(0, 8)}</a><br />
                    <span className="sq-timeline__meta sq-numeric">{fmtTs(new Date(g.occurred_at).getTime())}</span></div>
                </li>
              ))}</ul>
            )}
          </div>

          {/* Notifications — ENG-11 */}
          <div id="notifications" className="sq-surface" style={{ padding: "var(--space-6)" }}>
            <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{t("ops.notifs.heading", "Notifications (ENG-11 · REF-014)")}</h4>
            {notifs.length === 0 ? (
              <EmptyState bare icon={<IconBell size={28} />} title={t("ops.notifs.empty.title", "No notifications")}
                body={t("ops.notifs.empty.desc", "Event-keyed messages queue here as workflow events fire (REF-014).")} />
            ) : (
              <div className="sq-tablewrap"><table className="sq-table">
                <thead><tr><th scope="col">{t("ops.notifs.th.event", "Event")}</th><th scope="col">{t("ops.notifs.th.channel", "Channel")}</th><th scope="col">{t("ops.notifs.th.state", "State")}</th><th scope="col">{t("ops.notifs.th.at", "At")}</th><th scope="col"></th></tr></thead>
                <tbody>{notifs.map(n => (
                  <tr key={n.id}>
                    <td><span className="sq-lozenge sq-lozenge--info">{n.event_key}</span></td>
                    <td className="sq-caption">{n.channel}</td>
                    <td><span className={`sq-lozenge ${NOTIF_TONE[n.delivery_state] ?? ""}`}>{enumLabel(n.delivery_state)}</span></td>
                    <td><span className="sq-numeric">{fmtTs(new Date(n.created_at).getTime())}</span></td>
                    <td>{n.delivery_state !== "handled" && <MarkNotificationHandled notificationId={n.id} strings={markHandledStrings} />}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="sq-caption" style={{ marginBlockStart: "var(--space-3)" }}>
              {t("ops.notifs.rlsNote", "Notification reads and mark-handled updates are recipient/Operations scoped by separate RLS policies; the database verdict remains authoritative.")}
            </p>
          </div>
        </div>
      </div>
          </>
        )}
      </div>
    </Shell>
  );
}
