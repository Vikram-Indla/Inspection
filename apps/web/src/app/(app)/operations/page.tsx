import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/dates";
import { humaniseEnum, sentenceCase } from "@/lib/text";
import {
  ActionFormControls, MarkNotificationHandled,
  type ActionFormControlsStrings, type MarkHandledStrings,
} from "./Controls";
import { type MonitoringStrings } from "./Monitoring";
import OperationsMonitoringTable from "@/components/sections/operations/operations-monitoring-table/operations-monitoring-table";
import type { OpsPin } from "./OpsMap";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import OperationsScopeFilter from "@/components/sections/operations/operations-scope-filter/operations-scope-filter";
import OperationsSlaTable, { type SlaAlertRow } from "@/components/sections/operations/operations-sla-table/operations-sla-table";
import OperationsKpiContract from "@/components/sections/operations/operations-kpi-contract/operations-kpi-contract";
import OperationsWorkloadTable from "@/components/sections/operations/operations-workload-table/operations-workload-table";
import OperationsRiskTable, { type RiskBand, type RiskRow } from "@/components/sections/operations/operations-risk-table/operations-risk-table";
import OperationsAlerts, { DELIVERY_TONE, type AlertRow } from "@/components/sections/operations/operations-alerts/operations-alerts";
import OperationsCancellations, { type CancellationRow } from "@/components/sections/operations/operations-cancellations/operations-cancellations";
import OperationsTimeline from "@/components/sections/operations/operations-timeline/operations-timeline";
import type { TimelineEvent } from "@/components/saqeel/timeline/timeline";
import OperationsHistoryTable, { type HistoryRow } from "@/components/sections/operations/operations-history-table/operations-history-table";
import OperationsExport from "@/components/sections/operations/operations-export/operations-export";
import { getMessages } from "@/i18n/messages";
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
import { buildShellNavigation, BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";
import { resolveRegionId } from "@/lib/ksa-regions";
import styles from "./operations.module.css";
import RevampOperationsCenter from "./RevampOperationsCenter";

// SCR-WEB-500 — Operations Center (SB12, M08). Read legs + write legs
// (acknowledge/close corrective actions; mark notifications handled) +
// KSA map (M08-002), high-risk board (M08-006), region/city filter (M08-010),
// SLA watch (ENG-09) and request-time visit monitoring (M08-003).

type FactoryEmbed = {
  id: string; name: string; region: string | null; city: string | null;
  factory_code: string | null; source: string;
} | null;
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
type GeoRow = {
  id: string; visit_id: string; kind: string; geofence_result: string | null;
  accuracy_m: number; occurred_at: string; observed_lat: number; observed_lng: number;
  integration_mode: string | null;
};
type ActionRow = {
  id: string;
  form_type: string;
  owner_name: string | null;
  owner_role: string | null;
  due_at: string | null;
  status: string;
  is_blocking: boolean;
  required_correction: string | null;
  inspections: { visit_id: string; visits: { factories: {
    id: string; name: string; factory_code: string | null; region: string | null; city: string | null;
  } | null } | null } | null;
};
type NotifRow = { id: string; event_key: string; channel: string; delivery_state: string; created_at: string };
type FactoryRow = {
  id: string; name: string; region: string | null; city: string | null;
  official_lat: number | null; official_lng: number | null;
  geofence_radius_m: number | null; risk_score: number | null; risk_band: string | null;
  activity_class: string | null; factory_code: string | null; source: string;
};
type EngineRow = { engine: string; settings: Record<string, unknown> };
type OverrideRow = {
  id: string; visit_id: string; status: string; reason_label: string; explanation: string;
  safety_security_exception: boolean; observed_lat: number; observed_lng: number;
  accuracy_m: number; distance_m: number; device_occurred_at: string; requested_at: string; expires_at: string;
  visits: { factories: {
    name: string; region: string | null; city: string | null; factory_code: string | null;
  } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
};
type OperationsTimelineRow = {
  event_key: string;
  occurred_at: string;
  object_type: string;
  object_id: string;
  payload: Record<string, unknown>;
};
type OperationsKpiDefinition = {
  metric_key: string;
  formula: string | null;
  source_lineage: unknown;
  definition_version: number | null;
  source_status: string;
};
type OperationsKpiContractData = {
  authorized?: boolean;
  configured?: boolean;
  decision?: string;
  period?: unknown;
  timezone?: unknown;
  policy_version?: number | null;
  blocked_by?: string;
  definitions?: OperationsKpiDefinition[];
};

const CLEAN_FACTORY_CODES = new Set([
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
]);

const isCleanFactory = (factory: { factory_code?: string | null } | null | undefined) =>
  Boolean(factory?.factory_code && CLEAN_FACTORY_CODES.has(factory.factory_code));

// Active operational states → map pin tone (GeoMap resolves tones to legacy tokens).
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

export default async function Operations({ searchParams }: {
  searchParams: Promise<{ region?: string; city?: string; view?: string; timelineVisit?: string }>;
}) {
  preloadShell("/operations");
  const sp = await searchParams;
  const region = typeof sp.region === "string" ? sp.region : "";
  const city = typeof sp.city === "string" ? sp.city : "";
  const view = sp.view === "performance" ? "performance" : "map";
  const requestedTimelineVisit = typeof sp.timelineVisit === "string" ? sp.timelineVisit : "";
  const { t, locale } = await useT();
  const { common: commonText, operations: opsText } = getMessages(locale);
  const local = (english: string, arabic: string) => locale === "ar" ? arabic : english;
  const localePersonName = (name: string | null | undefined) => {
    const value = name?.trim();
    if (!value) return null;
    const hasArabic = /[\u0600-\u06ff]/.test(value);
    return (locale === "ar") === hasArabic
      ? value
      : local("Name unavailable in English", "الاسم غير متاح بالعربية");
  };
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
  // PKT-RESPONSIVE-DASHBOARD-OPERATIONS-002 — field-shell convergence does not
  // retire the Inspector's CR-430..CR-448 observation capability. All canonical
  // business roles may enter the read surface. PROGRAMME-BASELINE-20260805
  // canonical_rule_visibility: "Regardless of persona, everybody can see
  // everything. The only restriction is that administration functionality is
  // reachable by an administrator alone." Operations is not administration
  // functionality, so admin is admitted to the read surface alongside the
  // business roles — same as every other canonical role, no separate grant.
  const hasOperationalRole = routeRoleKeys.some(role => BUSINESS_ROLE_KEYS.includes(role) || role === "admin");
  const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;
  if (!mayViewOperations) {
    return (
      <Shell current="/operations" title={t("ops.title", "Operations Center")}>
        <EmptyState
          icon="restricted"
          tone="warning"
          title={t("ops.unauthorized.title", "Operations access required")}
          description={t("ops.unauthorized.body", "This page is not turned on for your account, so no data has loaded.")}
          action={
            <Button variant="secondary" href="/launch" label={t("ops.unauthorized.return", "Return to my area")}>
              {t("ops.unauthorized.return", "Return to my area")}
            </Button>
          }
        />
      </Shell>
    );
  }
  const { data: profileRow } = await sb
    .from("profiles")
    .select("region")
    .eq("user_id", user.id)
    .maybeSingle();
  // RBAC-008 data-scope: profiles.region is the sole existing authorized-geography
  // assignment (also used by task_assignments RLS scope matching). A user with no
  // assigned region keeps the existing national visibility already granted by the
  // visits/factories RLS role policies; this filter only narrows that grant. It is
  // independent of the operator-selectable ?region= display filter below (M08-010).
  const authorizedScope = profileRow?.region?.trim() ?? "";
  const authorizedRegionId = resolveRegionId(authorizedScope || null);
  const inAuthorizedGeography = (r: string | null, c: string | null) => {
    // An unassigned profile inherits only the rows already granted by RLS.
    // This application-side filter narrows an explicit assignment; it must not
    // turn an otherwise valid national RLS grant into an empty result set.
    if (!authorizedScope) return true;
    if (authorizedRegionId) return resolveRegionId(r) === authorizedRegionId;
    const normalized = authorizedScope.toLocaleLowerCase("en");
    return [r, c].some(value => value?.trim().toLocaleLowerCase("en") === normalized);
  };

  // A page GET is read-only. Use one request-start timestamp to exclude elapsed
  // requests from the actionable queue without materializing workflow state.
  // decide_geo_override remains the database-authoritative race guard.
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const [visitsRes, actionsRes, notifsRes, factoriesRes, engineRes, riskRes, overrideRes, overrideEvidenceRes] = await Promise.all([
    // KPI counts by operational_state span ALL visits — operational state is its own
    // domain (FND-002); filtering by planning_status here previously zeroed the cards.
    collectPostgrestPages<VisitRow>((from, to) => sb.from("visits")
      .select("id, operational_state, planning_status, window_start, window_end, factory_id, factories(id, name, region, city, factory_code, source), assignments(profiles(full_name))")
      .order("window_start", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<VisitRow>>),
    // Corrective actions queue (M09-027 blocking flag; DEC-003 due default 14d)
    collectPostgrestPages<ActionRow>((from, to) => sb.from("action_forms")
      .select("id, form_type, owner_name, owner_role, due_at, status, is_blocking, required_correction, inspections(visit_id, visits(factories(id, name, factory_code, region, city)))")
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
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class, factory_code, source")
      .in("factory_code", [...CLEAN_FACTORY_CODES])
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryRow>>),
    // ENG-06/ENG-09 configuration — geofence default + SLA thresholds
    // (+ engine_settings.field for governed cancellation reason labels, 0020)
    sb.from("engine_settings").select("engine, settings").in("engine", ["gis", "sla", "field"]),
    // M08-006 — high-risk factory board (ENG-04 output, top scores)
    sb.from("factories")
      .select("id, name, region, city, official_lat, official_lng, geofence_radius_m, risk_score, risk_band, activity_class, factory_code, source")
      .in("factory_code", [...CLEAN_FACTORY_CODES])
      .not("risk_score", "is", null)
      .order("risk_score", { ascending: false })
      .limit(8),
    // M04-043 / RBAC-008 — only Operations sees pending requests through RLS.
    sb.from("geo_override_requests")
      .select("id, visit_id, status, reason_label, explanation, safety_security_exception, observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at, requested_at, expires_at, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
      .eq("status", "pending")
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: true }),
    sb.from("evidence")
      .select("linked_id, storage_path")
      .eq("linked_type", "geo_override").eq("evidence_type", "photo"),
  ]);

  const isVerificationFactory = (factory: FactoryEmbed | FactoryRow | null) =>
    factory?.source === "verification_fixture" || isTestFixtureEstablishment(factory);
  const integrityFilteredVisits = ((visitsRes.data ?? []) as unknown as VisitRow[])
    .filter(visit => isCleanFactory(visit.factories) && !isVerificationFactory(visit.factories));
  // CR-439/CR-447: narrow every widget to the caller's authorized geography.
  const visits = integrityFilteredVisits
    .filter(visit => inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null));
  const outOfScopeVisitCount = integrityFilteredVisits.length - visits.length;

  // M08-014 / CR-443: request the immutable ledger only for visits that can
  // appear in the caller's current monitoring scope. Chunking keeps the
  // PostgREST `in` filter bounded while stable paging avoids history loss.
  const geoVisitIds = visits
    .filter(visit =>
      (visit.planning_status === "published"
        || ["on_the_way", "arrived", "executing"].includes(visit.operational_state))
      && (!region || visit.factories?.region === region)
      && (!city || visit.factories?.city === city))
    .map(visit => visit.id);
  const geoIdChunks = Array.from(
    { length: Math.ceil(geoVisitIds.length / 100) },
    (_, index) => geoVisitIds.slice(index * 100, (index + 1) * 100),
  );
  const geoChunkResults = await Promise.all(geoIdChunks.map(visitIds =>
    collectPostgrestPages<GeoRow>((from, to) => sb.from("geo_events")
      .select("id, visit_id, kind, geofence_result, accuracy_m, occurred_at, observed_lat, observed_lng, integration_mode")
      .in("visit_id", visitIds)
      .or("integration_mode.is.null,integration_mode.eq.production")
      .lte("occurred_at", nowIso)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<GeoRow>>),
  ));
  const geoError = geoChunkResults.find(result => result.error)?.error ?? null;
  const geo = geoChunkResults
    .flatMap(result => (result.data ?? []) as unknown as GeoRow[])
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)
      || a.id.localeCompare(b.id));

  const loadErrors = [
    visitsRes.error && "visit monitoring",
    geoError && "geofence events",
    actionsRes.error && "corrective actions",
    notifsRes.error && "notifications",
    factoriesRes.error && "factory list",
    engineRes.error && "engine settings",
    riskRes.error && "risk board",
    overrideRes.error && "location exception requests",
    overrideEvidenceRes.error && "override evidence",
  ].filter(Boolean) as string[];
  if (visitsRes.error) console.error(`[operations] visits read failed: ${visitsRes.error.message}`);
  if (geoError) console.error(`[operations] geo_events read failed: ${geoError.message}`);
  if (actionsRes.error) console.error(`[operations] action_forms read failed: ${actionsRes.error.message}`);
  if (notifsRes.error) console.error(`[operations] notifications read failed: ${notifsRes.error.message}`);
  if (factoriesRes.error) console.error(`[operations] factories read failed: ${factoriesRes.error.message}`);
  if (engineRes.error) console.error(`[operations] engine_settings read failed: ${engineRes.error.message}`);
  if (riskRes.error) console.error(`[operations] risk read failed: ${riskRes.error.message}`);
  if (overrideRes.error) console.error(`[operations] override queue read failed: ${overrideRes.error.message}`);
  if (overrideEvidenceRes.error) console.error(`[operations] override evidence read failed: ${overrideEvidenceRes.error.message}`);

  const actions = ((actionsRes.data ?? []) as unknown as ActionRow[]).filter(action => {
    const factory = action.inspections?.visits?.factories;
    return isCleanFactory(factory) && inAuthorizedGeography(factory?.region ?? null, factory?.city ?? null);
  });
  const notifs = (notifsRes.data ?? []) as unknown as NotifRow[];
  const factories = ((factoriesRes.data ?? []) as unknown as FactoryRow[])
    .filter(factory => isCleanFactory(factory) && !isVerificationFactory(factory)
      && inAuthorizedGeography(factory.region, factory.city));
  const engines = (engineRes.data ?? []) as unknown as EngineRow[];
  const highRisk = ((riskRes.data ?? []) as unknown as FactoryRow[])
    .filter(factory => isCleanFactory(factory) && !isVerificationFactory(factory)
      && inAuthorizedGeography(factory.region, factory.city));
  const integrityFilteredOverrides = (overrideRes.data ?? []) as unknown as OverrideRow[];
  const overrides = integrityFilteredOverrides
    .filter(row => isCleanFactory(row.visits?.factories)
      && inAuthorizedGeography(
        row.visits?.factories?.region ?? null,
        row.visits?.factories?.city ?? null,
      ));
  const outOfScopeOverrideCount = integrityFilteredOverrides.length - overrides.length;
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
    inspector_name: localePersonName(row.visits?.assignments?.[0]?.profiles?.full_name),
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
    evidence_id: string | null; requested_at: string; status: string;
    decided_at: string | null; decision_reason: string | null;
    visits: { factories: {
      name: string; region: string | null; city: string | null; factory_code: string | null;
    } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
  };
  let cancellationQueueRows: CancellationQueueRow[] = [];
  let cancellationHistoryRows: Array<{
    id: string; visit_id: string; factory_name: string | null; inspector_name: string | null;
    region: string | null; reason_label: string;
    status: string; requested_at: string; decided_at: string | null; decision_reason: string | null;
  }> = [];
  let outOfScopeCancellationCount = 0;
  {
    const { data: cancelRows, error: cancelError } = await sb.from("cancellation_requests")
      .select("id, visit_id, phase, reason_key, comment, evidence_id, requested_at, status, decided_at, decision_reason, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (cancelError) {
      // Expected pre-migration (table absent) — degrade silently to an empty queue.
      if (!cancelError.message.includes("cancellation_requests")) {
        console.error(`[operations] cancellation queue read failed: ${cancelError.message}`);
        loadErrors.push("cancellation requests");
      }
    } else {
      const integrityFilteredRows = (cancelRows ?? []) as unknown as CancellationReqRow[];
      const rows = integrityFilteredRows
        .filter(row => isCleanFactory(row.visits?.factories)
          && inAuthorizedGeography(
            row.visits?.factories?.region ?? null,
            row.visits?.factories?.city ?? null,
          ));
      outOfScopeCancellationCount = integrityFilteredRows.length - rows.length;
      const reasonLabels = new Map<string, string>();
      for (const r of fieldCfgReasons) reasonLabels.set(r.key, r.label);
      const pendingRows = rows.filter(row => row.status === "pending");
      const evidenceIds = pendingRows.map(r => r.evidence_id).filter((v): v is string => !!v);
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
      cancellationQueueRows = pendingRows.map(row => ({
        id: row.id, visit_id: row.visit_id, phase: row.phase,
        reason_label: reasonLabels.get(row.reason_key) ?? row.reason_key,
        comment: row.comment, requested_at: row.requested_at,
        factory_name: row.visits?.factories?.name ?? null,
        inspector_name: localePersonName(row.visits?.assignments?.[0]?.profiles?.full_name),
        evidence_url: row.evidence_id ? cancelEvidenceUrls.get(row.evidence_id) ?? null : null,
      }));
      cancellationHistoryRows = rows.map(row => ({
        id: row.id,
        visit_id: row.visit_id,
        factory_name: row.visits?.factories?.name ?? null,
        inspector_name: localePersonName(row.visits?.assignments?.[0]?.profiles?.full_name),
        region: row.visits?.factories?.region ?? null,
        reason_label: reasonLabels.get(row.reason_key) ?? row.reason_key,
        status: row.status,
        requested_at: row.requested_at,
        decided_at: row.decided_at,
        decision_reason: row.decision_reason,
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
    visits: { factories: {
      name: string; region: string | null; city: string | null; factory_code: string | null;
    } | null } | null;
  };
  let resubmissionSources: ResubmissionSource[] = [];
  {
    const { data: returnedRows, error: returnedError } = await sb.from("inspections")
      .select("id, visit_id, reviews(decision, decided_at), visits(factories(name, region, city, factory_code))")
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
          if (!isCleanFactory(f) || !inAuthorizedGeography(f?.region ?? null, f?.city ?? null)) return null;
          if (region && f?.region !== region) return null;
          if (city && f?.city !== city) return null;
          return { inspection_id: row.id, visit_id: row.visit_id, factory_name: f?.name ?? null, returned_at: decided };
        })
        .filter((x): x is ResubmissionSource => !!x);
    }
  }

  const outOfScopeRecordCount = outOfScopeVisitCount + outOfScopeOverrideCount + outOfScopeCancellationCount;
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
  const scopedGeo = geo.filter(g => monitoredVisitIds.has(g.visit_id)
    && (g.integration_mode == null || g.integration_mode === "production")
    && Number.isFinite(Date.parse(g.occurred_at))
    && Date.parse(g.occurred_at) <= now);
  const latestGeoByVisit = new Map<string, GeoRow>();
  for (const event of scopedGeo) {
    if (!latestGeoByVisit.has(event.visit_id)) latestGeoByVisit.set(event.visit_id, event);
  }

  // Latest geofence result per visit (geo list already newest-first) — M08-014
  const latestGeofence = new Map<string, string>();
  for (const g of scopedGeo) {
    if (g.geofence_result && !latestGeofence.has(g.visit_id)) latestGeofence.set(g.visit_id, g.geofence_result);
  }
  const latestObservedPosition = new Map<string, GeoRow>();
  for (const event of scopedGeo) {
    const occurredAt = Date.parse(event.occurred_at);
    const lat = Number(event.observed_lat);
    const lng = Number(event.observed_lng);
    const valid = Number.isFinite(occurredAt) && occurredAt <= now
      && Number.isFinite(lat) && lat >= -90 && lat <= 90
      && Number.isFinite(lng) && lng >= -180 && lng <= 180
      && (event.integration_mode == null || event.integration_mode === "production");
    if (valid && !latestObservedPosition.has(event.visit_id)) {
      latestObservedPosition.set(event.visit_id, event);
    }
  }
  const enumLabel = (value: string) =>
    sentenceCase(t(`enum.${value}`, humaniseEnum(value)));

  // ---------- ENG-09 SLA watch: engine thresholds vs live visit windows ----------
  const slaFlags = computeSlaFlags(monitored, slaConf, now);
  // Phase 6 (§22, D-022) — resubmission deadlines for returned inspections
  // (display-only). Absent config → honest "SLA unavailable", never invented.
  const resubSlaAvailable = typeof slaConf.resubmission_business_days === "number";
  const resubFlags = computeResubmissionFlags(resubmissionSources, slaConf, now);

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
    const observed = latestObservedPosition.get(v.id);
    if (!f || !observed) continue;
    pinnedFactoryIds.add(f.id);
    pins.push({
      id: `v:${v.id}`, kind: "visit",
      lat: Number(observed.observed_lat), lng: Number(observed.observed_lng),
      label: `${f.name} · ${enumLabel(v.operational_state)} · ${enumLabel(observed.kind)} · ${formatDateTime(Date.parse(observed.occurred_at), locale === "ar" ? "ar" : "en")}`,
      tone,
      href: `/visits/${v.id}`,
    });
  }
  for (const f of scopedFactories) {
    if (pinnedFactoryIds.has(f.id) || f.official_lat == null || f.official_lng == null) continue;
    pins.push({
      id: `f:${f.id}`, kind: "factory",
      lat: Number(f.official_lat), lng: Number(f.official_lng),
      label: `${f.name} · ${local("Factory list location", "موقع من قائمة المصانع")}`, tone: "neutral",
      href: `/factories/${f.id}`,
    });
  }

  // ---------- M08-010 filter option lists (region-scoped cities) ----------
  const regions = [...new Set(factories.map(f => f.region).filter((r): r is string => !!r))].sort();
  const cities = [...new Set(factories
    .filter(f => !region || f.region === region)
    .map(f => f.city).filter((c): c is string => !!c))].sort();

  // ---------- M08-003 monitoring rows (one request-time RLS snapshot) ----------
  const monitorRows: MonitorRow[] = monitored.map(v => ({
    id: v.id,
    factory_id: v.factories?.id ?? v.factory_id,
    factory_name: v.factories?.name ?? null,
    operational_state: v.operational_state,
    geofence: latestGeofence.get(v.id) ?? null,
    inspector: localePersonName(v.assignments?.[0]?.profiles?.full_name),
  }));
  const enumLabels = Object.fromEntries(
    [...states, "inside", "outside", "override"].map(v => [v, enumLabel(v)]));
  const kpiMetricLabel = (metric: string) => ({
    visits_planned: local("Visits planned", "الزيارات المخططة"),
    visits_completed: local("Visits completed", "الزيارات المكتملة"),
    visits_cancelled: local("Visits cancelled", "الزيارات الملغاة"),
    visits_overdue: local("Visits overdue", "الزيارات المتأخرة"),
    active_inspectors: local("Active inspectors", "المفتشون النشطون"),
    average_duration: local("Average duration", "متوسط المدة"),
    sla_breach_rate: local("Deadline breach rate", "معدل تجاوز الموعد النهائي"),
  } as Record<string, string>)[metric] ?? humaniseEnum(metric);
  const timelineVisitId = monitored.some(visit => visit.id === requestedTimelineVisit)
    ? requestedTimelineVisit
    : null;
  const [timelineRpc, kpiContractRpc] = await Promise.all([
    timelineVisitId
      ? sb.rpc("operations_visit_timeline", { p_visit_id: timelineVisitId })
      : Promise.resolve({ data: [] as OperationsTimelineRow[], error: null }),
    sb.rpc("operations_kpi_contract"),
  ]);
  if (timelineRpc.error) console.error(`[operations] timeline read failed: ${timelineRpc.error.message}`);
  if (kpiContractRpc.error) console.error(`[operations] KPI contract read failed: ${kpiContractRpc.error.message}`);
  const operationsTimeline = (timelineRpc.data ?? []) as unknown as OperationsTimelineRow[];
  const operationsKpiContract = (kpiContractRpc.data ?? null) as OperationsKpiContractData | null;

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
    emptyDesc: t("ops.live.empty.desc", "Visits appear here once planning publishes them."),
    refreshedAt: t("ops.live.refreshedAt", "Refreshed"),
    refreshing: t("ops.live.refreshing", "Refreshing…"),
    autoNote: t("ops.live.scopeNote", "Records limited to your access"),
  };
  const mapWorkspaceStrings: OperationsMapWorkspaceStrings = {
    mapLabel: t("ops.map.workspaceLabel", "Operations map"),
    loadingTitle: t("ops.map.loading.title", "Loading KSA map"),
    loadingBody: t("ops.map.loading.body", "Mapbox renders in the browser only."),
    listHeading: t("ops.map.list.heading", "Map records"),
    listDescription: t("ops.map.list.description", "The list and map show the same records you can see."),
    emptyTitle: t("ops.map.empty.title", "No mappable factories in scope"),
    emptyBody: t("ops.map.empty.desc", "Factories gain map positions when GIS Admin records official coordinates (/006)."),
    open: t("ops.map.open", "Open"),
    selected: t("ops.map.selected", "Selected on map and list"),
    factory: t("ops.map.factory", "Factory 360"),
    visit: t("ops.map.visit", "visit"),
    preview: t("ops.map.preview", "Preview"),
    previewStrings: {
      inspectorTitle: t("ops.preview.inspector", "Inspector preview"),
      factoryTitle: t("ops.preview.factory", "Factory quick card"),
      close: t("ops.preview.close", "Close preview"),
      currentVisit: t("ops.preview.currentVisit", "Current visit"),
      operationalState: t("ops.preview.operationalState", "Visit status"),
      assignments: t("ops.preview.assignments", "Assignments in current scope"),
      lastGeoEvent: t("ops.preview.lastGeoEvent", "Last geo event"),
      noGeoEvent: t("ops.preview.noGeoEvent", "No recorded position"),
      openVisit: t("ops.preview.openVisit", "Open full visit"),
      location: t("ops.preview.location", "Location"),
      riskScore: t("ops.preview.riskScore", "Raw risk score"),
      riskRank: t("ops.preview.riskRank", "Visible rank"),
      riskUnavailable: t("ops.preview.riskUnavailable", "Unavailable"),
      activeVisits: t("ops.preview.activeVisits", "Active visits"),
      openActions: t("ops.preview.openActions", "Open corrective actions"),
      openFactory: t("ops.preview.openFactory", "Open Factory 360"),
    },
  };
  const overrideQueueStrings: OverrideQueueStrings = {
    heading: t("ops.override.heading", "Location exception requests"),
    caption: t("ops.override.caption", "Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes."),
    emptyTitle: t("ops.override.empty.title", "No location exceptions pending"),
    emptyDesc: t("ops.override.empty.desc", "Location exception requests with their evidence appear here for Operations review."),
    factory: t("ops.override.factory", "Factory"), inspector: t("ops.override.inspector", "Inspector"),
    captured: t("ops.override.captured", "Captured"), accuracy: t("ops.override.accuracy", "Accuracy"),
    distance: t("ops.override.distance", "Distance"), evidence: t("ops.override.evidence", "Photo evidence"),
    safetyException: t("ops.override.safetyException", "Safety/security photo exception declared"), expires: t("ops.override.expires", "Expires"),
    viewEvidence: t("ops.override.viewEvidence", "View photo"), evidenceUnavailable: t("ops.override.evidenceUnavailable", "photo link unavailable"),
    approve: t("ops.override.approve", "Approve exception"), reject: t("ops.override.reject", "Reject"),
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

  const slaAlertRows: SlaAlertRow[] = [
    ...slaFlags.map(flag => ({
      id: `visit:${flag.visit.id}`,
      visitHref: `/visits/${flag.visit.id}`,
      visitLabel: flag.visit.id.slice(0, 8),
      factoryName: flag.visit.factories?.name ?? "—",
      deadline: fmtTs(flag.deadlineMs),
      status: slaKindLabel(flag),
      overdue: flag.kind !== "reminder",
      escalation: flag.escalation,
    })),
    ...resubFlags.map(flag => ({
      id: `resubmission:${flag.inspection_id}`,
      visitHref: `/visits/${flag.visit_id}`,
      visitLabel: flag.visit_id.slice(0, 8),
      factoryName: flag.factory_name ?? "—",
      deadline: fmtTs(flag.deadlineMs),
      status: flag.overdue ? opsText.sla.resubmissionOverdue : opsText.sla.resubmissionPending,
      overdue: flag.overdue,
      escalation: resubSlaAvailable ? null : commonText.state.notConfigured,
    })),
  ];
  const rankedFactories = scopedFactories
    .filter(factory => factory.risk_score != null)
    .sort((a, b) => Number(b.risk_score) - Number(a.risk_score));
  const riskRankByFactory = new Map(rankedFactories.map((factory, index) => [factory.id, index + 1]));
  const activeCountByFactory = new Map<string, number>();
  for (const visit of monitored) {
    const factoryId = visit.factories?.id ?? visit.factory_id;
    if (factoryId) activeCountByFactory.set(factoryId, (activeCountByFactory.get(factoryId) ?? 0) + 1);
  }
  const actionCountByFactory = new Map<string, number>();
  for (const action of actions) {
    const factoryId = action.inspections?.visits?.factories?.id;
    if (factoryId) actionCountByFactory.set(factoryId, (actionCountByFactory.get(factoryId) ?? 0) + 1);
  }
  const previewFields = (factory: FactoryRow | undefined, visit: VisitRow | undefined) => {
    const sourceInspectorName = visit?.assignments?.[0]?.profiles?.full_name ?? null;
    const latestGeoEvent = visit ? latestGeoByVisit.get(visit.id) ?? null : null;
    return {
      factoryId: factory?.id ?? visit?.factories?.id ?? visit?.factory_id ?? null,
      factoryName: factory?.name ?? visit?.factories?.name ?? "—",
      region: factory?.region ?? visit?.factories?.region ?? null,
      city: factory?.city ?? visit?.factories?.city ?? null,
      visitId: visit?.id ?? null,
      inspectorName: localePersonName(sourceInspectorName),
      assignmentCount: sourceInspectorName
        ? monitored.filter(item => item.assignments?.[0]?.profiles?.full_name === sourceInspectorName).length
        : 0,
      lastGeoAt: latestGeoEvent ? fmtTs(Date.parse(latestGeoEvent.occurred_at)) : null,
      riskScore: factory?.risk_score ?? null,
      riskRank: factory ? riskRankByFactory.get(factory.id) ?? null : null,
      riskRankTotal: rankedFactories.length,
      activeVisitCount: factory ? activeCountByFactory.get(factory.id) ?? 0 : 0,
      openActionCount: factory ? actionCountByFactory.get(factory.id) ?? 0 : 0,
    };
  };
  const mapEntries: OperationsMapEntry[] = pins.map(pin => {
    const visit = pin.kind === "visit"
      ? monitored.find(item => `v:${item.id}` === pin.id)
      : undefined;
    const factoryId = visit?.factories?.id ?? visit?.factory_id ?? pin.id.replace(/^f:/, "");
    const factory = scopedFactories.find(item => item.id === factoryId);
    return {
      ...pin,
      ...previewFields(factory, visit),
      state: visit ? enumLabel(visit.operational_state) : t("ops.map.factoryState", "Factory"),
    };
  });
  const regionalMapEntries: OperationsMapEntry[] = scopedFactories
    .filter(factory => factory.official_lat != null && factory.official_lng != null)
    .map(factory => ({
      id: `regional:${factory.id}`,
      kind: "factory",
      lat: Number(factory.official_lat),
      lng: Number(factory.official_lng),
      label: factory.name,
      tone: "neutral",
      href: `/factories/${factory.id}`,
      ...previewFields(factory, undefined),
      state: t("ops.map.factoryState", "Factory"),
    }));
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
      description: `${action.inspections?.visits?.factories?.name ?? localePersonName(action.owner_name) ?? action.id.slice(0, 8)} · ${action.required_correction ?? enumLabel(action.status)}`,
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
      label: t("ops.highlights.override", "Location exception decision required"),
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
    heading: t("ops.export.heading", "Export CSV:"),
    scopeNote: t("ops.export.scopeNote", "The receipt and CSV use this exact region/city scope and row count."),
    authorizing: t("ops.export.authorizing", "Authorizing and recording export…"),
    authorized: t("ops.export.authorized", "Export authorized. Receipt:"),
    unavailable: t("ops.export.unavailable", "Export authorization is unavailable. No file was generated."),
  };
  const exportFilters = {
    // The RPC requires `region` to equal an Operations actor's assigned region.
    // Preserve the independently selected view filter as well so the receipt
    // and audit event describe the exact row-producing intersection.
    region: routeRoleKeys.includes("admin") ? region : authorizedScope,
    view_region: region,
    city,
  };
  const exportDatasets: ExportDataset[] = [
    {
      key: "visits",
      label: t("ops.export.monitoring", "Live monitoring"),
      filename: "ops_monitoring.csv",
      filters: exportFilters,
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
      key: "alerts",
      label: t("ops.export.alerts", "Operational alerts"),
      filename: "ops_alerts.csv",
      filters: exportFilters,
      headers: [
        t("ops.export.alertType", "Alert type"),
        t("ops.export.alertSummary", "Summary"),
        t("ops.export.alertTime", "Recorded at"),
        t("ops.export.alertDestination", "Destination"),
      ],
      rows: highlights.map(item => [item.label, item.description, fmtTs(item.at), item.href]),
    },
    {
      key: "kpis",
      label: t("ops.export.kpis", "KPI contract"),
      filename: "ops_kpi_contract.csv",
      filters: exportFilters,
      headers: [
        t("ops.kpi.metric", "Metric"),
        t("ops.kpi.status", "Source status"),
        t("ops.kpi.formula", "Published formula"),
        t("ops.kpi.policyVersion", "Policy version"),
      ],
      rows: (operationsKpiContract?.definitions ?? []).map(definition => [
        kpiMetricLabel(definition.metric_key),
        definition.source_status,
        definition.formula ?? local("Not configured", "غير مهيأ"),
        operationsKpiContract?.policy_version != null
          ? String(operationsKpiContract.policy_version)
          : local("Not configured", "غير مهيأ"),
      ]),
    },
  ];
  const mayManageOperations = routeRoleKeys.includes("supervisor");
  // CR-440: workload is a roll-up over every assigned visit in the currently
  // authorized geography, not only the active monitoring subset. "Completed"
  // maps to the terminal field-work state `submitted`; overdue comes from the
  // same governed SLA calculation rendered above.
  const overdueVisitIds = new Set(
    slaFlags
      .filter(flag => flag.kind === "overdue_start" || flag.kind === "overdue_submit")
      .map(flag => flag.visit.id),
  );
  const workloadByInspector = new Map<string, {
    inspector: string; assigned: number; active: number; completed: number; overdue: number;
  }>();
  for (const visit of visits) {
    if (!visit.assignments?.[0]?.profiles) continue;
    const inspector = localePersonName(visit.assignments?.[0]?.profiles?.full_name)
      ?? local("Inspector name unavailable", "اسم المفتش غير متاح");
    const row = workloadByInspector.get(inspector)
      ?? { inspector, assigned: 0, active: 0, completed: 0, overdue: 0 };
    row.assigned += 1;
    if (["on_the_way", "arrived", "executing"].includes(visit.operational_state)) row.active += 1;
    if (visit.operational_state === "submitted") row.completed += 1;
    if (overdueVisitIds.has(visit.id)) row.overdue += 1;
    workloadByInspector.set(inspector, row);
  }
  const workloadRows = [...workloadByInspector.values()]
    .sort((a, b) => b.active - a.active || b.assigned - a.assigned || a.inspector.localeCompare(b.inspector));
  const geoHistoryRows = scopedGeo.slice(0, 100);
  const contractValue = (value: unknown) => {
    if (value == null) return local("Not configured", "غير مهيأ");
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
  };

  return (
    <Shell current="/operations" title="">
      {loadErrors.length > 0 && (
        <div className="sq-banner sq-banner--critical" role="alert"><div>
          <strong>{t("ops.err.partial", "Some information could not be loaded.")}</strong> {loadErrors.join(" · ")}.{" "}
          <a className="sq-link" href="/operations">{t("ops.err.retry", "Retry")}</a>
        </div></div>
      )}
      {outOfScopeRecordCount > 0 && (
        <div className="sq-sr-only" role="status"><div>
          {t(
            "ops.outOfScopeGeography",
            local(
              "Records outside your authorized region are excluded from this view. Excluded records:",
              "تُستبعد السجلات خارج نطاقك الجغرافي المخوَّل من هذا العرض. السجلات المستبعدة:",
            ),
          )} <strong>{outOfScopeRecordCount}</strong>
        </div></div>
      )}

      <RevampOperationsCenter
        locale={locale}
        view={view}
        mapViewHref={mapViewHref}
        performanceViewHref={performanceViewHref}
        mapEntries={mapEntries}
        regionalMapEntries={regionalMapEntries}
        mapStrings={mapWorkspaceStrings}
        counts={counts}
        monitoredCount={monitored.length}
        highlights={highlights}
        regions={regionSummaries}
      />

      <div className={styles.operationalDetails}>
        <Card as="section" labelledBy="operations-monitoring-heading">
          <CardHeader
            level="h2"
            titleId="operations-monitoring-heading"
            title={opsText.monitoring.title}
            description={opsText.monitoring.description}
            trailing={
              <OperationsScopeFilter
                view={view}
                region={region}
                city={city}
                regions={regions}
                cities={cities}
                basePath="/operations"
                strings={opsText.scope}
              />
            }
          />
          <CardBody>
          <OperationsMonitoringTable
            rows={monitorRows}
            refreshedAt={nowIso}
            enumLabels={enumLabels}
            strings={{
              visit: monitoringStrings.thVisit,
              factory: monitoringStrings.thFactory,
              state: monitoringStrings.thOperational,
              geofence: monitoringStrings.thGeofence,
              inspector: monitoringStrings.thInspector,
              emptyTitle: monitoringStrings.emptyTitle,
              emptyBody: monitoringStrings.emptyDesc,
              refreshedAt: monitoringStrings.refreshedAt,
              autoNote: monitoringStrings.autoNote,
            }}
          />
          </CardBody>
        </Card>

        <OperationsSlaTable rows={slaAlertRows} strings={{
          title: opsText.sla.title,
          description: opsText.sla.description,
          visit: opsText.sla.visit,
          factory: opsText.sla.factory,
          deadline: opsText.sla.deadline,
          status: opsText.sla.status,
          escalation: opsText.sla.escalation,
          emptyTitle: opsText.sla.emptyTitle,
        }} />

        <OperationsKpiContract
          configured={Boolean(operationsKpiContract?.configured)}
          unavailable={Boolean(kpiContractRpc.error)}
          unauthorized={operationsKpiContract?.authorized === false}
          facts={[
            { label: t("ops.kpi.period", "Calculation period"), value: contractValue(operationsKpiContract?.period) },
            { label: t("ops.kpi.timezone", "Timezone"), value: contractValue(operationsKpiContract?.timezone) },
            { label: t("ops.kpi.policyVersion", "Policy version"), value: contractValue(operationsKpiContract?.policy_version) },
            { label: t("ops.kpi.decision", "Decision authority"), value: operationsKpiContract?.decision ?? t("common.notConfigured", "Not configured") },
          ]}
          rows={(operationsKpiContract?.definitions ?? []).map(definition => ({
            key: definition.metric_key,
            metric: kpiMetricLabel(definition.metric_key),
            sourceStatus: enumLabel(definition.source_status),
            formula: definition.formula ?? null,
          }))}
          strings={{
            title: t("ops.kpi.contractHeading", "Operations KPI contract"),
            configured: t("ops.kpi.configured", "Published policy metadata and metric definitions are active."),
            notConfigured: t("ops.kpi.notConfigured", "Policy or published metric definitions are not set up. Undefined formulas stay unavailable."),
            metric: t("ops.kpi.metric", "Metric"),
            status: t("ops.kpi.status", "Source status"),
            formula: t("ops.kpi.formula", "Published formula"),
            unavailableTitle: t("ops.kpi.unavailable", "KPI contract service unavailable"),
            unavailableBody: t("ops.err.retry", "Retry"),
            unauthorizedTitle: t("ops.kpi.unauthorized", "KPI contract access is not authorized for this role"),
            emptyTitle: t("ops.kpi.emptyDefinitions", "No published metric definitions"),
            missing: local("Not configured", "غير مهيأ"),
          }}
        />

        <OperationsWorkloadTable
          rows={workloadRows}
          strings={{
            title: t("ops.workload.heading", "Inspector workload"),
            description: t("ops.workload.body", "Assigned, active, submitted and overdue visits in the current authorized geography."),
            inspector: monitoringStrings.thInspector,
            assigned: t("ops.workload.assigned", "Assigned"),
            active: t("ops.workload.active", "Active"),
            completed: t("ops.workload.completed", "Submitted"),
            overdue: t("ops.workload.overdue", "Overdue"),
            emptyTitle: t("ops.workload.empty", "No inspector workload in this scope"),
          }}
        />

        <OperationsRiskTable
          rows={highRisk.map<RiskRow>(factory => ({
            id: factory.id,
            name: factory.name,
            href: `/factories/${factory.id}`,
            location: [factory.region, factory.city].filter(Boolean).join(" · ") || "—",
            score: factory.risk_score != null ? Number(factory.risk_score).toFixed(1) : local("Not configured", "غير مهيأ"),
            band: (factory.risk_band as RiskBand | null) ?? null,
            bandLabel: factory.risk_band ? enumLabel(factory.risk_band) : "",
          }))}
          strings={{
            title: t("ops.risk.heading", "Risk monitoring"),
            description: t("ops.risk.body", "Read-only Risk Engine outputs in the current authorized scope."),
            factory: t("ops.risk.th.factory", "Factory"),
            location: t("ops.risk.th.location", "Location"),
            score: t("ops.risk.th.score", "Score"),
            band: t("ops.risk.th.band", "Band"),
            emptyTitle: t("ops.risk.empty", "No configured risk scores in this scope"),
            missing: local("Not configured", "غير مهيأ"),
          }}
        />

        <OperationsAlerts
          actions={actions.map<AlertRow>(action => ({
            id: action.id,
            title: action.inspections?.visits?.factories?.name ?? action.form_type,
            description: action.required_correction ?? enumLabel(action.status),
            meta: action.due_at
              ? formatDateTime(action.due_at, locale === "ar" ? "ar" : "en")
              : local("No due date set", "لا يوجد تاريخ استحقاق محدد"),
            action: mayManageOperations
              ? <ActionFormControls actionFormId={action.id} status={action.status} strings={actionControlStrings} />
              : <StatusPill tone="neutral" size="sm" ping={false}>{t("ops.readOnly", "Read only")}</StatusPill>,
          }))}
          notifications={notifs.map<AlertRow>(notification => ({
            id: notification.id,
            title: enumLabel(notification.event_key),
            description: `${t(`enum.channel.${notification.channel}`, notification.channel === "inapp" ? "In-app" : humaniseEnum(notification.channel))} · ${formatDateTime(notification.created_at, locale === "ar" ? "ar" : "en")}`,
            status: {
              label: enumLabel(notification.delivery_state),
              tone: DELIVERY_TONE[notification.delivery_state] ?? "neutral",
            },
            action: mayManageOperations && notification.delivery_state !== "handled"
              ? <MarkNotificationHandled notificationId={notification.id} strings={markHandledStrings} />
              : null,
          }))}
          strings={{
            title: t("ops.alerts.heading", "Operational alerts and corrective actions"),
            description: t("ops.alerts.body", "Action forms and notification status you can see here. The database still protects any changes."),
            actionsHeading: t("ops.actions.heading", "Corrective actions"),
            actionsEmpty: t("ops.actions.empty", "No open corrective actions."),
            notificationsHeading: t("ops.notifs.heading", "Notification delivery"),
            notificationsEmpty: t("ops.notifs.empty", "No notification events."),
            emptyTitle: t("ops.alerts.empty", "No operational alerts in this scope"),
          }}
        />

        <OperationsCancellations
          rows={cancellationHistoryRows.map<CancellationRow>(row => ({
            id: row.id,
            visitHref: `/visits/${row.visit_id}`,
            visitLabel: row.visit_id.slice(0, 8),
            factoryName: row.factory_name ?? "—",
            inspectorName: row.inspector_name ?? "—",
            region: row.region ?? "—",
            reason: `${row.reason_label}${row.decision_reason ? ` · ${row.decision_reason}` : ""}`,
            status: enumLabel(row.status),
            statusKey: row.status,
            requestedAt: formatDateTime(row.requested_at, locale === "ar" ? "ar" : "en"),
            requestedAtIso: row.requested_at,
            decidedAt: row.decided_at ? formatDateTime(row.decided_at, locale === "ar" ? "ar" : "en") : null,
            decidedAtIso: row.decided_at,
          }))}
          strings={{
            title: t("ops.cancellations.heading", "Cancellation monitoring"),
            description: t("ops.cancellations.body", "Recent cancellation requests, reasons and final decisions you can see. These decisions can't change."),
            visit: monitoringStrings.thVisit,
            factory: monitoringStrings.thFactory,
            inspector: monitoringStrings.thInspector,
            region: monitoringStrings.regionLabel,
            reason: t("ops.cancellations.reason", "Reason"),
            status: t("ops.cancellations.status", "Status"),
            requested: t("ops.cancellations.requested", "Requested"),
            decided: t("ops.cancellations.decided", "Decided"),
            emptyTitle: t("ops.cancellations.empty", "No cancellation history in this scope"),
            missing: "—",
          }}
        />

        {mayManageOperations ? (
          <>
            <OverrideQueue rows={overrideQueueRows} strings={overrideQueueStrings} locale={locale} />
            <CancellationQueue rows={cancellationQueueRows} strings={cancellationQueueStrings} locale={locale} />
          </>
        ) : (
          <Card as="section">
            <CardBody>
              <EmptyState
                icon="restricted"
                title={t("ops.decisions.readOnly", "These decisions are read-only for your role")}
                description={t("ops.decisions.readOnlyBody", "Only an authorized Operations supervisor can decide location exceptions or active-session cancellations.")}
              />
            </CardBody>
          </Card>
        )}

        <OperationsTimeline
          options={monitored.map(visit => ({
            value: visit.id,
            label: `${visit.factories?.name ?? visit.id.slice(0, 8)} · ${visit.id.slice(0, 8)}`,
          }))}
          selected={timelineVisitId ?? ""}
          scope={{
            ...(view === "performance" ? { view: "performance" } : {}),
            ...(region ? { region } : {}),
            ...(city ? { city } : {}),
          }}
          events={operationsTimeline.map<TimelineEvent>(event => ({
            id: `${event.object_type}:${event.object_id}:${event.event_key}`,
            dateTime: event.occurred_at,
            time: formatDateTime(event.occurred_at, locale === "ar" ? "ar" : "en"),
            title: enumLabel(event.event_key),
            meta: event.object_type,
            detail: <code>{JSON.stringify(event.payload)}</code>,
          }))}
          unavailable={Boolean(timelineRpc.error)}
          strings={{
            title: t("ops.timeline.heading", "Visit timeline"),
            description: t("ops.timeline.body", "The full order of events, from planning through inspection, review and handoff to Compliance."),
            label: t("ops.timeline.choose", "Choose a visit timeline"),
            placeholder: t("ops.timeline.selectPlaceholder", "Select visit"),
            load: t("ops.timeline.load", "Load timeline"),
            selectPrompt: t("ops.timeline.select", "Select a visit to load its timeline"),
            unavailableTitle: t("ops.timeline.unavailable", "Visit timeline unavailable"),
            unavailableBody: t("ops.err.retry", "Retry"),
            emptyTitle: t("ops.timeline.empty", "No authorized timeline events for this visit"),
          }}
        />

        <OperationsHistoryTable
          rows={geoHistoryRows.map<HistoryRow>(event => ({
            id: event.id,
            occurredAt: formatDateTime(event.occurred_at, locale === "ar" ? "ar" : "en"),
            occurredAtIso: event.occurred_at,
            visitHref: `/visits/${event.visit_id}`,
            visitLabel: event.visit_id.slice(0, 8),
            event: enumLabel(event.kind),
            geofence: event.geofence_result ? enumLabel(event.geofence_result) : "—",
            position: Number.isFinite(Number(event.observed_lat)) && Number.isFinite(Number(event.observed_lng))
              ? `${Number(event.observed_lat).toFixed(6)}, ${Number(event.observed_lng).toFixed(6)}`
              : "—",
          }))}
          strings={{
            title: t("ops.history.heading", "Location and visit status history"),
            description: t("ops.history.body", "The last 100 events from the location history log you can see. These records are never changed here."),
            time: t("ops.history.time", "Recorded at"),
            visit: monitoringStrings.thVisit,
            event: t("ops.history.event", "Event"),
            geofence: monitoringStrings.thGeofence,
            position: t("ops.history.position", "Recorded position"),
            emptyTitle: t("ops.history.empty", "No recorded location history in this scope"),
          }}
        />

        <OperationsExport
          authorized={routeRoleKeys.some(role => ["supervisor", "admin"].includes(role))}
          strings={{
            title: t("ops.export.heading", "Export data"),
            description: t("ops.export.auditRequired", "Every file needs a matching database receipt for your role and region, plus a recorded audit event, before you can download it."),
            unauthorizedTitle: t("ops.export.unauthorized", "Export is not authorized for this role"),
          }}
        >
          <OpsExport datasets={exportDatasets} strings={exportStrings} />
        </OperationsExport>
      </div>
    </Shell>
  );
}
