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
};

export type VisitRow = {
  id: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  window_end: string;
  priority: string | null;
  cancellation_reason: string | null;
  created_at: string;
  factories: FactoryRef | null;
  assignments: { inspector_id: string; profiles: { full_name: string } | null }[] | null;
};

export type InspectionRow = {
  id: string;
  visit_id: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  visits: { window_start: string; factories: FactoryRef | null } | null;
};

export type ReviewRow = {
  id: string;
  inspection_id: string;
  status: string;
  decision: string | null;
  decided_at: string | null;
  inspections: { submitted_at: string | null; visits: { window_start: string; factories: FactoryRef | null } | null } | null;
};

export type ResponseRow = {
  inspection_id: string;
  is_complete: boolean;
  response: { value?: string } | null;
  inspections: { submitted_at: string | null; visits: { factories: FactoryRef | null } | null } | null;
  inspection_items: {
    regulation_clauses: { regulations: { title: string; issuing_authority: string | null } | null } | null;
  } | null;
};

export type ViolationRow = {
  id: string;
  inspection_id: string;
  inspections: { submitted_at: string | null; visits: { factories: FactoryRef | null } | null } | null;
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
  visits: { planner_lat: number | null; planner_lng: number | null; factories: FactoryRef | null } | null;
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

export type DateScope = { fromMs: number; toMs: number };

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function riyadhDateParts(ms: number) {
  const shifted = new Date(ms + RIYADH_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

function riyadhMidnightUtc(year: number, month: number, day: number) {
  return Date.UTC(year, month, day) - RIYADH_OFFSET_MS;
}

export function parseDateScope(from: string | undefined, to: string | undefined, nowMs: number): DateScope & { fromDate: string; toDate: string } {
  const today = riyadhDateParts(nowMs);
  const todayStart = riyadhMidnightUtc(today.year, today.month, today.day);
  const defaultFrom = todayStart - 29 * DAY_MS;
  const parse = (value: string | undefined, end: boolean) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    if (!match) return null;
    const ms = riyadhMidnightUtc(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return end ? ms + DAY_MS - 1 : ms;
  };
  let fromMs = parse(from, false) ?? defaultFrom;
  let toMs = parse(to, true) ?? todayStart + DAY_MS - 1;
  if (fromMs > toMs) [fromMs, toMs] = [toMs - (DAY_MS - 1), fromMs + (DAY_MS - 1)];
  const isoDate = (ms: number) => new Date(ms + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
  return { fromMs, toMs, fromDate: isoDate(fromMs), toDate: isoDate(toMs) };
}

export function riyadhTodayScope(nowMs: number): DateScope {
  const p = riyadhDateParts(nowMs);
  const fromMs = riyadhMidnightUtc(p.year, p.month, p.day);
  return { fromMs, toMs: fromMs + DAY_MS - 1 };
}

export function isInScope(iso: string | null | undefined, scope: DateScope) {
  if (!iso) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms >= scope.fromMs && ms <= scope.toMs;
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
  violations: ViolationRow[];
  geo: GeoRow[];
  audit: AuditRow[];
  factories: FactoryRef[];
  sla: DashboardSla;
  scope: DateScope;
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

  const scopedInspections = inspections.filter(i => isInScope(i.submitted_at, scope));
  const scopedInspectionIds = new Set(scopedInspections.map(i => i.id));
  const completedInspections = scopedInspections.length;

  const scopedResponses = responses.filter(r => scopedInspectionIds.has(r.inspection_id) && r.is_complete);
  const compliant = scopedResponses.filter(r => r.response?.value === "compliant").length;
  const nonCompliant = scopedResponses.filter(r => r.response?.value === "non_compliant").length;
  const answeredForCompliance = compliant + nonCompliant;

  const latest = latestReviews(reviews);
  const approvedInspectionIds = new Set(
    [...latest.values()].filter(r => r.status === "approved" || r.decision === "approve").map(r => r.inspection_id),
  );
  const approvedScoped = scopedInspections.filter(i => approvedInspectionIds.has(i.id)).length;

  const scopedViolations = violations.filter(v => scopedInspectionIds.has(v.inspection_id));
  const previousScope: DateScope = {
    fromMs: scope.fromMs - (scope.toMs - scope.fromMs + 1),
    toMs: scope.fromMs - 1,
  };
  const previousViolations = violations.filter(v => isInScope(v.inspections?.submitted_at, previousScope)).length;

  const todayVisits = visits.filter(v => v.planning_status === "published" && isInScope(v.window_start, today));
  const todayCompleted = todayVisits.filter(v => v.operational_state === "submitted").length;

  const scopedVisits = visits.filter(v => isInScope(v.window_start, scope));
  const planned = scopedVisits.filter(v => v.planning_status === "published").length;
  const completed = scopedVisits.filter(v => v.operational_state === "submitted").length;
  const cancelledRows = scopedVisits.filter(v => v.planning_status === "cancelled");
  const cancelled = cancelledRows.length;
  const eligibleForSla = scopedVisits.filter(v => v.planning_status === "published" && v.operational_state !== "submitted");
  const overdueRows = eligibleForSla.filter(v => Date.parse(v.window_end) < nowMs);
  const activeField = inspections.filter(i => i.status === "in_progress" && isInScope(i.visits?.window_start ?? i.started_at, scope)).length;
  const scopedLatestReviews = [...latest.values()].filter(r => isInScope(r.inspections?.submitted_at, scope));
  const awaitingRows = scopedLatestReviews.filter(r => r.status === "pending_review" || r.status === "under_review");
  const returnedRows = scopedLatestReviews.filter(r => r.status === "returned");
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

  const inspectorMap = new Map<string, { id: string; name: string; assigned: number; active: number; completed: number; overdue: number }>();
  for (const visit of scopedVisits) {
    for (const assignment of visit.assignments ?? []) {
      const row = inspectorMap.get(assignment.inspector_id) ?? {
        id: assignment.inspector_id,
        name: assignment.profiles?.full_name ?? assignment.inspector_id.slice(0, 8),
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
      compliant,
      nonCompliant,
      answeredForCompliance,
      complianceRate: percent(compliant, answeredForCompliance),
      approvedScoped,
      approvalRate: percent(approvedScoped, completedInspections),
      scopedResponses,
      scopedViolations,
      previousViolations,
      violationDelta: scopedViolations.length - previousViolations,
      violationByRegulation: [...violationByRegulation.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      criticalFactories: factories.filter(f => criticalFactoryIds.has(f.id)).sort((a, b) => (b.risk_score ?? -1) - (a.risk_score ?? -1)),
    },
    operational: {
      todayVisits,
      todayCompleted,
      todayCompletionRate: percent(todayCompleted, todayVisits.length),
      planned,
      completed,
      cancelled,
      cancelledRows,
      overdueRows,
      activeField,
      awaitingRows,
      overdueReviewRows,
      reviewSlaConfigured,
      returnedRows,
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
