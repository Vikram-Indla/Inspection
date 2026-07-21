import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 1 canonical contracts", () => {
  const migrationPath = "supabase/migrations/20260721090000_execution_canonical_contracts.sql";

  test("migration exists with the lifecycle projection, capability seeds and shared services", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);

    // Additive enum value only; Planning status enum never gains 'approved'.
    expect(sql).toContain("alter type public.operational_state add value if not exists 'under_review';");
    expect(sql).not.toMatch(/alter type public\.planning_status add value[^;]*approved/i);

    // Lifecycle projection column + deterministic mapping (D-001/D-002).
    expect(sql).toContain("lifecycle_status");
    expect(sql).toContain("when 'not_started'  then 'new'");
    expect(sql).toContain("when 'submitted'    then 'in_progress'");
    expect(sql).toContain("when 'under_review' then 'in_progress'");
    expect(sql).toContain("when 'returned'     then 'returned'");
    expect(sql).toContain("when 'cancelled'    then 'cancelled'");
    expect(sql).toContain("check (lifecycle_status in ('new','in_progress','returned','approved','rejected','cancelled'))");
    expect(sql).toContain("sync_inspection_lifecycle_status");
    expect(sql).toContain("before insert or update of status on public.inspections");

    // Execution Date on visits, constrained to the window, NOT VALID.
    expect(sql).toContain("execution_date date");
    expect(sql).toContain("not valid");

    // Capability catalogue: 22 seeds, role mapping, guarded RPC.
    expect(sql).toContain("create table if not exists public.capabilities");
    expect(sql).toContain("create table if not exists public.role_capabilities");
    expect((sql.match(/\('execution\./g) ?? []).length).toBeGreaterThanOrEqual(9);
    expect((sql.match(/\('review\./g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect((sql.match(/\('operations\./g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((sql.match(/\('admin\./g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(sql).toContain("public.has_capability");
    expect(sql).toContain("grant execute on function public.has_capability(text) to authenticated");

    // Governed engine seed + shared daily-cap service (D-001).
    expect(sql).toContain("'execution'");
    expect(sql).toContain('"daily_visit_cap": 10');
    expect(sql).toContain("v1-execution-canonical-2026-07-21");
    expect(sql).toContain("public.inspector_daily_capacity");
    expect(sql).toContain("coalesce(v.execution_date, v.window_start::date) = p_date");
    expect(sql).toContain("v.planning_status = 'published'");
    expect(sql).toContain("insufficient_privilege");
  });

  test("migration is additive — no destructive statements against inspections or visits", () => {
    const sql = read(migrationPath).toLowerCase();
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/alter table public\.(inspections|visits)\s+drop column/);
    expect(sql).not.toMatch(/alter column (status|operational_state|planning_status)\b/);
    expect(sql).not.toMatch(/update public\.inspections\s+set\s+status\b/);
    expect(sql).not.toMatch(/drop type/);
    expect(sql).not.toMatch(/truncate/);
  });

  test("shared execution libs exist and export the projection helpers", () => {
    const stateMachine = read("apps/web/src/lib/execution/state-machine.ts");
    const capabilities = read("apps/web/src/lib/execution/capabilities.ts");
    const dailyCap = read("apps/web/src/lib/execution/daily-cap.ts");
    const barrel = read("apps/web/src/lib/execution/index.ts");

    expect(stateMachine).toContain("export function projectLifecycleStatus");
    expect(stateMachine).toContain("export function projectOperationalState");
    expect(stateMachine).toContain("export const OPERATIONAL_TRANSITIONS");
    expect(stateMachine).toContain("export function canTransitionOperational");
    expect(stateMachine).toContain('"ready_for_execution"');
    // D-002: stored 'prepared' projects to Ready for Execution.
    expect(stateMachine).toContain('case "prepared":');

    expect((capabilities.match(/"(execution|review|operations|admin)\./g) ?? []).length).toBeGreaterThanOrEqual(22);
    expect(capabilities).toContain("export function defaultCapabilitiesForRoles");
    expect(capabilities).toContain("export function roleHasCapability");

    expect(dailyCap).toContain('import "server-only"');
    expect(dailyCap).toContain("export const DAILY_CAP_DEFAULT = 10");
    expect(dailyCap).toContain('rpc("inspector_daily_capacity"');

    expect(barrel).toContain('export * from "./state-machine"');
    expect(barrel).toContain('export * from "./capabilities"');
    expect(barrel).toContain('export * from "./daily-cap"');
  });

  test("preservation guard — offline stores keep their accepted identities", () => {
    const offline = read("apps/web/src/lib/offline.ts");
    const f360 = read("apps/web/src/lib/factory360/offline-snapshot.ts");
    expect(offline).toContain("mim-field-v1");
    expect(f360).toContain("mim-field-f360-v1");
  });

  test("decision log records D-001..D-003", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("TASK-EXECUTION-MODULE-001");
    expect(log).toContain("D-001");
    expect(log).toContain("D-002");
    expect(log).toContain("D-003");
  });
});
