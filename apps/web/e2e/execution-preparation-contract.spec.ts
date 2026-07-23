import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 3A — Pre-Execution readiness backend.
// Source-contract assertions only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 3A pre-execution readiness", () => {
  const migrationPath = "supabase/migrations/20260721121000_execution_preparation.sql";
  const readinessPath = "apps/web/src/lib/execution/readiness.ts";

  test("migration creates visit_preparations with least-privilege RLS and no delete", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.visit_preparations");
    expect(sql).toContain("visit_id uuid primary key references public.visits(id)");
    expect(sql).toContain("preparation_version integer not null default 1");
    expect(sql).toContain("execution_date date");
    expect(sql).toContain("confirmed_mode public.execution_mode");
    expect(sql).toContain("package_version_id uuid references public.package_versions(id)");
    expect(sql).toContain("form_config jsonb not null default '{}'::jsonb");
    expect(sql).toContain("confirmed_ready_at timestamptz");
    expect(sql).toContain("reopened_at timestamptz");
    expect(sql).toContain("enable row level security");
    // Assigned inspector writes pre-ready only; planner/ops/reviewer read.
    expect(sql).toContain("visit_preparations_read");
    expect(sql).toContain("visit_preparations_inspector_insert");
    expect(sql).toContain("visit_preparations_inspector_update");
    expect(sql).toContain("confirmed_ready_at is null");
    // No delete: no delete grant, no delete policy anywhere for the table.
    expect(sql).not.toMatch(/grant [^\n]*delete[^\n]*on table public\.visit_preparations/i);
    expect(sql).not.toMatch(/create policy \w+ on public\.visit_preparations\s+for delete/i);
  });

  test("visit_package_snapshots is an immutable, uniquely versioned snapshot store", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.visit_package_snapshots");
    expect(sql).toContain("unique (visit_id, preparation_version)");
    expect(sql).toContain("definition jsonb not null");
    expect(sql).toContain("checksum text not null");
    // Immutability guard, same pattern as package_version_item_snapshots.
    expect(sql).toContain("guard_visit_package_snapshot");
    expect(sql).toContain("before update or delete on public.visit_package_snapshots");
    expect(sql).toContain("IMMUTABLE: visit package snapshots cannot be changed");
    // SELECT-only: read policy, no write policies at all.
    expect(sql).toContain("visit_package_snapshots_read");
    expect(sql).not.toMatch(/create policy \w+ on public\.visit_package_snapshots\s+for (insert|update|delete|all)/i);
    expect(sql).toContain("grant select on table public.visit_package_snapshots to authenticated");
  });

  test("all five RPCs exist, definer-hardened, granted to authenticated", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create or replace function public.save_visit_preparation(");
    expect(sql).toContain("create or replace function public.confirm_visit_ready(p_visit uuid)");
    expect(sql).toContain("create or replace function public.reopen_visit_preparation(p_visit uuid)");
    expect(sql).toContain("create or replace function public.inspector_window_capacity(p_inspector uuid, p_window_start date, p_window_end date)");
    expect(sql).toContain("create or replace function public.inspector_daily_capacity(p_inspector uuid, p_date date)");
    expect(sql).toContain("security definer");
    for (const grant of [
      "grant execute on function public.save_visit_preparation(uuid, date, text, uuid, jsonb) to authenticated",
      "grant execute on function public.confirm_visit_ready(uuid) to authenticated",
      "grant execute on function public.reopen_visit_preparation(uuid) to authenticated",
      "grant execute on function public.inspector_window_capacity(uuid, date, date) to authenticated",
      "grant execute on function public.inspector_daily_capacity(uuid, date) to authenticated",
    ]) {
      expect(sql).toContain(grant);
    }
    // Every readiness RPC enforces the assigned inspector + capability guard.
    expect((sql.match(/public\.is_assigned_inspector\(p_visit\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect((sql.match(/public\.has_capability\('execution\.prepare'\)/g) ?? []).length).toBe(3);
  });

  test("stable error tokens cover every validation rule", () => {
    const sql = read(migrationPath);
    for (const token of [
      "EXE-PREP-DENIED",
      "EXE-PREP-VISIT-STATE",
      "EXE-PREP-DATE-WINDOW",
      "EXE-PREP-DATE-PAST",
      "EXE-PREP-CAPACITY",
      "EXE-PREP-MODE-INELIGIBLE",
      "EXE-PREP-PACKAGE-REQUIRED",
      "EXE-PREP-PACKAGE-INACTIVE",
      "EXE-PREP-MANDATORY-REMOVAL",
      "EXE-PREP-DUPLICATE",
      "EXE-PREP-CONFIG-INVALID",
      "EXE-PREP-FORM-INELIGIBLE",
      "EXE-PREP-REOPEN-REQUIRED",
      "EXE-PREP-JOURNEY-STARTED",
      "EXE-PREP-WORK-CAPTURED",
      "EXE-PREP-INCOMPLETE",
      "EXE-CAPACITY-WINDOW-FULL",
      "EXE-CAPACITY-WINDOW-INVALID",
    ]) {
      expect(sql).toContain(token);
    }
    // D-007 fail closed: only definition-explicit optional/removable sections.
    expect(sql).toContain("coalesce((s.elem ->> 'optional')::boolean, false)");
    expect(sql).toContain("coalesce((s.elem ->> 'removable')::boolean, false)");
    expect(sql).toContain("not coalesce((s.elem ->> 'mandatory')::boolean, false)");
    // self_assessment is always refused (release_2): the enum gate.
    expect(sql).toContain("self_assessment is ALWAYS refused");
    // Checksum is sha256 over the canonical jsonb rendering.
    expect(sql).toContain("encode(digest(v_resolved::text, 'sha256'), 'hex')");
  });

  test("one private counting helper serves both capacity RPCs; self excluded from prep cap", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create or replace function private.execution_daily_used(p_inspector uuid, p_date date)");
    // The helper carries the Phase 1 counting rule verbatim.
    const helper = sql.slice(sql.indexOf("private.execution_daily_used(p_inspector uuid, p_date date)"));
    expect(helper).toContain("v.planning_status = 'published'");
    expect(helper).toContain("coalesce(v.execution_date, v.window_start::date) = p_date");
    expect(helper).toContain("('submitted', 'under_review', 'approved', 'rejected', 'cancelled')");
    // Both public capacity RPCs evaluate the SAME helper.
    const daily = sql.slice(sql.indexOf("create or replace function public.inspector_daily_capacity"));
    expect(daily.slice(0, daily.indexOf("create or replace function public.inspector_window_capacity"))).toContain(
      "private.execution_daily_used(p_inspector, p_date)",
    );
    const window = sql.slice(sql.indexOf("create or replace function public.inspector_window_capacity"));
    expect(window).toContain("private.execution_daily_used(p_inspector, g.d::date)");
    // 62-day scan cap with truncation marker.
    expect(window).toContain("p_window_start + 61");
    expect(window).toContain("'truncated', v_truncated");
    // Capacity exclusion of self in both readiness RPCs.
    expect((sql.match(/capacity exclusion of self/g) ?? []).length).toBe(2);
    // Private helpers are not exposed.
    expect(sql).toContain("revoke all on function private.execution_daily_used(uuid, date) from public, anon, authenticated");
  });

  test("planning publish RPCs evaluate the window cap and keep every prior guard", () => {
    const sql = read(migrationPath);
    expect((sql.match(/EXE-CAPACITY-WINDOW-FULL/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect((sql.match(/public\.inspector_window_capacity\(v_inspector, p_window_start::date, p_window_end::date\)/g) ?? []).length).toBe(2);
    // create_immediate_visit is NOT touched in this phase.
    expect(sql).not.toContain("create or replace function public.create_immediate_visit");
    expect(sql).not.toContain("create or replace function create_immediate_visit");
    // Preserved guards from 20260714091727 (byte-for-byte logic).
    for (const preserved of [
      "bulk publish unauthorized",
      "bulk publish target set invalid",
      "bulk publish target set contains duplicates",
      "bulk publish visit type invalid",
      "bulk publish window invalid",
      "bulk publish package unavailable",
      "bulk publish target unavailable",
      "bulk publish assignment map invalid",
      "bulk publish duplicate active visit",
      "bulk publish inspector ineligible",
      "bulk publish no inspector available",
      "bulk publish inspector unavailable",
      "bulk plan validation transition failed",
      "bulk plan publish transition failed",
      "single publish unauthorized",
      "single publish visit type invalid",
      "single publish window invalid",
      "single publish location unconfirmed",
      "single publish planner location invalid",
      "single publish package unavailable",
      "single publish factory unavailable",
      "single publish license mismatch",
      "single publish location unavailable",
      "single publish virtual mode unavailable",
      "single publish duplicate active visit",
      "single publish inspector ineligible",
      "single publish inspector unavailable",
      "single publish no inspector available",
      "single publish resume unavailable",
      "single plan validation transition failed",
      "single plan publish transition failed",
      "pg_advisory_xact_lock",
      "insert into notifications (event_key, recipient, payload, channel)",
      "update visit_plans set status = 'validated'",
      "update visits set planning_status = 'published'",
    ]) {
      expect(sql).toContain(preserved);
    }
  });

  test("readiness lib exports typed wrappers and maps tokens to neutral codes", () => {
    const lib = read(readinessPath);
    expect(lib).toContain('import "server-only"');
    expect(lib).toContain("export async function saveVisitPreparation");
    expect(lib).toContain("export async function confirmVisitReady");
    expect(lib).toContain("export async function reopenVisitPreparation");
    expect(lib).toContain("export async function getWindowCapacity");
    expect(lib).toContain("export type VisitPreparation");
    expect(lib).toContain("export type VisitPackageSnapshot");
    expect(lib).toContain("export type WindowCapacity");
    expect(lib).toContain('rpc("save_visit_preparation"');
    expect(lib).toContain('rpc("confirm_visit_ready"');
    expect(lib).toContain('rpc("reopen_visit_preparation"');
    expect(lib).toContain('rpc("inspector_window_capacity"');
    expect(lib).toContain("NEUTRAL_WRITE_ERROR");
    for (const token of [
      "EXE-PREP-DENIED",
      "EXE-PREP-DATE-WINDOW",
      "EXE-PREP-DATE-PAST",
      "EXE-PREP-CAPACITY",
      "EXE-PREP-MODE-INELIGIBLE",
      "EXE-PREP-PACKAGE-REQUIRED",
      "EXE-PREP-PACKAGE-INACTIVE",
      "EXE-PREP-MANDATORY-REMOVAL",
      "EXE-PREP-DUPLICATE",
      "EXE-PREP-REOPEN-REQUIRED",
      "EXE-PREP-JOURNEY-STARTED",
      "EXE-PREP-WORK-CAPTURED",
    ]) {
      expect(lib).toContain(token);
    }
    const barrel = read("apps/web/src/lib/execution/index.ts");
    expect(barrel).toContain('export * from "./readiness"');
  });

  test("migration is additive — no destructive statements", () => {
    const sql = read(migrationPath).toLowerCase();
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop type/);
    expect(sql).not.toMatch(/\btruncate\b/); // \b keeps the 62-day "truncated" marker legal
    expect(sql).not.toMatch(/alter type \S+ drop value/);
    expect(sql).not.toMatch(/alter table public\.(inspections|visits|assignments)\s+drop column/);
    expect(sql).not.toMatch(/drop function/);
  });

  test("decision log records D-007..D-009", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("D-007");
    expect(log).toContain("D-008");
    expect(log).toContain("D-009");
    expect(log).toContain("fail closed");
    expect(log).toContain("EXE-CAPACITY-WINDOW-FULL");
  });
});
