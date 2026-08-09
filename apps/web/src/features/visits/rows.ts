import type { PlanningVisitRow } from "@/lib/planning/visit-list";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type VisitAllowedKey = "editable" | "locked" | "final" | "expired";

export type VisitBoardRow = {
  readonly id: string;
  readonly reference: string;
  readonly selectionLabel: string;
  readonly href: string;
  readonly planId: string;
  readonly planLabel: string;
  readonly factoryName: string;
  readonly factoryIdentifiers: string;
  readonly typeLabel: string;
  readonly modeLabel: string;
  readonly planningLabel: string;
  readonly planningTone: StatusTone;
  readonly operationalLabel: string;
  readonly operationalTone: StatusTone;
  readonly inspectorName: string;
  readonly windowStart: string;
  readonly windowStartIso: string;
  readonly windowEnd: string;
  readonly windowEndIso: string;
  readonly allowedKey: VisitAllowedKey;
  readonly reschedulable: boolean;
  readonly notStarted: boolean;
};

export const VISIT_STATUS_TONE: Record<string, StatusTone> = {
  draft: "neutral",
  validated: "neutral",
  published: "success",
  pending_supervision: "warning",
  returned: "warning",
  cancelled: "danger",
  expired: "danger",
};

export const VISIT_OPERATIONAL_TONE: Record<string, StatusTone> = {
  new: "neutral",
  prepared: "info",
  on_the_way: "info",
  arrived: "info",
  executing: "accent",
  submitted: "info",
  under_review: "warning",
  closed: "success",
};

export const VISIT_ALLOWED_TONE: Record<VisitAllowedKey, StatusTone> = {
  editable: "success",
  locked: "warning",
  final: "neutral",
  expired: "danger",
};

const hasStarted = (row: PlanningVisitRow) =>
  Boolean(row.inspectionStatus) && row.inspectionStatus !== "not_started";

export function effectiveVisitStatus(row: PlanningVisitRow, now: number): string {
  const lapsed = new Date(row.windowEnd).getTime() < now;
  return row.planningStatus === "published" && lapsed && !hasStarted(row) ? "expired" : row.planningStatus;
}

export function visitAllowedKey(row: PlanningVisitRow, now: number): VisitAllowedKey {
  const effective = effectiveVisitStatus(row, now);
  if (effective === "expired") return "expired";
  if (row.planningStatus === "cancelled") return "final";
  if (hasStarted(row)) return "locked";
  return effective === "published" && row.operationalState === "new" ? "editable" : "final";
}

export type VisitRowLabels = {
  readonly enumLabel: (value: string) => string;
  readonly formatDateTime: (iso: string) => string;
  readonly expired: string;
  readonly campaign: string;
  readonly plan: string;
  readonly referenceUnavailable: string;
  readonly missing: string;
};

export function toVisitBoardRow(
  row: PlanningVisitRow,
  routeBase: string,
  now: number,
  labels: VisitRowLabels,
): VisitBoardRow {
  const effective = effectiveVisitStatus(row, now);
  const identifiers = [row.crNumber, row.licenseNumber].filter((value): value is string => Boolean(value));
  const planPrefix = row.method === "bulk" ? labels.campaign : labels.plan;
  return {
    id: row.id,
    reference: row.visitReference ?? labels.referenceUnavailable,
    selectionLabel: row.visitReference ?? row.id.slice(0, 8),
    href: `${routeBase}/${row.id}`,
    planId: row.visitPlanId ?? "",
    planLabel: row.visitPlanId ? `${planPrefix} ${row.visitPlanId.slice(0, 8)}` : "",
    factoryName: row.factoryName ?? labels.missing,
    factoryIdentifiers: identifiers.join(" · "),
    typeLabel: labels.enumLabel(row.visitType),
    modeLabel: labels.enumLabel(row.executionMode),
    planningLabel: effective === "expired" && row.planningStatus === "published"
      ? labels.expired
      : labels.enumLabel(row.planningStatus),
    planningTone: VISIT_STATUS_TONE[effective] ?? "neutral",
    operationalLabel: labels.enumLabel(row.operationalState),
    operationalTone: VISIT_OPERATIONAL_TONE[row.operationalState] ?? "neutral",
    inspectorName: row.inspectorName ?? labels.missing,
    windowStart: labels.formatDateTime(row.windowStart),
    windowStartIso: row.windowStart,
    windowEnd: labels.formatDateTime(row.windowEnd),
    windowEndIso: row.windowEnd,
    allowedKey: visitAllowedKey(row, now),
    reschedulable: effective === "published" && row.operationalState === "new",
    notStarted: !hasStarted(row),
  };
}
