export type FactoryRef = {
  id: string;
  name: string;
  factory_code: string | null;
  region: string | null;
  city: string | null;
  activity_class: string | null;
  risk_score: number | null;
  risk_band: string | null;
  is_temporary: boolean;
  // Optional governed geography — present only on the top-level factories query
  // used by the National Decision Canvas. Nested factory sub-selects omit them.
  official_lat?: number | null;
  official_lng?: number | null;
  geofence_radius_m?: number | null;
};

export type VisitScopeRef = {
  factory_id: string | null;
  factories: FactoryRef | null;
};

export type VisitRow = VisitScopeRef & {
  id: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  window_end: string;
  priority: string | null;
  cancellation_reason: string | null;
  created_at: string;
  assignments: { inspector_id: string; profiles: { full_name: string } | null }[] | null;
};

export type InspectionRow = {
  id: string;
  visit_id: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  visits: (VisitScopeRef & { window_start: string }) | null;
};

export type ReviewRow = {
  id: string;
  inspection_id: string;
  status: string;
  decision: string | null;
  decided_at: string | null;
  inspections: { submitted_at: string | null; visits: (VisitScopeRef & { window_start: string }) | null } | null;
};

export type ResponseRow = {
  inspection_id: string;
  is_complete: boolean;
  response: { value?: string } | null;
  inspections: { submitted_at: string | null; visits: VisitScopeRef | null } | null;
  inspection_items: {
    regulation_clauses: { regulations: { title: string; issuing_authority: string | null } | null } | null;
  } | null;
};

export type ChecklistItemRow = {
  id: string;
  active: boolean;
  regulation_clauses: {
    regulations: { issuing_authority: string | null; status: string } | null;
  } | null;
};

export type ViolationRow = {
  id: string;
  inspection_id: string;
  inspections: { submitted_at: string | null; visits: VisitScopeRef | null } | null;
  violation_codes: {
    title: string;
    level: string;
    regulation_clauses: { regulations: { title: string; issuing_authority: string | null } | null } | null;
  } | null;
};

export type GeoRow = {
  id: string;
  visit_id: string;
  kind: string;
  geofence_result: string | null;
  override_reason: string | null;
  occurred_at: string;
  observed_lat: number;
  observed_lng: number;
  visits: (VisitScopeRef & { planner_lat: number | null; planner_lng: number | null }) | null;
};

export type AuditRow = {
  id: number;
  object_type: string;
  object_id: string | null;
  action: string;
  requirement_refs: string[] | null;
  occurred_at: string;
};

export type DashboardSla = {
  review_business_days?: number;
  calendar?: { days?: string; tz?: string };
};

import { countChecklistCompliance } from "@/lib/dashboard-kpi/checklist-compliance";

export type DateScope = { fromMs: number; toMs: number };

/**
 * The reader's chosen window. Either end may be absent, and absent means
 * unbounded — not "last 30 days". The topbar shows "Any date" for this state,
 * and a default applied here would make that label a lie about what was counted.
 */
