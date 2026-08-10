import { redirect } from "next/navigation";
import { getLocale, type Locale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation, BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";
import { resolveRegionId } from "@/lib/ksa-regions";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { CLEAN_FACTORY_CODES, isCleanFactory } from "./factory-codes";
import type { OperationsScope } from "./scope";
import type {
  ActionRow, EngineRow, EvidenceRow, FactoryRow, GeoRow, NotifRow, OverrideRow, VisitRow,
} from "./types";
import { loadActionForms, loadVisits } from "./sources/visits";
import { loadFactories, loadRiskBoard } from "./sources/factories";
import { loadEngineSettings, loadNotifications, loadOverrideEvidence, loadPendingOverrides } from "./sources/alerts";
import { loadGeoEvents } from "./sources/geo";
import { loadAuthorizedScope } from "./sources/profile";
import {
  loadCancellationEvidence, loadCancellationRequests, loadReturnedInspections,
  type CancellationRequestRow, type ReturnedInspectionRow,
} from "./sources/execution";

type OperationsClient = Awaited<ReturnType<typeof supabaseServer>>;

export type OverrideQueueEntry = {
  id: string; visit_id: string; reason_label: string; explanation: string;
  safety_security_exception: boolean; observed_lat: number; observed_lng: number;
  accuracy_m: number; distance_m: number; device_occurred_at: string;
  requested_at: string; expires_at: string; evidence_count: number;
  evidence_url: string | null; factory_name: string | null; inspector_name: string | null;
};

export type CancellationQueueEntry = {
  id: string; visit_id: string; phase: string; reason_label: string; comment: string | null;
  requested_at: string; factory_name: string | null; inspector_name: string | null;
  evidence_url: string | null;
};

export type CancellationHistoryEntry = {
  id: string; visit_id: string; factory_name: string | null; inspector_name: string | null;
  region: string | null; reason_label: string; status: string;
  requested_at: string; decided_at: string | null; decision_reason: string | null;
};

export type ResubmissionSourceRow = {
  inspection_id: string; visit_id: string; factory_name: string | null; returned_at: string;
};

export type OperationsKpiDefinition = {
  metric_key: string; formula: string | null; source_lineage: unknown;
  definition_version: number | null; source_status: string;
};

export type OperationsKpiContractData = {
  authorized?: boolean; configured?: boolean; decision?: string; period?: unknown;
  timezone?: unknown; policy_version?: number | null; blocked_by?: string;
  definitions?: OperationsKpiDefinition[];
};

export type OperationsData = {
  locale: Locale;
  routeRoleKeys: string[];
  authorizedScope: string;
  now: number;
  nowIso: string;
  loadErrors: string[];
  outOfScopeRecordCount: number;
  visits: VisitRow[];
  geo: GeoRow[];
  actions: ActionRow[];
  notifs: NotifRow[];
  factories: FactoryRow[];
  engines: EngineRow[];
  highRisk: FactoryRow[];
  overrideQueueRows: OverrideQueueEntry[];
  cancellationQueueRows: CancellationQueueEntry[];
  cancellationHistoryRows: CancellationHistoryEntry[];
  resubmissionSources: ResubmissionSourceRow[];
  kpiContract: OperationsKpiContractData | null;
  kpiContractUnavailable: boolean;
};

export type OperationsPageResult = { kind: "denied" } | { kind: "ready"; data: OperationsData };

export function localePersonName(locale: Locale, name: string | null | undefined): string | null {
  const value = name?.trim();
  if (!value) return null;
  const hasArabic = /[؀-ۿ]/.test(value);
  if ((locale === "ar") === hasArabic) return value;
  return locale === "ar" ? "الاسم غير متاح بالعربية" : "Name unavailable in English";
}

type GeographyFilter = (r: string | null, c: string | null) => boolean;

const isVerificationFactory = (
  factory: { source?: string | null; name?: string | null; factory_code?: string | null } | null | undefined,
) =>
  factory?.source === "verification_fixture" || isTestFixtureEstablishment(factory);

async function signEvidenceUrls(
  sb: OperationsClient,
  entries: { key: string; path: string }[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  await Promise.all(entries.map(async entry => {
    const { data: signed } = await sb.storage.from("evidence").createSignedUrl(entry.path, 600);
    if (signed?.signedUrl && !urls.has(entry.key)) urls.set(entry.key, signed.signedUrl);
  }));
  return urls;
}

async function readCancellations(
  sb: OperationsClient,
  locale: Locale,
  inAuthorizedGeography: GeographyFilter,
  reasonLabels: Map<string, string>,
): Promise<{
  queueRows: CancellationQueueEntry[];
  historyRows: CancellationHistoryEntry[];
  outOfScopeCancellationCount: number;
  failed: boolean;
}> {
  const cancelRead = await loadCancellationRequests(sb);
  if (cancelRead.failed) {
    const tableAbsent = cancelRead.reason?.includes("cancellation_requests") ?? false;
    return { queueRows: [], historyRows: [], outOfScopeCancellationCount: 0, failed: !tableAbsent };
  }
  const integrityFilteredRows: CancellationRequestRow[] = cancelRead.rows;
  const rows = integrityFilteredRows
    .filter(row => isCleanFactory(row.visits?.factories)
      && inAuthorizedGeography(
        row.visits?.factories?.region ?? null,
        row.visits?.factories?.city ?? null,
      ));
  const outOfScopeCancellationCount = integrityFilteredRows.length - rows.length;
  const pendingRows = rows.filter(row => row.status === "pending");
  const evidenceIds = pendingRows.map(r => r.evidence_id).filter((v): v is string => !!v);
  const evidenceUrls = evidenceIds.length > 0
    ? await loadCancellationEvidence(sb, evidenceIds).then(result =>
      signEvidenceUrls(sb, result.rows
        .flatMap(evidence => evidence.storage_path ? [{ key: evidence.id, path: evidence.storage_path }] : [])))
    : new Map<string, string>();
  const queueRows = pendingRows.map(row => ({
    id: row.id, visit_id: row.visit_id, phase: row.phase,
    reason_label: reasonLabels.get(row.reason_key) ?? row.reason_key,
    comment: row.comment, requested_at: row.requested_at,
    factory_name: row.visits?.factories?.name ?? null,
    inspector_name: localePersonName(locale, row.visits?.assignments?.[0]?.profiles?.full_name),
    evidence_url: row.evidence_id ? evidenceUrls.get(row.evidence_id) ?? null : null,
  }));
  const historyRows = rows.map(row => ({
    id: row.id,
    visit_id: row.visit_id,
    factory_name: row.visits?.factories?.name ?? null,
    inspector_name: localePersonName(locale, row.visits?.assignments?.[0]?.profiles?.full_name),
    region: row.visits?.factories?.region ?? null,
    reason_label: reasonLabels.get(row.reason_key) ?? row.reason_key,
    status: row.status,
    requested_at: row.requested_at,
    decided_at: row.decided_at,
    decision_reason: row.decision_reason,
  }));
  return { queueRows, historyRows, outOfScopeCancellationCount, failed: false };
}

function toResubmissionSources(
  rows: ReturnedInspectionRow[],
  scope: OperationsScope,
  inAuthorizedGeography: GeographyFilter,
): ResubmissionSourceRow[] {
  return rows
    .map(row => {
      const decided = (row.reviews ?? [])
        .filter(r => r.decision === "return" && !!r.decided_at)
        .map(r => r.decided_at)
        .filter((v): v is string => !!v)
        .sort()
        .pop();
      if (!decided) return null;
      const f = row.visits?.factories ?? null;
      if (!isCleanFactory(f) || !inAuthorizedGeography(f?.region ?? null, f?.city ?? null)) return null;
      if (scope.region && f?.region !== scope.region) return null;
      if (scope.city && f?.city !== scope.city) return null;
      return { inspection_id: row.id, visit_id: row.visit_id, factory_name: f?.name ?? null, returned_at: decided };
    })
    .filter((x): x is ResubmissionSourceRow => !!x);
}

export async function loadOperationsPage(scope: OperationsScope): Promise<OperationsPageResult> {
  const locale = await getLocale();
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
  const hasOperationalRole = routeRoleKeys.some(role => BUSINESS_ROLE_KEYS.includes(role) || role === "admin");
  const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;
  if (!mayViewOperations) return { kind: "denied" };

  const authorizedScope = await loadAuthorizedScope(sb, user.id);
  const authorizedRegionId = resolveRegionId(authorizedScope || null);
  const inAuthorizedGeography: GeographyFilter = (r, c) => {
    if (!authorizedScope) return true;
    if (authorizedRegionId) return resolveRegionId(r) === authorizedRegionId;
    const normalized = authorizedScope.toLocaleLowerCase("en");
    return [r, c].some(value => value?.trim().toLocaleLowerCase("en") === normalized);
  };

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const [visitsRes, actionsRes, notifsRes, factoriesRes, engineRes, riskRes, overrideRes, overrideEvidenceRes, returnedRes, kpiContractRpc] = await Promise.all([
    loadVisits(sb),
    loadActionForms(sb),
    loadNotifications(sb),
    loadFactories(sb, CLEAN_FACTORY_CODES),
    loadEngineSettings(sb),
    loadRiskBoard(sb, CLEAN_FACTORY_CODES),
    loadPendingOverrides(sb, nowIso),
    loadOverrideEvidence(sb),
    loadReturnedInspections(sb),
    sb.rpc("operations_kpi_contract"),
  ]);

  const integrityFilteredVisits = visitsRes.rows
    .filter(visit => isCleanFactory(visit.factories) && !isVerificationFactory(visit.factories));
  const visits = integrityFilteredVisits
    .filter(visit => inAuthorizedGeography(visit.factories?.region ?? null, visit.factories?.city ?? null));
  const outOfScopeVisitCount = integrityFilteredVisits.length - visits.length;

  const geoVisitIds = visits
    .filter(visit =>
      (visit.planning_status === "published"
        || ["on_the_way", "arrived", "executing"].includes(visit.operational_state))
      && (!scope.region || visit.factories?.region === scope.region)
      && (!scope.city || visit.factories?.city === scope.city))
    .map(visit => visit.id);
  const geoRes = await loadGeoEvents(sb, geoVisitIds, nowIso);
  const geo = geoRes.rows
    .slice()
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)
      || a.id.localeCompare(b.id));

  const loadErrors = [
    visitsRes.failed && "visit monitoring",
    geoRes.failed && "geofence events",
    actionsRes.failed && "corrective actions",
    notifsRes.failed && "notifications",
    factoriesRes.failed && "factory list",
    engineRes.failed && "engine settings",
    riskRes.failed && "risk board",
    overrideRes.failed && "location exception requests",
    overrideEvidenceRes.failed && "override evidence",
  ].filter((label): label is string => Boolean(label));
  if (kpiContractRpc.error) console.error(`[operations] KPI contract read failed: ${kpiContractRpc.error.message}`);

  const actions = actionsRes.rows.filter(action => {
    const factory = action.inspections?.visits?.factories;
    return isCleanFactory(factory) && inAuthorizedGeography(factory?.region ?? null, factory?.city ?? null);
  });
  const notifs: NotifRow[] = notifsRes.rows;
  const factories = factoriesRes.rows
    .filter(factory => isCleanFactory(factory) && !isVerificationFactory(factory)
      && inAuthorizedGeography(factory.region, factory.city));
  const engines: EngineRow[] = engineRes.rows;
  const highRisk = riskRes.rows
    .filter(factory => isCleanFactory(factory) && !isVerificationFactory(factory)
      && inAuthorizedGeography(factory.region, factory.city));
  const integrityFilteredOverrides: OverrideRow[] = overrideRes.rows;
  const overrides = integrityFilteredOverrides
    .filter(row => isCleanFactory(row.visits?.factories)
      && inAuthorizedGeography(
        row.visits?.factories?.region ?? null,
        row.visits?.factories?.city ?? null,
      ));
  const outOfScopeOverrideCount = integrityFilteredOverrides.length - overrides.length;

  const overrideEvidence: EvidenceRow[] = overrideEvidenceRes.rows;
  const evidenceByRequest = new Map<string, number>();
  for (const evidence of overrideEvidence) {
    evidenceByRequest.set(evidence.linked_id, (evidenceByRequest.get(evidence.linked_id) ?? 0) + 1);
  }
  const overrideIds = new Set(overrides.map(row => row.id));
  const evidenceUrls = await signEvidenceUrls(sb, overrideEvidence
    .filter(evidence => overrideIds.has(evidence.linked_id))
    .flatMap(evidence => evidence.storage_path ? [{ key: evidence.linked_id, path: evidence.storage_path }] : []));
  const overrideQueueRows: OverrideQueueEntry[] = overrides.map(row => ({
    id: row.id, visit_id: row.visit_id, reason_label: row.reason_label, explanation: row.explanation,
    safety_security_exception: row.safety_security_exception, observed_lat: Number(row.observed_lat), observed_lng: Number(row.observed_lng),
    accuracy_m: Number(row.accuracy_m), distance_m: Number(row.distance_m), device_occurred_at: row.device_occurred_at,
    requested_at: row.requested_at, expires_at: row.expires_at, evidence_count: evidenceByRequest.get(row.id) ?? 0,
    evidence_url: evidenceUrls.get(row.id) ?? null,
    factory_name: row.visits?.factories?.name ?? null,
    inspector_name: localePersonName(locale, row.visits?.assignments?.[0]?.profiles?.full_name),
  }));

  const fieldCfg = (engines.find(e => e.engine === "field")?.settings ?? {}) as
    { cancellation_reasons?: { key: string; en: string; ar?: string }[] };
  const reasonLabels = new Map((fieldCfg.cancellation_reasons ?? []).map(r =>
    [r.key, (locale === "ar" && r.ar) ? r.ar : r.en]));
  const cancellations = await readCancellations(sb, locale, inAuthorizedGeography, reasonLabels);
  if (cancellations.failed) loadErrors.push("cancellation requests");
  const outOfScopeCancellationCount = cancellations.outOfScopeCancellationCount;

  if (returnedRes.failed) loadErrors.push("resubmission deadlines");
  const resubmissionSources = returnedRes.failed
    ? []
    : toResubmissionSources(returnedRes.rows, scope, inAuthorizedGeography);

  const outOfScopeRecordCount = outOfScopeVisitCount + outOfScopeOverrideCount + outOfScopeCancellationCount;
  const kpiContract: OperationsKpiContractData | null = kpiContractRpc.error
    ? null
    : (kpiContractRpc.data ?? null) as OperationsKpiContractData | null;

  return {
    kind: "ready",
    data: {
      locale,
      routeRoleKeys,
      authorizedScope,
      now,
      nowIso,
      loadErrors,
      outOfScopeRecordCount,
      visits,
      geo,
      actions,
      notifs,
      factories,
      engines,
      highRisk,
      overrideQueueRows,
      cancellationQueueRows: cancellations.queueRows,
      cancellationHistoryRows: cancellations.historyRows,
      resubmissionSources,
      kpiContract,
      kpiContractUnavailable: Boolean(kpiContractRpc.error),
    },
  };
}
