import { test, expect } from "@playwright/test";
import {
  countChecklistCompliance,
  type CompliesResponse,
} from "../src/lib/dashboard-kpi/checklist-compliance";
import { KPI_DEFINITIONS, kpiDefinition } from "../src/lib/dashboard-kpi/registry";
import { buildInspectorKpiProjection } from "../src/lib/dashboard-kpi/inspector-projection";
import { buildDashboardKpiProjection } from "../src/lib/dashboard-kpi/projection";
import { buildDashboardMetrics } from "../src/app/(app)/dashboard/metrics";
import type { MetricScope } from "../src/lib/dashboard-kpi/contract";

// Pure unit/contract tests for the shared KPI foundation. No browser — imports
// the pure builders directly (repo convention: unit tests live in e2e specs).

const resp = (value: string | null, complete = true): CompliesResponse => ({
  is_complete: complete,
  response: value === null ? null : { value },
});

test.describe("checklist compliance (P0 formula)", () => {
  test("rate = compliant / (compliant + non_compliant)", () => {
    const r = countChecklistCompliance([resp("compliant"), resp("compliant"), resp("non_compliant")]);
    expect(r.compliant).toBe(2);
    expect(r.nonCompliant).toBe(1);
    expect(r.eligible).toBe(3);
    expect(r.rate).toBe(67);
  });

  test("excludes na, unknown and incomplete from BOTH numerator and denominator", () => {
    const r = countChecklistCompliance([
      resp("compliant"),
      resp("na"),
      resp("unknown"),
      resp(null),
      resp("compliant", false), // incomplete
      resp("non_compliant"),
    ]);
    expect(r.eligible).toBe(2); // only the two complete compliant/non_compliant
    expect(r.compliant).toBe(1);
    expect(r.nonCompliant).toBe(1);
    expect(r.excluded).toBe(4);
    expect(r.rate).toBe(50);
  });

  test("zero denominator returns null, never a fabricated 0%", () => {
    const r = countChecklistCompliance([resp("na"), resp(null), resp("compliant", false)]);
    expect(r.eligible).toBe(0);
    expect(r.rate).toBeNull();
  });
});

test.describe("KPI registry completeness", () => {
  test("has 28 metrics: 12 strategic, 9 operational, 7 inspector", () => {
    expect(KPI_DEFINITIONS.length).toBe(28);
    expect(KPI_DEFINITIONS.filter((d) => d.category === "strategic").length).toBe(12);
    expect(KPI_DEFINITIONS.filter((d) => d.category === "operational").length).toBe(9);
    expect(KPI_DEFINITIONS.filter((d) => d.category === "inspector").length).toBe(7);
  });

  test("every metric has a stable id, formulaVersion, unit and non-empty formula", () => {
    const ids = new Set<string>();
    for (const d of KPI_DEFINITIONS) {
      expect(d.metricId).toMatch(/^(STR|OPS|IPAD)-KPI-\d{3}$/);
      expect(ids.has(d.metricId)).toBe(false);
      ids.add(d.metricId);
      expect(d.formulaVersion).toBe("1.0.0");
      expect(d.formula.length).toBeGreaterThan(10);
      expect(d.metricKey.length).toBeGreaterThan(0);
    }
  });

  test("coverage and uninspected are not_configured (no cycle policy)", () => {
    expect(kpiDefinition("STR-KPI-007")!.implementation).toBe("not_configured");
    expect(kpiDefinition("STR-KPI-008")!.implementation).toBe("not_configured");
  });

  test("health-score distribution and licence exposure are unavailable (missing source)", () => {
    expect(kpiDefinition("STR-KPI-002")!.implementation).toBe("unavailable");
    expect(kpiDefinition("STR-KPI-005")!.implementation).toBe("unavailable");
  });

  test("violation trend by issue time is decision_required (no issue-time column)", () => {
    expect(kpiDefinition("STR-KPI-003")!.implementation).toBe("decision_required");
  });
});

const scope: MetricScope = {
  fromMs: 0, toMs: 0, fromDate: null, toDate: null, timezone: "Asia/Riyadh", region: null, filters: {},
};

