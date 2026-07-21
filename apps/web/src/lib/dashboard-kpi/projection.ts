// Pure projection: map governed raw computations into the shared SharedMetric
// contract for the Web (strategic + operational) dashboard. This wraps the
// existing pure `buildDashboardMetrics` engine so there is ONE server-side
// source of truth; presentation never recomputes.
//
// Pure (no I/O, no Date.now) so it is unit-testable exactly like metrics.ts.
// The server-only loader (loader.ts) is responsible for fetching rows and
// calling buildDashboardMetrics; this file only shapes the contract.

import type { buildDashboardMetrics } from "@/app/(app)/dashboard/metrics";
import { COMPLIANCE_EXCLUSIONS } from "./checklist-compliance";
import { KPI_DEFINITIONS, type KpiDefinition } from "./registry";
import type {
  DashboardKpiProjection,
  MetricComparison,
  MetricScope,
  MetricSourceStatus,
  SharedMetric,
} from "./contract";

type DashboardMetrics = ReturnType<typeof buildDashboardMetrics>;

export type ProjectionContext = {
  scope: MetricScope;
  /** Published dashboard policy version applied, or null when none. */
  policyVersionId: string | null;
  refreshedAt: string | null;
  generatedAtMs: number;
  failedSources: string[];
};

/** Map a non-live implementation status to an honest source status. */
function statusFor(def: KpiDefinition): MetricSourceStatus {
  switch (def.implementation) {
    case "not_configured":
      return "not_configured";
    case "decision_required":
      return "decision_required";
    case "unavailable":
      return "unavailable";
    default:
      return "unavailable"; // deferred definitions have no live projection yet
  }
}

/** Build a SharedMetric shell from the registry definition. */
function base(def: KpiDefinition, ctx: ProjectionContext): SharedMetric {
  const live = def.implementation === "implemented";
  return {
    metricId: def.metricId,
    category: def.category,
    formulaVersion: def.formulaVersion,
    policyVersionId: ctx.policyVersionId,
    value: null,
    unit: def.unit,
    numerator: null,
    denominator: null,
    scope: ctx.scope,
    exclusions: def.metricKey.includes("compliance") ? [...COMPLIANCE_EXCLUSIONS] : [],
    comparison: null,
    target: { value: null, policyVersionId: ctx.policyVersionId, configured: false },
    dimensions: [],
    breakdown: null,
    drill: { route: def.drillRoute, filters: {} },
    sourceStatus: live ? "live" : statusFor(def),
    refreshedAt: live ? ctx.refreshedAt : null,
    freshnessRef: live ? "as_of_server_time" : null,
    evidenceRefs: [],
    permission: { visible: true, masked: false, reasonRef: null },
    label: { en: def.titleEn, ar: def.titleAr, descriptionRef: def.metricKey },
    unavailableReason: live ? null : def.note,
  };
}

function withValue(
  metric: SharedMetric,
  patch: Partial<SharedMetric>,
): SharedMetric {
  return { ...metric, ...patch };
}

function comparison(previous: number | null, current: number | null, window: string): MetricComparison {
  if (previous == null || current == null) return { previousValue: previous, direction: "unknown", window };
  const direction = current > previous ? "up" : current < previous ? "down" : "flat";
  return { previousValue: previous, direction, window };
}

/**
 * Build the strategic + operational shared metric list from a computed
 * DashboardMetrics object. Every metric in the registry appears exactly once;
 * blocked metrics appear with an honest non-live status and unavailableReason.
 */
export function buildDashboardKpiProjection(
  metrics: DashboardMetrics,
  ctx: ProjectionContext,
): DashboardKpiProjection {
  const s = metrics.strategic;
  const o = metrics.operational;
  const out: SharedMetric[] = [];

  for (const def of KPI_DEFINITIONS) {
    if (def.category === "inspector") continue; // inspector metrics come from inspector-projection.ts
    const metric = base(def, ctx);

    if (def.implementation !== "implemented") {
      out.push(metric);
      continue;
    }

    switch (def.metricId) {
      case "STR-KPI-001": // Compliance rate trend (approved-only, matching the headline KPI)
        out.push(
          withValue(metric, {
            value: s.complianceRate,
            numerator: s.approvedCompliant,
            denominator: s.approvedAnsweredForCompliance,
            evidenceRefs: [`checklist_responses:${s.approvedAnsweredForCompliance}`],
          }),
        );
        break;
      case "STR-KPI-004": // Level-2 decision mix (separate from compliance)
        out.push(
          withValue(metric, {
            value: s.approvedScoped,
            numerator: s.approvedScoped,
            denominator: s.completedInspections,
            breakdown: [
              { labelRef: "approve", value: s.approvedScoped },
              { labelRef: "return", value: o.returnedRows.length },
            ],
          }),
        );
        break;
      case "STR-KPI-006": // Cancellation rate
        out.push(
          withValue(metric, {
            value: o.planned > 0 ? Math.round((o.cancelled / (o.planned + o.cancelled)) * 100) : null,
            numerator: o.cancelled,
            denominator: o.planned + o.cancelled,
            breakdown: metrics.operational.cancellationReasons.map((r) => ({ labelRef: r.label, value: r.value })),
          }),
        );
        break;
      case "OPS-KPI-001": // Visit pipeline
        out.push(
          withValue(metric, {
            value: o.planned,
            breakdown: [
              { labelRef: "planned", value: o.planned },
              { labelRef: "completed", value: o.completed },
              { labelRef: "cancelled", value: o.cancelled },
            ],
          }),
        );
        break;
      case "OPS-KPI-003": // Active executions
        out.push(withValue(metric, { value: o.activeField }));
        break;
      case "OPS-KPI-004": // Pending approvals
        out.push(withValue(metric, { value: o.awaitingRows.length }));
        break;
      case "OPS-KPI-006": // Today's schedule load by inspector
        out.push(
          withValue(metric, {
            value: o.workload.reduce((sum, w) => sum + w.assigned, 0),
            breakdown: o.workload.map((w) => ({ labelRef: w.id, value: w.assigned })),
            dimensions: [{ key: "inspector", labelRef: "inspector" }],
          }),
        );
        break;
      case "OPS-KPI-007": // GPS overrides today
        out.push(withValue(metric, { value: o.overrides.length }));
        break;
      case "OPS-KPI-008": // Live activity feed
        out.push(
          withValue(metric, {
            value: o.timeline.length,
            evidenceRefs: o.timeline.slice(0, 5).map((e) => `audit_events:${e.id}`),
          }),
        );
        break;
      default:
        // Implemented in registry but not yet mapped here: keep honest.
        out.push(withValue(metric, { sourceStatus: "unavailable", value: null, unavailableReason: "projection mapping pending" }));
        break;
    }
  }

  // Attach the violation-trend comparison context on the (non-live) STR-KPI-003
  // so presentation can show the by-regulation breakdown that IS available,
  // while the time-series remains decision_required.
  const violationMetric = out.find((m) => m.metricId === "STR-KPI-003");
  if (violationMetric) {
    violationMetric.breakdown = s.violationByRegulation.map((v) => ({ labelRef: v.label, value: v.value }));
    violationMetric.comparison = comparison(s.previousViolations, s.scopedViolations.length, "previous_equal_window");
  }

  return { metrics: out, generatedAtMs: ctx.generatedAtMs, failedSources: ctx.failedSources };
}
