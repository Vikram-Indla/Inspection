import { projectOperationalState } from "@/lib/execution/state-machine";

// TASK-IPAD-DAILY-DASHBOARD-VISIT-HUB-001
// SCR-IPAD-600 · G2-P04 · MVP1-M03-001 · AC-0099

export type DailyVisit = {
  id: string;
  planning_status: string;
  operational_state: string;
  execution_mode: string | null;
  visit_type: string | null;
  window_start: string;
  window_end: string | null;
  factory_id: string | null;
  package_version_id: string | null;
  factories: {
    id: string;
    name: string;
    factory_code: string | null;
    region: string | null;
    city: string | null;
  } | null;
  inspections: {
    id: string;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    reviews: { returned_sections: string[] | null }[] | null;
  } | null;
};

const TERMINAL_INSPECTION = new Set(["submitted", "approved", "rejected", "cancelled"]);
const ACTIVE_INSPECTION = new Set(["in_progress", "returned"]);

export function riyadhDateKey(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function visitDestination(visit: DailyVisit): string {
  if (visit.inspections && ACTIVE_INSPECTION.has(visit.inspections.status)) {
    return `/field/inspection/${visit.inspections.id}`;
  }
  const state = projectOperationalState(visit.operational_state);
  if (state === "on_the_way" || state === "arrived") {
    return `/field/${visit.id}/travel`;
  }
  if (state === "executing" && visit.inspections) {
    return `/field/inspection/${visit.inspections.id}`;
  }
  return `/field/${visit.id}`;
}

export function buildDailyVisitHub(visits: DailyVisit[], now: Date = new Date()) {
  const todayKey = riyadhDateKey(now);
  const visible = visits.filter((visit) => ["published", "expired"].includes(visit.planning_status));
  const assigned = visits
    .filter((visit) => visit.planning_status === "published")
    .sort((a, b) => a.window_start.localeCompare(b.window_start));
  const today = assigned.filter((visit) => riyadhDateKey(visit.window_start) === todayKey);
  const completedToday = today.filter((visit) =>
    visit.inspections?.submitted_at
      ? riyadhDateKey(visit.inspections.submitted_at) === todayKey
      : projectOperationalState(visit.operational_state) === "submitted",
  );
  const incompleteToday = today.filter((visit) => !completedToday.some((done) => done.id === visit.id));
  const resumable = incompleteToday.find((visit) =>
    !!visit.inspections && ACTIVE_INSPECTION.has(visit.inspections.status),
  ) ?? null;
  const nextVisit = incompleteToday[0] ?? null;

  const attentionIds = new Set<string>();
  for (const visit of visible) {
    const returned = visit.inspections?.status === "returned"
      || (visit.inspections?.reviews ?? []).some((review) => (review.returned_sections?.length ?? 0) > 0);
    if (returned || visit.planning_status === "expired") attentionIds.add(visit.id);
  }

  return {
    today,
    completedToday,
    incompleteToday,
    resumable,
    nextVisit,
    attentionCount: attentionIds.size,
  };
}
