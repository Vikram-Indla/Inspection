export type AssignmentTask = {
  id: string;
  assignmentStatus: string | null;
  returnReason: string | null;
  planningStatus: string;
  operationalState: string;
  windowStart: string;
  windowEnd: string | null;
  visitType: string;
  executionMode: string;
  priority: string | null;
  packageVersionId: string | null;
  inspectionId: string | null;
  inspectionStatus: string | null;
  unreadAlertCount: number;
  factory: {
    name: string;
    code: string | null;
    region: string | null;
    city: string | null;
  };
};

export type AssignmentFilter = "all" | "today" | "active" | "upcoming" | "alerts" | "returned" | "expired";
export type AssignmentSort = "asc" | "desc";
export type VisitSegment = "today" | "upcoming" | "completed";
export type VisitPriority = "high" | "medium" | "low";

const ACTIVE_OPERATIONAL_STATES = new Set(["prepared", "on_the_way", "arrived", "executing"]);

export function riyadhDay(value: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(value));
}

export function isActiveAssignment(task: AssignmentTask): boolean {
  return task.planningStatus !== "expired"
    && task.assignmentStatus !== "returned"
    && ACTIVE_OPERATIONAL_STATES.has(task.operationalState);
}

export function hasAssignmentAlert(task: AssignmentTask): boolean {
  return task.unreadAlertCount > 0;
}

export function assignmentCounts(tasks: AssignmentTask[], now: string | number | Date) {
  const today = riyadhDay(now);
  return {
    all: tasks.length,
    today: tasks.filter((task) => riyadhDay(task.windowStart) === today && task.planningStatus !== "expired").length,
    active: tasks.filter(isActiveAssignment).length,
    upcoming: tasks.filter((task) => riyadhDay(task.windowStart) > today && task.planningStatus !== "expired").length,
    alerts: tasks.filter(hasAssignmentAlert).length,
    returned: tasks.filter((task) => task.assignmentStatus === "returned").length,
    expired: tasks.filter((task) => task.planningStatus === "expired").length,
  };
}

export function filterAssignmentTasks(
  tasks: AssignmentTask[],
  options: {
    filter: AssignmentFilter;
    query: string;
    sort: AssignmentSort;
    locale: "en" | "ar";
    now: string | number | Date;
  },
): AssignmentTask[] {
  const today = riyadhDay(options.now);
  const needle = options.query.trim().toLocaleLowerCase(options.locale);
  return tasks
    .filter((task) => {
      if (options.filter === "today") return riyadhDay(task.windowStart) === today && task.planningStatus !== "expired";
      if (options.filter === "active") return isActiveAssignment(task);
      if (options.filter === "upcoming") return riyadhDay(task.windowStart) > today && task.planningStatus !== "expired";
      if (options.filter === "alerts") return hasAssignmentAlert(task);
      if (options.filter === "returned") return task.assignmentStatus === "returned";
      if (options.filter === "expired") return task.planningStatus === "expired";
      return true;
    })
    .filter((task) => {
      if (!needle) return true;
      return [
        task.id, task.factory.name, task.factory.code, task.factory.region,
        task.factory.city, task.visitType, task.executionMode,
      ].some((value) => value?.toLocaleLowerCase(options.locale).includes(needle));
    })
    .sort((a, b) => options.sort === "asc"
      ? a.windowStart.localeCompare(b.windowStart)
      : b.windowStart.localeCompare(a.windowStart));
}

export function connectivityPresentation(
  online: boolean,
  labels: { online: string; offline: string },
): { tone: "online" | "offline"; message: string; refreshAvailable: boolean } {
  return online
    ? { tone: "online", message: labels.online, refreshAvailable: true }
    : { tone: "offline", message: labels.offline, refreshAvailable: false };
}

const TERMINAL_OPERATIONAL_STATES = new Set(["submitted"]);
const TERMINAL_INSPECTION_STATES = new Set(["submitted", "approved", "rejected"]);

/** CR-100/101 shared, additive projection for the inspector visit surfaces. */
export function visitSegment(
  task: Pick<AssignmentTask, "windowStart" | "operationalState" | "inspectionStatus">,
  now: string | number | Date,
): VisitSegment {
  if (TERMINAL_OPERATIONAL_STATES.has(task.operationalState)
      || TERMINAL_INSPECTION_STATES.has(task.inspectionStatus ?? "")) return "completed";
  return riyadhDay(task.windowStart) === riyadhDay(now) ? "today" : "upcoming";
}

export function visitSegmentCounts(tasks: AssignmentTask[], now: string | number | Date) {
  return {
    today: tasks.filter((task) => visitSegment(task, now) === "today").length,
    upcoming: tasks.filter((task) => visitSegment(task, now) === "upcoming").length,
    completed: tasks.filter((task) => visitSegment(task, now) === "completed").length,
  };
}

export function isVisitPriority(value: string | null): value is VisitPriority {
  return value === "high" || value === "medium" || value === "low";
}
