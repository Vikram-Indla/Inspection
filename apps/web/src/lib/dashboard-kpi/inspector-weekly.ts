// Weekly-scoped mirror of the inspector KPI tiles (TASK-FIELD-BRIEFING-WEEKLY-001,
// sponsor-owned deviation). This is deliberately NOT a new governed metric: it
// reuses the exact same field-level formulas as buildInspectorKpiProjection
// (IPAD-KPI-001..004 in inspector-projection.ts) against the SAME visit/
// inspection rows the daily tiles already query, just widening the date
// window from "today" to "the past 7 Riyadh calendar days (inclusive)".
//
// Kept out of the governed SharedMetric contract on purpose — it is a display
// convenience for the Daily/Weekly toggle, not a new admin-configurable KPI
// with its own metricId, formulaVersion, drill route, etc. If this needs to
// become a first-class governed metric later, that is a product-contract
// change, not something to slip in here.

import { isInScope, riyadhTodayScope, type DateScope } from "@/app/(app)/dashboard/metrics";
import type { InspectorInspectionRow, InspectorReviewRow, InspectorVisitRow } from "./inspector-projection";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Past 7 Riyadh calendar days, inclusive of today. Same day-boundary math as
 *  riyadhTodayScope, just 6 days further back. */
export function riyadhPast7DaysScope(nowMs: number): DateScope {
  const today = riyadhTodayScope(nowMs);
  return { fromMs: today.fromMs - 6 * DAY_MS, toMs: today.toMs };
}

export type InspectorWeeklyKpiInput = {
  visits: InspectorVisitRow[];
  inspections: InspectorInspectionRow[];
  reviews: InspectorReviewRow[];
  nowMs: number;
};

export type InspectorWeeklyKpi = {
  visitsThisWeek: number;
  remainingThisWeek: number;
  pendingAttentionThisWeek: number;
  progressPercentThisWeek: number | null; // null = N/A (no visits in window), never /0
};

/** Same calculation as IPAD-KPI-001..004, wider (7-day) date range. */
export function buildInspectorWeeklyKpi(input: InspectorWeeklyKpiInput): InspectorWeeklyKpi {
  const scope = riyadhPast7DaysScope(input.nowMs);
  const weekVisits = input.visits.filter((v) => isInScope(v.window_start, scope));
  const weekSubmitted = weekVisits.filter((v) => v.operational_state === "submitted");
  const remaining = weekVisits.length - weekSubmitted.length;

  const latest = new Map<string, InspectorReviewRow>();
  for (const row of input.reviews) {
    const existing = latest.get(row.inspection_id);
    const rowMs = Date.parse(row.decided_at ?? "") || 0;
    const existingMs = Date.parse(existing?.decided_at ?? "") || 0;
    if (!existing || rowMs >= existingMs) latest.set(row.inspection_id, row);
  }

  // Pending attention is a backlog count (returned/in-progress inspections
  // outstanding right now), not a window-scoped metric — an outstanding draft
  // doesn't stop needing attention just because its visit's window fell
  // outside the past 7 days. Matches IPAD-KPI-003's own unscoped formula
  // (inspector-projection.ts) exactly; do not gate this by weekVisitIds.
  const attentionInspectionIds = new Set<string>();
  for (const insp of input.inspections) {
    const latestReview = latest.get(insp.id);
    const returned = insp.status === "returned" || latestReview?.status === "returned";
    const resumableDraft = insp.status === "in_progress";
    if (returned || resumableDraft) attentionInspectionIds.add(insp.id);
  }

  return {
    visitsThisWeek: weekVisits.length,
    remainingThisWeek: remaining,
    pendingAttentionThisWeek: attentionInspectionIds.size,
    progressPercentThisWeek: weekVisits.length > 0 ? Math.round((weekSubmitted.length / weekVisits.length) * 100) : null,
  };
}
