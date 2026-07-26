import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildInspectorKpiProjection } from "../src/lib/dashboard-kpi/inspector-projection";
import { kpiDefinition } from "../src/lib/dashboard-kpi/registry";

// CODEX 03 — iPad /field dashboard presentation guards. These are static/pure
// (no browser): they lock the P0 KPI semantics the field page renders and the
// scope-preservation contract, so a future edit cannot silently regress them.

const fieldPage = readFileSync(join(__dirname, "../src/app/(app)/field/page.tsx"), "utf8");
const packSheet = readFileSync(join(__dirname, "../src/components/field/PreInspectionPackSheet.tsx"), "utf8");
const headerSync = readFileSync(join(__dirname, "../src/components/field/FieldHeaderSync.tsx"), "utf8");

test.describe("field dashboard renders source-backed execution metrics", () => {
  test("page scopes the metric strip to assigned visits and operational states", () => {
    expect(fieldPage).toContain('.from("assignments")');
    expect(fieldPage).toContain('.eq("inspector_id", user.id)');
    expect(fieldPage).toContain("const scopeStat = (rows: VisitRow[]): FieldScopeStat =>");
    expect(fieldPage).toContain("const submitted = rows.filter(isDone).length");
    expect(fieldPage).toContain("completionPct: rows.length ? Math.round((submitted / rows.length) * 100) : 0");
    expect(fieldPage).toContain("<FieldMetricStrip");
  });

  test("no fabricated / hand-rolled compliance percentage in the field presentation", () => {
    // The old defect divided approved reviews by decided reviews and LABELLED it
    // 'Compliance rate'. That mislabel must never come back.
    expect(fieldPage).not.toMatch(/Compliance rate/i);
    expect(fieldPage).not.toMatch(/approvedReviews\s*\/\s*decided\.length/);
  });

  test("terminology regression: 'dossier' never reappears in field presentation", () => {
    expect(fieldPage.toLowerCase()).not.toContain("dossier");
    expect(packSheet.toLowerCase()).not.toContain("dossier");
    expect(headerSync.toLowerCase()).not.toContain("dossier");
  });
});

test.describe("P0 semantic separation (approval outcomes ≠ checklist compliance)", () => {
  test("IPAD-KPI-005 is Approval outcomes; IPAD-KPI-006 is Checklist compliance", () => {
    expect(kpiDefinition("IPAD-KPI-005")!.titleEn).toBe("Approval outcomes");
    expect(kpiDefinition("IPAD-KPI-006")!.titleEn).toBe("Checklist compliance");
  });

  test("daily progress is submitted/assigned, independent of approval outcomes", () => {
    const nowMs = Date.parse("2026-07-20T09:00:00Z");
    const win = "2026-07-20T06:00:00Z";
    const p = buildInspectorKpiProjection({
      visits: [
        { id: "v1", window_start: win, operational_state: "submitted" },
        { id: "v2", window_start: win, operational_state: "executing" },
      ],
      inspections: [{ id: "i1", visit_id: "v1", status: "submitted", submitted_at: win }],
      // an approved review must NOT move daily progress or compliance
      reviews: [{ inspection_id: "i1", status: "approved", decision: "approve", decided_at: win }],
      responses: [{ is_complete: true, response: { value: "non_compliant" } }],
      syncQueueCount: 0, nowMs, policyVersionId: null, refreshedAt: null,
    });
    const progress = p.metrics.find(m => m.metricId === "IPAD-KPI-004")!;
    const compliance = p.metrics.find(m => m.metricId === "IPAD-KPI-006")!;
    const approval = p.metrics.find(m => m.metricId === "IPAD-KPI-005")!;
    expect(progress.value).toBe(50);          // 1 submitted / 2 assigned — NOT approval
    expect(compliance.value).toBe(0);         // 0 compliant / 1 eligible — NOT approval
    expect(approval.value).toBe(1);           // separate decided-outcome count
  });
});

test.describe("offline / Factory-360 scope preservation", () => {
  test("field presentation does not touch the offline outbox or Factory 360 lib logic", () => {
    // The header sync control may trigger the canonical idempotent replay, but
    // it never authors queue entries or resolves conflicts on the user's behalf.
    expect(headerSync).not.toMatch(/\.enqueue\(|\.remove\(|resolveConflict/);
    expect(headerSync).toContain("processOutbox");
    expect(fieldPage).not.toContain("lib/factory360");
    expect(packSheet).not.toContain("lib/factory360");
    // The pack sheet keeps the user on the governed startup and scrolls to its
    // server-authoritative readiness panel; it never invents another route.
    expect(packSheet).toContain('data-testid="pre-execution-panel"');
    expect(packSheet).toContain("resolveVerifiedPackage");
    expect(packSheet).toContain("cacheVerifiedPackage");
  });
});
