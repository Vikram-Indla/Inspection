import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 7 — Virtual + Immediate handoffs and
// cross-module state reconciliation (SAQEEL-EXE-CANONICAL-PLAN v1.0
// §23/§24/§29). Source-contract assertions only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 7 cross-module handoffs", () => {
  const migrationPath = "supabase/migrations/20260721170000_execution_virtual_leg.sql";
  const virtualActionsPath = "apps/web/src/app/(app)/virtual/[id]/actions.ts";
  const virtualListPath = "apps/web/src/app/(app)/virtual/page.tsx";
  const fieldPagePath = "apps/web/src/app/(app)/field/[visitId]/page.tsx";
  const preExecutionPath = "apps/web/src/app/(app)/field/[visitId]/PreExecution.tsx";
  const metricsPath = "apps/web/src/app/(app)/dashboard/metrics.ts";
  const dashboardViewPath = "apps/web/src/app/(app)/dashboard/DashboardView.tsx";
  const opsPagePath = "apps/web/src/app/(app)/operations/page.tsx";
  const factory360Path = "apps/web/src/lib/factory360/compliance.ts";

  test("virtual prepared → executing leg exists in the shared transition authority, guarded by mode + preparation", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    // One shared authority: set_operational_state is replaced, not bypassed.
    expect(sql).toContain("create or replace function set_operational_state(p_visit uuid, p_next operational_state)");
    // The virtual leg: prepared → executing only for virtual visits with a
    // confirmed Ready preparation.
    expect(sql).toContain("(p_next = 'executing'  and cur = 'prepared'");
    expect(sql).toContain("v.execution_mode = 'virtual'");
    expect(sql).toContain("vp.confirmed_ready_at is not null");
    // Physical legs and the D-010 readiness precondition are preserved.
    expect(sql).toContain("(p_next = 'on_the_way' and cur in ('new','prepared'))");
    expect(sql).toContain("(p_next = 'executing'  and cur = 'arrived')");
    expect(sql).toContain("EXE-READY-REQUIRED");
    expect(sql).toContain("grant execute on function set_operational_state(uuid, operational_state) to authenticated");
  });

  test("beginRemote gates on confirmed readiness and reuses the Ready-created inspections row (D-011)", () => {
    const ts = read(virtualActionsPath);
    // Tolerant probe on the readiness schema (Phase 4B pattern).
    expect(ts).toContain('sb.from("visit_preparations")');
    expect(ts).toContain("confirmed_ready_at");
    expect(ts).toContain("readinessAvailable");
    // Neutral readiness refusal (EXE-READY-REQUIRED pattern) when unready.
    expect(ts).toContain("READY_REQUIRED");
    expect(ts).toContain("Preparation is required before the session can start");
    // Select-first reuse: started_at set only while null, never clobbered.
    expect(ts).toContain("inspections(id, started_at)");
    expect(ts).toContain('.is("started_at", null)');
    // Operational state enters executing through the shared RPC with a guarded
    // CAS fallback — never a blind direct write first.
    expect(ts).toContain('sb.rpc("set_operational_state", { p_visit: s.visit_id, p_next: "executing" })');
    expect(ts).toContain('.eq("operational_state", "prepared")');
    // Identity/OTP gating is unchanged: verification still gates execution.
    expect(ts).toContain("Verification gates execution");
    expect(ts).toContain("vs_mark_session_verified");
  });

  test("virtual session list shows the read-only preparation hint without blocking scheduling", () => {
    const ts = read(virtualListPath);
    expect(ts).toContain('sb.from("visit_preparations")');
    expect(ts).toContain("readyById");
    expect(ts).toContain("Preparation required before the session can start");
    // Scheduling stays available — the hint is additive next to ScheduleForm.
    expect(ts).toContain("<ScheduleForm visitId={v.id} strings={scheduleStrings} />");
  });

  test("immediate visits ride the canonical engine: null plan, temporary factory and single-day window are safe", () => {
    const field = read(fieldPagePath);
    // Dispatch coordinates fall back to the immediate planner pin (M01-046) —
    // temporary factories have no official coordinates.
    expect(field).toContain("v.planner_lat ?? factory.official_lat");
    // Temporary/unverified identity uses the EXISTING marker condition + copy
    // (PLN-REQ-028), never an invented badge.
    expect(field).toContain('factory.is_temporary === true && factory.source === "immediate_manual"');
    expect(field).toContain("Unverified manual entry — pending reconciliation");
    // Mode eligibility reads coordinates defensively (null-safe ?? checks).
    expect(field).toContain("dispatchLat != null && dispatchLng != null");
    const prep = read(preExecutionPath);
    // Pre-Execution context surfaces the same unverified marker.
    expect(prep).toContain("unverifiedLabel");
    // The window day picker iterates an inclusive day list — a single-day
    // inspector-immediate window (window_end = window_start, 0027) yields one
    // selectable day with its capacity read.
    expect(field).toContain("ms <= end && i < 62");
    expect(field).toContain("getWindowCapacity(sb, assignment.inspector_id as string, windowStartDate, windowEndDate)");
  });

  test("dashboard preserves separate pending computation and approved presentation", () => {
    const ts = read(metricsPath);
    expect(ts).toContain("pendingComplianceRate");
    expect(ts).toContain("approvedComplianceCounts");
    expect(ts).toContain("pendingComplianceCounts");
    // The official rate is computed over approved inspections only.
    expect(ts).toContain("complianceRate: percent(approvedCompliant, approvedAnsweredForCompliance)");
    expect(ts).toContain("pendingComplianceRate: percent(pendingCompliant, pendingAnsweredForCompliance)");
    const view = read(dashboardViewPath);
    // The approved surface is explicitly labelled; the separate pending
    // computation remains available to governed downstream consumers.
    expect(view).toContain("Compliance in approved inspections");
    expect(view).toContain("approved inspections only");
    // Factory 360's approved-only line is untouched.
    const f360 = read(factory360Path);
    expect(f360).toContain("calculateApprovedCompliance");
  });

  test("operations KPI buckets span prepared and under_review; queue failures stay isolated", () => {
    const ts = read(opsPagePath);
    expect(ts).toContain('"new", "prepared", "on_the_way", "arrived", "executing", "submitted", "under_review"');
    expect(ts).toContain("const counts = Object.fromEntries(states.map");
    // One-source-failure isolation (BR-012 pattern): the Phase 6 returned
    // read and the cancellation queue degrade to a banner, never blank the page.
    expect(ts).toContain('loadErrors.push("resubmission deadlines")');
    expect(ts).toContain('loadErrors.push("cancellation requests")');
    expect(ts).toContain("ops.err.partial");
  });
});