export type SelectedScope = { fromMs: number | null; toMs: number | null };

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function riyadhDateParts(ms: number) {
  const shifted = new Date(ms + RIYADH_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

function riyadhMidnightUtc(year: number, month: number, day: number) {
  return Date.UTC(year, month, day) - RIYADH_OFFSET_MS;
}

export function parseDateScope(
  from: string | undefined,
  to: string | undefined,
  nowMs: number,
): SelectedScope & { fromDate: string | null; toDate: string | null } {
  void nowMs;
  const parse = (value: string | undefined, end: boolean) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    if (!match) return null;
    const ms = riyadhMidnightUtc(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return end ? ms + DAY_MS - 1 : ms;
  };
  const parsedFrom = parse(from, false);
  const parsedTo = parse(to, true);
  const swap = parsedFrom !== null && parsedTo !== null && parsedFrom > parsedTo;
  const fromMs = swap ? parsedTo - (DAY_MS - 1) : parsedFrom;
  const toMs = swap ? parsedFrom + (DAY_MS - 1) : parsedTo;
  const isoDate = (ms: number | null) =>
    ms === null ? null : new Date(ms + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
  return { fromMs, toMs, fromDate: isoDate(fromMs), toDate: isoDate(toMs) };
}

export function riyadhTodayScope(nowMs: number): DateScope {
  const p = riyadhDateParts(nowMs);
  const fromMs = riyadhMidnightUtc(p.year, p.month, p.day);
  return { fromMs, toMs: fromMs + DAY_MS - 1 };
}

export function isInScope(iso: string | null | undefined, scope: DateScope | SelectedScope) {
  if (!iso) return false;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  return (scope.fromMs === null || ms >= scope.fromMs) && (scope.toMs === null || ms <= scope.toMs);
}

export function factoryInRegion(factory: FactoryRef | null | undefined, region: string) {
  return !region || factory?.region === region;
}

export function percent(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

function latestReviews(rows: ReviewRow[]) {
  const byInspection = new Map<string, ReviewRow>();
  for (const row of rows) {
    const existing = byInspection.get(row.inspection_id);
    const rowOpen = !row.decided_at;
    const existingOpen = !!existing && !existing.decided_at;
    const rowMs = Date.parse(row.decided_at ?? "") || 0;
    const existingMs = Date.parse(existing?.decided_at ?? "") || 0;
    if (!existing || (rowOpen && !existingOpen) || (rowOpen === existingOpen && rowMs >= existingMs)) byInspection.set(row.inspection_id, row);
  }
  return byInspection;
}

const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function configuredWorkingDays(spec: string | undefined) {
  const match = /^([A-Za-z]{3})-([A-Za-z]{3})$/.exec(spec ?? "");
  if (!match) return null;
  const first = DAY_INDEX[match[1].toLowerCase()];
  const last = DAY_INDEX[match[2].toLowerCase()];
  if (first == null || last == null) return null;
  const days = new Set<number>();
  for (let day = first; ; day = (day + 1) % 7) {
    days.add(day);
    if (day === last) break;
  }
  return days;
}

function addBusinessDays(startMs: number, count: number, working: Set<number>) {
  let cursor = startMs;
  let added = 0;
  while (added < count) {
    cursor += DAY_MS;
    const riyadhDay = new Date(cursor + RIYADH_OFFSET_MS).getUTCDay();
    if (working.has(riyadhDay)) added += 1;
  }
  return cursor;
}

export function buildDashboardMetrics(input: {
  visits: VisitRow[];
  inspections: InspectionRow[];
  reviews: ReviewRow[];
  responses: ResponseRow[];
  checklistItems?: ChecklistItemRow[];
  violations: ViolationRow[];
  geo: GeoRow[];
  audit: AuditRow[];
  factories: FactoryRef[];
  sla: DashboardSla;
  /**
   * OPS-KPI-002 "expiring soon" lead-time, expressed as the fraction of a
   * visit's execution window that must have elapsed before it counts as
   * expiring (governed SLA/urgency policy, ADM-DASH-007). Null/undefined when
   * no such policy is published — the metric then stays "N/A"
   * rather than hard-coding a threshold.
   */
  slaWarnAtFraction?: number | null;
  scope: SelectedScope;
  today: DateScope;
  region: string;
  nowMs: number;
}) {
  const { scope, today, region, nowMs } = input;
  const visits = input.visits.filter(v => factoryInRegion(v.factories, region));
  const inspections = input.inspections.filter(i => factoryInRegion(i.visits?.factories, region));
  const reviews = input.reviews.filter(r => factoryInRegion(r.inspections?.visits?.factories, region));
  const responses = input.responses.filter(r => factoryInRegion(r.inspections?.visits?.factories, region));
  const violations = input.violations.filter(v => factoryInRegion(v.inspections?.visits?.factories, region));
  const geo = input.geo.filter(g => factoryInRegion(g.visits?.factories, region));
  const factories = input.factories.filter(f => factoryInRegion(f, region));

  const checklistItemsByAuthority = new Map<string, number>();
  for (const item of input.checklistItems ?? []) {
    if (!item.active || item.regulation_clauses?.regulations?.status !== "published") continue;
    const authority = item.regulation_clauses.regulations.issuing_authority?.trim() || "Not recorded";
    checklistItemsByAuthority.set(authority, (checklistItemsByAuthority.get(authority) ?? 0) + 1);
  }
  const activePublishedChecklistItems = [...checklistItemsByAuthority.values()]
    .reduce((sum, count) => sum + count, 0);

  const scopedInspections = inspections.filter(i => isInScope(i.submitted_at, scope));
  const scopedInspectionIds = new Set(scopedInspections.map(i => i.id));
  const completedInspections = scopedInspections.length;

  // STR-KPI-007 inspection coverage — distinct factories with a qualifying
  // completed inspection ÷ distinct factories due under the published
  // inspection-cycle policy. Every factory is due at least once per cycle, so
  // the governed denominator is the distinct factory population in scope.
  const dueFactoryIds = new Set(
    input.factories.filter(f => factoryInRegion(f, region)).map(f => f.id),
  );
  const coveredFactoryIds = new Set(
    scopedInspections
      .map(i => i.visits?.factories?.id)
      .filter((id): id is string => !!id && dueFactoryIds.has(id)),
  );
  const inspectionCoverageRate = percent(coveredFactoryIds.size, dueFactoryIds.size);

  const scopedResponses = responses.filter(r => scopedInspectionIds.has(r.inspection_id) && r.is_complete);
  // Canonical shared checklist-compliance calculation (same definition the iPad
  // dashboard uses). Excludes na/unknown/incomplete; approval outcome is not compliance.
  const complianceCounts = countChecklistCompliance(scopedResponses);
  const compliant = complianceCounts.compliant;
  const nonCompliant = complianceCounts.nonCompliant;
  const answeredForCompliance = complianceCounts.eligible;

  const latest = latestReviews(reviews);
  const approvedInspectionIds = new Set(
    [...latest.values()].filter(r => r.status === "approved" || r.decision === "approve").map(r => r.inspection_id),
  );
  const approvedScoped = scopedInspections.filter(i => approvedInspectionIds.has(i.id)).length;

  // TASK-EXECUTION-MODULE-001 · Phase 7 (§29, D-025) — pending vs approved
  // compliance never mix. The OFFICIAL rate is computed over approved
  // inspections only (matching Factory 360's approved-only line); pending work
  // (submitted / under_review / returned — not yet approved) is reported as a
  // separate, explicitly labelled figure. The overall totals above are kept
  // for the explorer breakdowns — no information is removed.
  const approvedScopedIds = new Set(scopedInspections.filter(i => approvedInspectionIds.has(i.id)).map(i => i.id));
  const approvedScopedResponses = scopedResponses.filter(r => approvedScopedIds.has(r.inspection_id));
  const approvedComplianceCounts = countChecklistCompliance(approvedScopedResponses);
  const pendingComplianceCounts = countChecklistCompliance(scopedResponses.filter(r => !approvedScopedIds.has(r.inspection_id)));
  const approvedCompliant = approvedComplianceCounts.compliant;
  const approvedAnsweredForCompliance = approvedComplianceCounts.eligible;
  const pendingCompliant = pendingComplianceCounts.compliant;
  const pendingAnsweredForCompliance = pendingComplianceCounts.eligible;

  const scopedViolations = violations.filter(v => scopedInspectionIds.has(v.inspection_id));
  // An unbounded window has no "previous equal window", so there is no baseline
  // to compare against. Null travels to `comparison()` as direction "unknown";
  // a zero here would assert that nothing happened before, which is a different
  // and false claim.
  const previousScope: DateScope | null = scope.fromMs === null || scope.toMs === null
    ? null
    : { fromMs: scope.fromMs - (scope.toMs - scope.fromMs + 1), toMs: scope.fromMs - 1 };
  const previousViolations = previousScope === null
    ? null
    : violations.filter(v => isInScope(v.inspections?.submitted_at, previousScope)).length;

  const todayVisits = visits.filter(v => v.planning_status === "published" && isInScope(v.window_start, today));
  const todayCompleted = todayVisits.filter(v => v.operational_state === "submitted").length;

  const scopedVisits = visits.filter(v => isInScope(v.window_start, scope));
  const pipeline = new Map<string, number>();
  const pipelineStatuses = new Set(["draft", "published", "returned", "cancelled"]);
  for (const visit of visits) {
    const status = (visit.planning_status ?? "").toLowerCase();
    if (!pipelineStatuses.has(status)) continue;
    pipeline.set(status, (pipeline.get(status) ?? 0) + 1);
  }
  const planned = scopedVisits.filter(v => v.planning_status === "published").length;
  const completed = scopedVisits.filter(v => v.operational_state === "submitted").length;
  const cancelledRows = scopedVisits.filter(v => v.planning_status === "cancelled");
  const cancelled = cancelledRows.length;
  const eligibleForSla = scopedVisits.filter(v => v.planning_status === "published" && v.operational_state !== "submitted");
  const overdueRows = eligibleForSla.filter(v => Date.parse(v.window_end) < nowMs);
  // OPS-KPI-002 expiring soon — visits not yet overdue whose execution window
  // has passed the governed warn fraction (ADM-DASH-007). Null when the SLA
  // urgency policy is not published, so presentation can render "N/A".
  const warnFraction = input.slaWarnAtFraction;
  const expiringSoonRows = warnFraction == null ? null : eligibleForSla.filter(v => {
    const start = Date.parse(v.window_start);
    const end = Date.parse(v.window_end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return false;
    if (end < nowMs) return false; // already overdue — counted separately, never "soon"
    return nowMs >= start + warnFraction * (end - start);
  });
  const activeFieldRows = visits.filter(v =>
    ["on_the_way", "arrived", "executing", "executing_inspection"].includes((v.operational_state ?? "").toLowerCase()),
  );
  const activeField = activeFieldRows.length;
  const scopedLatestReviews = [...latest.values()].filter(r => isInScope(r.inspections?.submitted_at, scope));
  const awaitingRows = scopedLatestReviews.filter(r => r.status === "pending_review" || r.status === "under_review");
  const returnedRows = scopedLatestReviews.filter(r => r.status === "returned" || r.decision === "return");
  const rejectedRows = scopedLatestReviews.filter(r => r.status === "rejected" || r.decision === "reject");
  const approvedDecisionRows = scopedLatestReviews.filter(r => r.status === "approved" || r.decision === "approve");
  const decidedScoped = approvedDecisionRows.length + returnedRows.length + rejectedRows.length;
  const pendingApprovalsCount = inspections.filter(inspection => inspection.submitted_at).filter(inspection => {
    const review = latest.get(inspection.id);
    return !review || review.status === "pending_review" || review.status === "under_review" || !review.decision;
  }).length;
  const working = configuredWorkingDays(input.sla.calendar?.days);
  const reviewDays = input.sla.review_business_days;
  const reviewSlaConfigured = !!working && typeof reviewDays === "number";
  const overdueReviewRows = reviewSlaConfigured ? awaitingRows.filter(row => {
    const submittedMs = Date.parse(row.inspections?.submitted_at ?? "");
    return Number.isFinite(submittedMs) && nowMs > addBusinessDays(submittedMs, reviewDays, working!);
  }) : [];
  const highPriorityRows = scopedVisits.filter(v =>
    v.planning_status === "published" && v.operational_state !== "submitted" &&
    ["high", "critical"].includes((v.priority ?? "").toLowerCase()),
  );

  const durationRows = scopedInspections
    .map(i => ({ id: i.id, start: Date.parse(i.started_at ?? ""), end: Date.parse(i.submitted_at ?? "") }))
    .filter(x => Number.isFinite(x.start) && Number.isFinite(x.end) && x.end >= x.start);
  const avgDurationMs = durationRows.length
    ? Math.round(durationRows.reduce((sum, x) => sum + (x.end - x.start), 0) / durationRows.length)
    : null;

  const inspectorMap = new Map<string, { id: string; name: string; nameResolved: boolean; assigned: number; active: number; completed: number; overdue: number }>();
  for (const visit of scopedVisits) {
    for (const assignment of visit.assignments ?? []) {
      const row = inspectorMap.get(assignment.inspector_id) ?? {
        id: assignment.inspector_id,
        name: assignment.profiles?.full_name ?? assignment.inspector_id.slice(0, 8),
        nameResolved: Boolean(assignment.profiles?.full_name),
        assigned: 0,
        active: 0,
        completed: 0,
        overdue: 0,
      };
      row.assigned += 1;
      if (visit.planning_status === "published" && visit.operational_state !== "submitted") row.active += 1;
      if (visit.operational_state === "submitted") row.completed += 1;
      if (visit.planning_status === "published" && visit.operational_state !== "submitted" && Date.parse(visit.window_end) < nowMs) row.overdue += 1;
      inspectorMap.set(assignment.inspector_id, row);
    }
  }
  const workload = [...inspectorMap.values()].sort((a, b) => b.active - a.active || b.assigned - a.assigned || a.name.localeCompare(b.name));
  const activeInspectors = workload.filter(x => x.active > 0).length;

  const cancellationReasons = new Map<string, number>();
  for (const visit of scopedVisits.filter(v => v.planning_status === "cancelled")) {
    const reason = visit.cancellation_reason?.trim() || "Not recorded";
    cancellationReasons.set(reason, (cancellationReasons.get(reason) ?? 0) + 1);
  }

  const factoriesByRiskBand = new Map<string, Set<string>>();
  for (const factory of factories) {
    const band = factory.risk_band?.trim().toLowerCase();
    if (!band) continue;
    const ids = factoriesByRiskBand.get(band) ?? new Set<string>();
    ids.add(factory.id);
    factoriesByRiskBand.set(band, ids);
  }
  const visitsByRiskBand = new Map<string, number>();
  for (const visit of scopedVisits) {
    const band = visit.factories?.risk_band?.trim().toLowerCase();
    if (!band) continue;
    visitsByRiskBand.set(band, (visitsByRiskBand.get(band) ?? 0) + 1);
  }
  const riskAttention = [...factoriesByRiskBand.entries()]
    .map(([label, ids]) => ({
      label,
      visits: visitsByRiskBand.get(label) ?? 0,
      factories: ids.size,
      ratio: ids.size > 0 ? Math.round(((visitsByRiskBand.get(label) ?? 0) / ids.size) * 100) / 100 : null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const violationByRegulation = new Map<string, number>();
  for (const violation of scopedViolations) {
    const regulation = violation.violation_codes?.regulation_clauses?.regulations?.title ?? "Unlinked regulation";
    violationByRegulation.set(regulation, (violationByRegulation.get(regulation) ?? 0) + 1);
  }

  const criticalFactoryIds = new Set(factories.filter(f => f.risk_band === "high").map(f => f.id));
  for (const violation of violations.filter(v => v.violation_codes?.level === "L1")) {
    const id = violation.inspections?.visits?.factories?.id;
    if (id) criticalFactoryIds.add(id);
  }

  const objectIds = new Set<string>([
    ...visits.map(v => v.id),
    ...inspections.map(i => i.id),
    ...reviews.map(r => r.id),
    ...violations.map(v => v.id),
  ]);
  const timeline = input.audit
    .filter(event => !!event.object_id && objectIds.has(event.object_id) && isInScope(event.occurred_at, scope))
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));

  return {
    strategic: {
      completedInspections,
      inspectionCoverageRate,
      coveredFactories: coveredFactoryIds.size,
      dueFactories: dueFactoryIds.size,
      compliant,
      nonCompliant,
      answeredForCompliance,
      // Official rate: approved inspections only (§29 — the authoritative
      // figure, same basis as Factory 360's approved-only compliance).
      complianceRate: percent(approvedCompliant, approvedAnsweredForCompliance),
      approvedCompliant,
      approvedAnsweredForCompliance,
      // Pending rate: submitted / under_review / returned work not yet
      // approved — always labelled pending where shown.
      pendingComplianceRate: percent(pendingCompliant, pendingAnsweredForCompliance),
      pendingCompliant,
      pendingAnsweredForCompliance,
      approvedScoped,
      approvalRate: percent(approvedScoped, completedInspections),
      decidedScoped,
      decisionApprovalRate: percent(approvedDecisionRows.length, decidedScoped),
      decisionReturnRate: percent(returnedRows.length, decidedScoped),
      decisionRejectRate: percent(rejectedRows.length, decidedScoped),
      scopedResponses,
      approvedScopedResponses,
      scopedViolations,
      previousViolations,
      violationDelta: previousViolations === null ? null : scopedViolations.length - previousViolations,
      violationByRegulation: [...violationByRegulation.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      activePublishedChecklistItems,
      checklistItemsByAuthority: [...checklistItemsByAuthority.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
      riskAttention,
      criticalFactories: factories.filter(f => criticalFactoryIds.has(f.id)).sort((a, b) => (b.risk_score ?? -1) - (a.risk_score ?? -1)),
    },
    operational: {
      todayVisits,
      todayCompleted,
      todayCompletionRate: percent(todayCompleted, todayVisits.length),
      pipeline: [...pipeline.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)),
      pipelineTotal: [...pipeline.values()].reduce((sum, value) => sum + value, 0),
      planned,
      cancellationDenominator: scopedVisits.length,
      completed,
      cancelled,
      cancelledRows,
      overdueRows,
      expiringSoonRows,
      expiringSoon: expiringSoonRows ? expiringSoonRows.length : null,
      activeField,
      activeFieldRows,
      awaitingRows,
      pendingApprovalsCount,
      overdueReviewRows,
      reviewSlaConfigured,
      returnedRows,
      rejectedRows,
      highPriorityRows,
      activeInspectors,
      avgDurationMs,
      slaBreachRate: percent(overdueRows.length, eligibleForSla.length),
      slaEligible: eligibleForSla.length,
      workload,
      cancellationReasons: [...cancellationReasons.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      overrides: geo.filter(g => g.kind === "override" || g.geofence_result === "override").filter(g => isInScope(g.occurred_at, scope)),
      timeline,
    },
  };
}

export function complianceBreakdown(responses: ResponseRow[], dimension: "region" | "city" | "sector" | "authority", unknown: string) {
  const groups = new Map<string, { compliant: number; nonCompliant: number }>();
  for (const row of responses) {
    const value = row.response?.value;
    if (value !== "compliant" && value !== "non_compliant") continue;
    const factory = row.inspections?.visits?.factories;
    const key = dimension === "region" ? factory?.region
      : dimension === "city" ? factory?.city
        : dimension === "sector" ? factory?.activity_class
          : row.inspection_items?.regulation_clauses?.regulations?.issuing_authority;
    const label = key?.trim() || unknown;
    const group = groups.get(label) ?? { compliant: 0, nonCompliant: 0 };
    if (value === "compliant") group.compliant += 1; else group.nonCompliant += 1;
    groups.set(label, group);
  }
  return [...groups.entries()]
    .map(([label, counts]) => ({ label, ...counts, total: counts.compliant + counts.nonCompliant, rate: percent(counts.compliant, counts.compliant + counts.nonCompliant) }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.total - a.total || a.label.localeCompare(b.label));
}

export function formatDuration(ms: number | null, locale: "en" | "ar") {
  if (ms == null) return "—";
  const minutes = Math.round(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return locale === "ar" ? `${minutes} د` : `${minutes}m`;
  return locale === "ar" ? `${hours} س ${rest} د` : `${hours}h ${rest}m`;
}