test.describe("inspector projection (iPad P0 fixes)", () => {
  const nowMs = Date.parse("2026-07-20T09:00:00Z");
  const todayWindow = "2026-07-20T06:00:00Z"; // within Riyadh today

  test("checklist compliance uses the shared calc, not approval outcomes", () => {
    const projection = buildInspectorKpiProjection({
      visits: [{ id: "v1", window_start: todayWindow, operational_state: "submitted" }],
      inspections: [{ id: "i1", visit_id: "v1", status: "submitted", submitted_at: todayWindow }],
      reviews: [{ inspection_id: "i1", status: "approved", decision: "approve", decided_at: todayWindow }],
      responses: [resp("compliant"), resp("non_compliant"), resp("na")],
      syncQueueCount: 0,
      nowMs,
      policyVersionId: null,
      refreshedAt: null,
    });
    const compliance = projection.metrics.find((m) => m.metricId === "IPAD-KPI-006")!;
    const approvals = projection.metrics.find((m) => m.metricId === "IPAD-KPI-005")!;
    // compliance = 1 compliant / 2 eligible = 50%, independent of the approval
    expect(compliance.value).toBe(50);
    expect(compliance.denominator).toBe(2);
    // approval is a SEPARATE metric and must not equal the compliance value
    expect(approvals.value).toBe(1);
    expect(compliance.metricId).not.toBe(approvals.metricId);
  });

  test("daily progress is N/A (null) when there are no visits today", () => {
    const projection = buildInspectorKpiProjection({
      visits: [], inspections: [], reviews: [], responses: [], syncQueueCount: 0,
      nowMs, policyVersionId: null, refreshedAt: null,
    });
    const progress = projection.metrics.find((m) => m.metricId === "IPAD-KPI-004")!;
    expect(progress.value).toBeNull();
    expect(progress.denominator).toBe(0);
  });

  test("remaining = today's visits minus submitted", () => {
    const projection = buildInspectorKpiProjection({
      visits: [
        { id: "v1", window_start: todayWindow, operational_state: "submitted" },
        { id: "v2", window_start: todayWindow, operational_state: "executing" },
        { id: "v3", window_start: todayWindow, operational_state: "new" },
      ],
      inspections: [], reviews: [], responses: [], syncQueueCount: 2,
      nowMs, policyVersionId: null, refreshedAt: null,
    });
    expect(projection.metrics.find((m) => m.metricId === "IPAD-KPI-001")!.value).toBe(3);
    expect(projection.metrics.find((m) => m.metricId === "IPAD-KPI-002")!.value).toBe(2);
    // sync queue count folds into pending attention without double counting
    expect(projection.metrics.find((m) => m.metricId === "IPAD-KPI-003")!.value).toBe(2);
  });
});

test.describe("dashboard projection honesty", () => {
  test("blocked strategic metrics carry a non-live status, never a fabricated value", () => {
    const metrics = buildDashboardMetrics({
      visits: [], inspections: [], reviews: [], responses: [], violations: [], geo: [], audit: [],
      factories: [], sla: {}, scope: { fromMs: 0, toMs: 1 }, today: { fromMs: 0, toMs: 1 }, region: "", nowMs: 1,
    });
    const projection = buildDashboardKpiProjection(metrics, {
      scope, policyVersionId: null, refreshedAt: null, generatedAtMs: 1, failedSources: [],
    });
    const coverage = projection.metrics.find((m) => m.metricId === "STR-KPI-007")!;
    expect(coverage.value).toBeNull();
    expect(coverage.sourceStatus).toBe("not_configured");
    expect(coverage.unavailableReason).toBeTruthy();

    const health = projection.metrics.find((m) => m.metricId === "STR-KPI-002")!;
    expect(health.sourceStatus).toBe("unavailable");

    // implemented metrics that had no data return null value but a live status
    const compliance = projection.metrics.find((m) => m.metricId === "STR-KPI-001")!;
    expect(compliance.sourceStatus).toBe("live");
    expect(compliance.denominator).toBe(0);
    expect(compliance.value).toBeNull();
  });

  test("projection includes all strategic + operational metrics exactly once", () => {
    const metrics = buildDashboardMetrics({
      visits: [], inspections: [], reviews: [], responses: [], violations: [], geo: [], audit: [],
      factories: [], sla: {}, scope: { fromMs: 0, toMs: 1 }, today: { fromMs: 0, toMs: 1 }, region: "", nowMs: 1,
    });
    const projection = buildDashboardKpiProjection(metrics, {
      scope, policyVersionId: null, refreshedAt: null, generatedAtMs: 1, failedSources: [],
    });
    const nonInspector = KPI_DEFINITIONS.filter((d) => d.category !== "inspector").length;
    expect(projection.metrics.length).toBe(nonInspector);
  });
});
