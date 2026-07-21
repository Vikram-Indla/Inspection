import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 4A — Physical Journey, Cancellation &
// Location backend. Source-contract assertions only: no browser, no live
// backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 4A journey, cancellation and location", () => {
  const migrationPath = "supabase/migrations/20260721140000_execution_journey_cancellation.sql";
  const journeyLibPath = "apps/web/src/lib/execution/journey.ts";

  test("migration creates cancellation_requests RPC-only with governed phases", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.cancellation_requests");
    expect(sql).toContain("check (phase in ('pre_execution', 'on_the_way', 'arrived', 'executing'))");
    expect(sql).toContain("check (status in ('pending', 'approved', 'rejected', 'cancelled'))");
    expect(sql).toContain("idempotency_key text unique not null");
    expect(sql).toContain("evidence_id uuid references public.evidence(id)");
    expect(sql).toContain("enable row level security");
    // Read-only to the app: one read policy, no direct write policies.
    expect(sql).toContain("cancellation_requests_read");
    expect(sql).toContain("public.has_any_role(array['ops', 'planner', 'leadership'])");
    expect(sql).not.toMatch(/create policy \w+ on public\.cancellation_requests\s+for (insert|update|delete|all)/i);
    expect(sql).not.toMatch(/grant [^\n]*(insert|update|delete)[^\n]*on table public\.cancellation_requests/i);
  });

  test("visit_location_corrections is append-only and never overwrites master or planning location", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.visit_location_corrections");
    expect(sql).toContain("check (source in ('inspector_field', 'operations'))");
    expect(sql).toContain("check (capture_context in ('online', 'offline'))");
    expect(sql).toContain("visit_location_corrections_read");
    // Append-only: no update/delete policies, no write grants, guard trigger.
    expect(sql).not.toMatch(/create policy \w+ on public\.visit_location_corrections\s+for (insert|update|delete|all)/i);
    expect(sql).not.toMatch(/grant [^\n]*(insert|update|delete)[^\n]*on table public\.visit_location_corrections/i);
    expect(sql).toContain("guard_visit_location_correction");
    expect(sql).toContain("before update or delete on public.visit_location_corrections");
    expect(sql).toContain("IMMUTABLE: visit location corrections cannot be changed");
    // The correction RPC never touches the master or planning coordinates.
    expect(sql).not.toMatch(/update public\.factories/i);
    expect(sql).not.toMatch(/update public\.visits[^;]*planner_lat/i);
  });

  test("all five RPCs exist, definer-hardened, granted to authenticated", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create or replace function public.start_journey(p_visit uuid, p_device jsonb)");
    expect(sql).toContain("create or replace function public.request_active_cancellation(");
    expect(sql).toContain("create or replace function public.decide_active_cancellation(");
    expect(sql).toContain("create or replace function public.correct_visit_location(");
    expect(sql).toContain("create or replace function public.confirm_arrival(");
    expect(sql).toContain("security definer");
    for (const grant of [
      "grant execute on function public.start_journey(uuid, jsonb) to authenticated",
      "grant execute on function public.request_active_cancellation(uuid, text, text, uuid, text) to authenticated",
      "grant execute on function public.decide_active_cancellation(uuid, text, text) to authenticated",
      "grant execute on function public.correct_visit_location(uuid, numeric, numeric, numeric, text, uuid, text) to authenticated",
      "grant execute on function public.confirm_arrival(uuid, numeric, numeric, numeric, jsonb) to authenticated",
    ]) {
      expect(sql).toContain(grant);
    }
    // Capability guards per the seeded catalogue.
    expect(sql).toContain("public.has_capability('execution.start_journey')");
    expect(sql).toContain("public.has_capability('execution.request_active_cancel')");
    expect(sql).toContain("public.has_capability('operations.approve_active_cancel')");
    expect((sql.match(/public\.has_capability\('execution\.arrive'\)/g) ?? []).length).toBe(2);
  });

  test("start_journey is atomic, idempotent and enforces every §11 guard", () => {
    const sql = read(migrationPath);
    // Idempotent replay + concurrency race both return the one active Journey.
    expect(sql).toContain("where js.visit_id = p_visit and js.status = 'on_journey'");
    expect((sql.match(/'reused', true/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(sql).toContain("when unique_violation then");
    // Readiness (D-010), window timing, overdue warning, package integrity,
    // dispatch location and device provenance.
    expect(sql).toContain("EXE-READY-REQUIRED");
    expect(sql).toContain("journey_start_timing");
    expect(sql).toContain("current_date > v_visit.execution_date");
    expect(sql).toContain("journey_start_overdue");
    expect(sql).toContain("encode(digest(v_snapshot.definition::text, 'sha256'), 'hex')");
    expect(sql).toContain("coalesce(v.planner_lat, f.official_lat)");
    // The operational-state write still goes through the governed leg.
    expect(sql).toContain("perform public.set_operational_state(p_visit, 'on_the_way')");
    expect(sql).toContain("array['EXE-JOURNEY']");
  });

  test("active cancellation is request+decide; requester can never self-decide", () => {
    const sql = read(migrationPath);
    // Pre-start keeps the existing flag flow.
    expect(sql).toContain("EXE-CANCEL-USE-PRESTART");
    // Governed reason list + mandatory comment for 'other'.
    expect(sql).toContain("jsonb_array_elements(v_cfg -> 'cancellation_reasons')");
    expect(sql).toContain("EXE-CANCEL-COMMENT");
    // Requester != decision maker.
    expect(sql).toContain("EXE-CANCEL-SELF-DECIDE");
    expect(sql).toContain("if v_req.requested_by = v_actor then");
    // Idempotent-safe decide: same decision replayed returns current state,
    // a conflicting one fails closed.
    expect(sql).toContain("EXE-CANCEL-DECIDED");
    expect(sql).toContain("v_req.status = 'approved' and p_decision = 'approve'");
    // Rejection reason mandatory; rejection leaves the visit unchanged.
    expect(sql).toContain("EXE-CANCEL-DECISION-REASON");
    // Approval is terminal: visit cancelled, tracking stopped, schedule freed.
    expect(sql).toContain("planning_status = 'cancelled'");
    expect(sql).toContain("set status = 'completed', ended_at = now()");
    expect(sql).toContain("set status = 'returned'");
    expect(sql).toContain("set status = 'cancelled'");
    expect(sql).toContain("public.notify_roles(array['ops', 'planner'], 'cancellation_requested'");
    expect(sql).toContain("'cancellation_approved'");
    expect(sql).toContain("'cancellation_rejected'");
  });

  test("cancellation preserves captured data — nothing is deleted", () => {
    const sql = read(migrationPath);
    // No deletion of responses, evidence or geo telemetry anywhere.
    expect(sql).not.toMatch(/delete from public\.(checklist_responses|evidence|geo_events|visit_package_snapshots)/i);
    expect(sql).not.toMatch(/\btruncate\b/i);
    // Submitted-or-later inspections are never regressed by a cancellation.
    expect(sql).toContain("i.status not in ('submitted', 'under_review', 'approved', 'rejected', 'cancelled')");
    // No compliance-result writes.
    expect(sql).not.toMatch(/update public\.(findings|violations|penalties)/i);
  });

  test("confirm_arrival outside the fence mutates nothing — notice only", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("EXE-ARRIVAL-ACCURACY");
    expect(sql).toContain("gps_accuracy_checkin_max_m");
    expect(sql).toContain("arrival_detection_radius_m");
    expect(sql).toContain("coalesce(f.geofence_radius_m::numeric");
    // The outside early-return precedes every inside-path mutation.
    const arrival = sql.slice(sql.indexOf("create or replace function public.confirm_arrival("));
    const outsideIdx = arrival.indexOf("'notice', 'EXE-ARRIVAL-OUTSIDE'");
    expect(outsideIdx).toBeGreaterThan(-1);
    expect(outsideIdx).toBeLessThan(arrival.indexOf("'arrival', p_observed_lat"));
    expect(outsideIdx).toBeLessThan(arrival.indexOf("set status = 'arrived', ended_at = now()"));
    expect(outsideIdx).toBeLessThan(arrival.indexOf("perform public.set_operational_state(p_visit, 'arrived')"));
    // Effective target prefers the latest correction over registered values.
    expect(arrival).toContain("from public.visit_location_corrections c");
    expect(arrival.indexOf("from public.visit_location_corrections c")).toBeLessThan(
      arrival.indexOf("coalesce(v.planner_lat, f.official_lat)"),
    );
  });

  test("stable error tokens cover every validation rule", () => {
    const sql = read(migrationPath);
    for (const token of [
      "EXE-JOURNEY-DENIED",
      "EXE-JOURNEY-VISIT-STATE",
      "EXE-READY-REQUIRED",
      "EXE-JOURNEY-OUTSIDE-WINDOW",
      "EXE-JOURNEY-PACKAGE-MISSING",
      "EXE-JOURNEY-PACKAGE-INTEGRITY",
      "EXE-JOURNEY-LOCATION-MISSING",
      "EXE-JOURNEY-DEVICE-MISSING",
      "EXE-CANCEL-DENIED",
      "EXE-CANCEL-USE-PRESTART",
      "EXE-CANCEL-VISIT-STATE",
      "EXE-CANCEL-REASON",
      "EXE-CANCEL-COMMENT",
      "EXE-CANCEL-EVIDENCE",
      "EXE-CANCEL-IDEMPOTENCY",
      "EXE-CANCEL-NOT-FOUND",
      "EXE-CANCEL-SELF-DECIDE",
      "EXE-CANCEL-DECIDED",
      "EXE-CANCEL-DECISION-INVALID",
      "EXE-CANCEL-DECISION-REASON",
      "EXE-LOCATION-DENIED",
      "EXE-LOCATION-VISIT-STATE",
      "EXE-LOCATION-REASON",
      "EXE-LOCATION-RANGE",
      "EXE-LOCATION-CONTEXT",
      "EXE-LOCATION-EVIDENCE",
      "EXE-ARRIVAL-DENIED",
      "EXE-ARRIVAL-VISIT-STATE",
      "EXE-ARRIVAL-ACCURACY",
      "EXE-ARRIVAL-LOCATION-MISSING",
      "EXE-ARRIVAL-OUTSIDE",
    ]) {
      expect(sql).toContain(token);
    }
  });

  test("journey lib exports typed wrappers and maps tokens to neutral codes", () => {
    const lib = read(journeyLibPath);
    expect(lib).toContain('import "server-only"');
    expect(lib).toContain("export async function startJourney");
    expect(lib).toContain("export async function requestActiveCancellation");
    expect(lib).toContain("export async function decideActiveCancellation");
    expect(lib).toContain("export async function correctVisitLocation");
    expect(lib).toContain("export async function confirmArrival");
    expect(lib).toContain("export type JourneyStartResult");
    expect(lib).toContain("export type CancellationRequest");
    expect(lib).toContain("export type ArrivalResult");
    expect(lib).toContain("export type LocationCorrection");
    expect(lib).toContain('rpc("start_journey"');
    expect(lib).toContain('rpc("request_active_cancellation"');
    expect(lib).toContain('rpc("decide_active_cancellation"');
    expect(lib).toContain('rpc("correct_visit_location"');
    expect(lib).toContain('rpc("confirm_arrival"');
    expect(lib).toContain("NEUTRAL_WRITE_ERROR");
    for (const token of [
      "EXE-JOURNEY-DENIED",
      "EXE-READY-REQUIRED",
      "EXE-JOURNEY-OUTSIDE-WINDOW",
      "EXE-JOURNEY-PACKAGE-INTEGRITY",
      "EXE-CANCEL-USE-PRESTART",
      "EXE-CANCEL-SELF-DECIDE",
      "EXE-CANCEL-DECIDED",
      "EXE-LOCATION-RANGE",
      "EXE-ARRIVAL-ACCURACY",
    ]) {
      expect(lib).toContain(token);
    }
    const barrel = read("apps/web/src/lib/execution/index.ts");
    expect(barrel).toContain('export * from "./journey"');
  });

  test("migration is additive — no destructive statements", () => {
    const sql = read(migrationPath).toLowerCase();
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop type/);
    expect(sql).not.toMatch(/\btruncate\b/);
    expect(sql).not.toMatch(/alter type \S+ drop value/);
    expect(sql).not.toMatch(/alter table public\.\w+\s+drop column/);
    expect(sql).not.toMatch(/drop function/);
  });

  test("decision log records D-012..D-014", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("D-012");
    expect(log).toContain("D-013");
    expect(log).toContain("D-014");
    expect(log).toContain("operations.approve_active_cancel");
    expect(log).toContain("append-only");
  });
});
