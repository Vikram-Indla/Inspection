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
  /**
   * True when the governed inspection-cycle policy (ADM-DASH-005) is published.
   * Gates STR-KPI-007 (coverage) and STR-KPI-008 (uninspected) from
   * "Not configured" to live — the computed values already exist, but must not
   * be shown until the cycle policy that defines "due" is governed.
   */
  cyclePolicyConfigured?: boolean;
  refreshedAt: string | null;
  generatedAtMs: number;
  failedSources: string[];
  /**
   * Governed target per metric key from the published dashboard configuration.
   * A key with no entry stays `configured: false` — the projection never
   * substitutes a default for a target the business has not published.
   */
  targets?: Record<string, number>;
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
  const target = ctx.targets?.[def.metricKey];
  const configuredTarget = typeof target === "number";
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
    target: {
      value: configuredTarget ? target : null,
      policyVersionId: ctx.policyVersionId,
      configured: configuredTarget,
    },
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

    // Policy-gated metrics — registry marks them not_configured, but they go
    // live once their governing Admin policy is published (resolved by the
    // loader). When the policy is absent they fall through to the honest
    // not_configured `metric` shell built above.
    const live = (patch: Partial<SharedMetric>): SharedMetric =>
      withValue(metric, {
        sourceStatus: "live",
        refreshedAt: ctx.refreshedAt,
        freshnessRef: "as_of_server_time",
        unavailableReason: null,
        ...patch,
      });
    if (def.metricId === "STR-KPI-007") { // Inspection coverage
      out.push(ctx.cyclePolicyConfigured
        ? live({ value: s.inspectionCoverageRate, numerator: s.coveredFactories, denominator: s.dueFactories })
        : metric);
      continue;
    }
    if (def.metricId === "STR-KPI-008") { // Uninspected factories = due - covered
      const uninspected = Math.max(0, s.dueFactories - s.coveredFactories);
      out.push(ctx.cyclePolicyConfigured
        ? live({ value: uninspected, numerator: uninspected, denominator: s.dueFactories })
        : metric);
      continue;
    }
    if (def.metricId === "OPS-KPI-002") { // Expiring soon (SLA warn fraction)
      out.push(o.expiringSoon == null ? metric : live({ value: o.expiringSoon }));
      continue;
    }

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
            value: s.decisionApprovalRate,
            numerator: s.approvedScoped,
            denominator: s.decidedScoped,
            breakdown: [
              { labelRef: "approve", value: s.decisionApprovalRate ?? 0 },
              { labelRef: "return", value: s.decisionReturnRate ?? 0 },
              { labelRef: "reject", value: s.decisionRejectRate ?? 0 },
            ],
          }),
        );
        break;
      case "STR-KPI-006": // Cancellation rate
        out.push(
          withValue(metric, {
            value: o.cancellationDenominator > 0 ? Math.round((o.cancelled / o.cancellationDenominator) * 100) : null,
            numerator: o.cancelled,
            denominator: o.cancellationDenominator,
            breakdown: metrics.operational.cancellationReasons.map((r) => ({ labelRef: r.label, value: r.value })),
          }),
        );
        break;
      case "STR-KPI-009": // Checklist items grouped by issuing authority
        out.push(
          withValue(metric, {
            value: s.activePublishedChecklistItems,
            numerator: s.activePublishedChecklistItems,
            breakdown: s.checklistItemsByAuthority.map(row => ({ labelRef: row.label, value: row.value })),
            dimensions: [{ key: "issuing_authority", labelRef: "issuing_authority" }],
            evidenceRefs: [`inspection_items:${s.activePublishedChecklistItems}`],
          }),
        );
        break;
      case "STR-KPI-010": // Visits per factory, compared across stored risk bands
        out.push(
          withValue(metric, {
            value: null,
            breakdown: s.riskAttention.map(row => ({ labelRef: row.label, value: row.ratio ?? 0 })),
            dimensions: [{ key: "risk_band", labelRef: "risk_band" }],
            evidenceRefs: s.riskAttention.map(row => `risk_band:${row.label}:visits=${row.visits}:factories=${row.factories}`),
          }),
        );
        break;
      case "OPS-KPI-001": // Visit pipeline
        out.push(
          withValue(metric, {
            value: o.pipelineTotal,
            breakdown: o.pipeline.map(row => ({ labelRef: row.label, value: row.value })),
          }),
        );
        break;
      case "OPS-KPI-003": // Active executions
        out.push(withValue(metric, { value: o.activeField }));
        break;
      case "OPS-KPI-004": // Pending approvals
        out.push(withValue(metric, { value: o.pendingApprovalsCount }));
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
