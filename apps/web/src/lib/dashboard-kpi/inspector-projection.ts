// Pure projection for the inspector (iPad) dashboard. Implements the governed
// inspector formulas against the logged-in inspector's own RLS-scoped rows.
//
// This is where the iPad P0 defects are fixed:
//  - Checklist compliance uses the canonical countChecklistCompliance (same as
//    the Web STR-KPI-001), NOT the review approval outcome.
//  - Approval outcomes are surfaced as a SEPARATE, correctly-named metric.
//  - Daily progress returns null (N/A) when there are no visits — never /0.
//  - "Complete" means the governed submitted state, not Level-2 approval.
//
// Pure: `nowMs` is injected, no I/O. Unit-tested in dashboard-kpi-contract.spec.

import { isInScope, riyadhTodayScope } from "@/app/dashboard/metrics";
import { countChecklistCompliance, type CompliesResponse } from "./checklist-compliance";
import { kpiDefinition, type KpiDefinition } from "./registry";
import type { DashboardKpiProjection, MetricScope, SharedMetric } from "./contract";

export type InspectorVisitRow = {
  id: string;
  window_start: string;
  operational_state: string;
};

export type InspectorInspectionRow = {
  id: string;
  visit_id: string;
  status: string; // in_progress | submitted | under_review | approved | returned
  submitted_at: string | null;
};

/** Latest decision per inspection for the inspector's own inspections. */
export type InspectorReviewRow = {
  inspection_id: string;
  status: string; // review_status
  decision: string | null; // approve | return | reject
  decided_at: string | null;
};

export type InspectorProjectionInput = {
  visits: InspectorVisitRow[];
  inspections: InspectorInspectionRow[];
  reviews: InspectorReviewRow[];
  responses: CompliesResponse[];
  /** Count of unsent items from the device offline queue (contributed by iPad). */
  syncQueueCount: number;
  nowMs: number;
  policyVersionId: string | null;
  refreshedAt: string | null;
  /** live when online, cached/offline when the device is serving stored data. */
  sourceStatus?: "live" | "cached" | "offline" | "stale" | "partial";
};

function baseMetric(def: KpiDefinition, scope: MetricScope, input: InspectorProjectionInput): SharedMetric {
  return {
    metricId: def.metricId,
    category: def.category,
    formulaVersion: def.formulaVersion,
    policyVersionId: input.policyVersionId,
    value: null,
    unit: def.unit,
    numerator: null,
    denominator: null,
    scope,
    exclusions: def.metricKey === "checklist_compliance" ? ["na", "unknown", "incomplete"] : [],
    comparison: null,
    target: { value: null, policyVersionId: input.policyVersionId, configured: false },
    dimensions: [],
    breakdown: null,
    drill: { route: def.drillRoute, filters: {} },
    sourceStatus: input.sourceStatus ?? "live",
    refreshedAt: input.refreshedAt,
    freshnessRef: input.sourceStatus === "cached" || input.sourceStatus === "offline" ? "device_cached" : "as_of_server_time",
    evidenceRefs: [],
    permission: { visible: true, masked: false, reasonRef: null },
    label: { en: def.titleEn, ar: def.titleAr, descriptionRef: def.metricKey },
    unavailableReason: null,
  };
}

function latestReviewByInspection(reviews: InspectorReviewRow[]): Map<string, InspectorReviewRow> {
  const byInspection = new Map<string, InspectorReviewRow>();
  for (const row of reviews) {
    const existing = byInspection.get(row.inspection_id);
    const rowMs = Date.parse(row.decided_at ?? "") || 0;
    const existingMs = Date.parse(existing?.decided_at ?? "") || 0;
    if (!existing || rowMs >= existingMs) byInspection.set(row.inspection_id, row);
  }
  return byInspection;
}

export function buildInspectorKpiProjection(input: InspectorProjectionInput): DashboardKpiProjection {
  const today = riyadhTodayScope(input.nowMs);
  const scope: MetricScope = {
    fromMs: today.fromMs,
    toMs: today.toMs,
    fromDate: null,
    toDate: null,
    timezone: "Asia/Riyadh",
    region: null,
    filters: {},
  };

  const todayVisits = input.visits.filter((v) => isInScope(v.window_start, today));
  const todaySubmitted = todayVisits.filter((v) => v.operational_state === "submitted");
  const remaining = todayVisits.length - todaySubmitted.length;

  const latest = latestReviewByInspection(input.reviews);
  const decisionCounts = { approve: 0, return: 0, reject: 0 };
  for (const r of latest.values()) {
    const d = r.decision ?? (r.status === "approved" ? "approve" : r.status === "returned" ? "return" : r.status === "rejected" ? "reject" : null);
    if (d === "approve") decisionCounts.approve += 1;
    else if (d === "return") decisionCounts.return += 1;
    else if (d === "reject") decisionCounts.reject += 1;
  }

  // Pending attention buckets, de-duplicated by inspection id, plus device queue.
  const attentionInspectionIds = new Set<string>();
  for (const insp of input.inspections) {
    const latestReview = latest.get(insp.id);
    const returned = insp.status === "returned" || latestReview?.status === "returned";
    const resumableDraft = insp.status === "in_progress";
    if (returned || resumableDraft) attentionInspectionIds.add(insp.id);
  }
  const pendingAttention = attentionInspectionIds.size + Math.max(0, input.syncQueueCount);

  const compliance = countChecklistCompliance(input.responses);

  const def = (id: string) => kpiDefinition(id)!;
  const metrics: SharedMetric[] = [
    { ...baseMetric(def("IPAD-KPI-001"), scope, input), value: todayVisits.length },
    { ...baseMetric(def("IPAD-KPI-002"), scope, input), value: remaining },
    { ...baseMetric(def("IPAD-KPI-003"), scope, input), value: pendingAttention,
      breakdown: [
        { labelRef: "returned_or_draft", value: attentionInspectionIds.size },
        { labelRef: "sync_queue", value: Math.max(0, input.syncQueueCount) },
      ],
    },
    { ...baseMetric(def("IPAD-KPI-004"), scope, input),
      value: todayVisits.length > 0 ? Math.round((todaySubmitted.length / todayVisits.length) * 100) : null,
      numerator: todaySubmitted.length,
      denominator: todayVisits.length,
    },
    { ...baseMetric(def("IPAD-KPI-005"), scope, input), value: decisionCounts.approve + decisionCounts.return + decisionCounts.reject,
      breakdown: [
        { labelRef: "approve", value: decisionCounts.approve },
        { labelRef: "return", value: decisionCounts.return },
        { labelRef: "reject", value: decisionCounts.reject },
      ],
    },
    { ...baseMetric(def("IPAD-KPI-006"), scope, input),
      value: compliance.rate,
      numerator: compliance.compliant,
      denominator: compliance.eligible,
    },
    // Personal trends: definition seeded, live series wiring deferred.
    { ...baseMetric(def("IPAD-KPI-007"), scope, input), sourceStatus: "unavailable", unavailableReason: def("IPAD-KPI-007").note },
  ];

  return { metrics, generatedAtMs: input.nowMs, failedSources: [] };
}
