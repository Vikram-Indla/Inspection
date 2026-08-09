import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 3B — Pre-Execution UI + readiness gating.
// Source-contract assertions only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

const pagePath = "apps/web/src/app/(app)/field/[visitId]/page.tsx";
const panelPath = "apps/web/src/app/(app)/field/[visitId]/PreExecution.tsx";
const actionsPath = "apps/web/src/app/(app)/field/[visitId]/preparation-actions.ts";
const startupPath = "apps/web/src/app/(app)/field/[visitId]/Startup.tsx";
const guardMigrationPath = "supabase/migrations/20260721130000_execution_journey_readiness_guard.sql";

test.describe("TASK-EXECUTION-MODULE-001 Phase 3B pre-execution UI", () => {
  test("PreExecution panel exists and is wired into the field startup page", () => {
    expect(exists(panelPath)).toBeTruthy();
    expect(exists(actionsPath)).toBeTruthy();
    const page = read(pagePath);
    expect(page).toContain('from "./PreExecution"');
    expect(page).toContain("<PreExecution");
    expect(page).toContain("visit_preparations");
    expect(page).toContain("visit_package_snapshots");
    expect(page).toContain("getWindowCapacity");
    expect(page).toContain("configuration_templates");
    // Readiness gate is computed server-side and handed to Startup.
    expect(page).toContain("preparationGated");
    expect(page).toContain("confirmed_ready_at");
    // The actions are thin wrappers over the shared readiness lib.
    const actions = read(actionsPath);
    expect(actions).toContain("saveVisitPreparation");
    expect(actions).toContain("confirmVisitReady");
    expect(actions).toContain("reopenVisitPreparation");
    expect(actions).toContain("supabaseServer");
  });

  test("Startup gates download/journey pre-Ready (visible reason, never hidden)", () => {
    const startup = read(startupPath);
    expect(startup).toContain("preparationGated");
    expect(startup).toContain("readiness-gate-reason");
    expect(startup).toContain("preparationRequired");
    expect(startup).toContain("disabled={cached || !!preparationGated || !visit.package_versions || cancelApproved}");
    expect(startup).toContain("disabled={!cached || !!journeyId || busy || !!preparationGated || cancelApproved}");
    // D-011 — Start Inspection reuses the Ready-created inspections row:
    // select-first, set started_at only when null, insert stays idempotent on
    // the visits -> inspections unique key.
    expect(startup).toContain('.from("inspections")');
    expect(startup).toContain('.eq("visit_id", visit.id).maybeSingle()');
    expect(startup).toContain('.is("started_at", null)');
    // The resume/pre-start conditions use the actual start marker.
    expect(startup).toContain("existing.started_at != null");
  });

  test("journey readiness guard migration redefines set_operational_state with EXE-READY-REQUIRED", () => {
    expect(exists(guardMigrationPath)).toBeTruthy();
    const sql = read(guardMigrationPath);
    expect(sql).toContain("create or replace function set_operational_state(p_visit uuid, p_next operational_state)");
    expect(sql).toContain("EXE-READY-REQUIRED");
    expect(sql).toContain("vp.confirmed_ready_at is not null");
    // Every 0015 guard, leg and the idempotent replay are preserved.
    for (const preserved of [
      "Not the assigned inspector for this visit (RBAC-009)",
      "Visit not found",
      "idempotent replay (offline retry safe)",
      "Illegal operational transition % -> % (STM-OPS)",
      "(p_next = 'on_the_way' and cur in ('new','prepared'))",
      "(p_next = 'arrived'    and cur = 'on_the_way')",
      "(p_next = 'executing'  and cur = 'arrived')",
      "grant execute on function set_operational_state(uuid, operational_state) to authenticated",
    ]) {
      expect(sql).toContain(preserved);
    }
    // Readiness is required only on the journey-start leg.
    expect(sql).toContain("if p_next = 'on_the_way' and not exists");
  });

  test("golden journey spec carries the conditional readiness leg", () => {
    const spec = read("apps/web/e2e/golden-journey.spec.ts");
    expect(spec).toContain("READINESS LEG (TASK-EXECUTION-MODULE-001 Phase 3B, D-010)");
    expect(spec).toContain("pre-execution-panel");
    expect(spec).toContain("prep-day-available");
    expect(spec).toContain("prep-save");
    expect(spec).toContain("prep-confirm");
    expect(spec).toContain("pre-execution-ready");
  });

  test("planning publish keeps the capacity blocker governed and the raw provider errors neutral", () => {
    const single = read("apps/web/src/app/(app)/planning/single/actions.ts");
    expect(single).toContain("submit_single_visit_for_supervision");
    expect(single).toContain("NEUTRAL_WRITE_ERROR");
    const bulk = read("apps/web/src/app/(app)/planning/bulk/actions.ts");
    expect(bulk).toContain('"capacity"');
    expect(bulk).toContain("Do not make a Planner resolve capacity");
    const reviewMeta = read("apps/web/src/app/(app)/planning/bulk/review/ReviewClient.tsx");
    expect(reviewMeta).toContain("capacity:");
  });

  test("workload page surfaces the configured daily cap from engine_settings.execution", () => {
    const workload = read("apps/web/src/app/(app)/visits/workload/WorkloadView.tsx");
    expect(workload).toContain('engine_settings');
    expect(workload).toContain('"execution"');
    expect(workload).toContain("daily_visit_cap");
    expect(workload).toContain("Daily visit limit");
    // The stale "no capacity threshold" claim is gone.
    expect(workload).not.toContain("no capacity threshold is configured");
  });

  test("new copy carries no banned plain-language-remediation phrases", () => {
    // Mirrors the banned list in e2e/terminology-regression.spec.ts.
    const banned = [
      "CR dossier",
      "Factory dossier",
      "factory registry",
      "plan register",
      "penalty lineage",
      "Evidence readiness & SLA-risk fingerprint",
      "scan-first queue",
      "contract-unverified",
      "RLS-scoped",
      "server-side projection",
      "read model",
    ];
    for (const file of [panelPath, actionsPath]) {
      const content = read(file);
      for (const phrase of banned) {
        expect(content.includes(phrase), `${file} contains banned phrase "${phrase}"`).toBe(false);
      }
      expect(/dossier/i.test(content), `${file} contains bare "dossier"`).toBe(false);
    }
  });

  test("decision log records D-010 and D-011", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("D-010");
    expect(log).toContain("D-011");
    expect(log).toContain("EXE-READY-REQUIRED");
  });
});
