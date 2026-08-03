import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../../supabase/migrations/20260803210000_nonproduction_golden_inspector_leases.sql", import.meta.url), "utf8");
const reuseSql = readFileSync(new URL("../../supabase/migrations/20260803213000_nonproduction_golden_inspector_lease_reuse.sql", import.meta.url), "utf8");

test("golden leases are isolated, immutable, service-role-only test coordination", () => {
  assert.match(sql, /nonproduction_golden_inspector_leases/);
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /revoke all .* from public, anon, authenticated/);
  assert.match(sql, /revoke update, delete, truncate .* from service_role/g);
  assert.match(sql, /auth\.role\(\)\) <> 'service_role'/g);
  assert.doesNotMatch(sql, /alter table public\.assignments|alter table public\.visits|disable row level security/i);
});

test("acquisition accepts at most 30 unique ordered candidates and serializes concurrency", () => {
  assert.match(sql, /cardinality\(p_candidate_ids\) not between 1 and 30/);
  assert.match(sql, /cardinality\(p_candidate_ids\) <> \(select count\(distinct id\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /with ordinality/);
  assert.match(sql, /order by position limit 1/);
  assert.match(sql, /GOLDEN-LEASE-NO-AVAILABLE-INSPECTOR/);
});

test("availability preserves ordinary conflicts and requires controlled roster ownership", () => {
  assert.match(sql, /provenance='NONPRODUCTION_SYNTHETIC'/);
  assert.match(sql, /persona_key like 'golden_inspector_%'/);
  assert.match(sql, /profile\.account_status='active' and profile\.region='Riyadh'/);
  assert.match(sql, /role\.role_key='inspector'/);
  assert.match(sql, /planning_status in \('draft','validated','pending_supervision','published','returned'\)/);
  assert.match(sql, /visit\.window_start<p_window_end and visit\.window_end>p_window_start/);
});

test("leases expire or release through append-only events and audit", () => {
  assert.match(sql, /lease\.expires_at>clock_timestamp\(\)/);
  assert.match(sql, /not exists \(select 1 from public\.nonproduction_golden_inspector_lease_events/);
  assert.match(sql, /event_type in \('released','terminal'\)/);
  assert.match(sql, /on conflict \(lease_id,event_type\) do nothing/);
  assert.match(sql, /NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_ACQUIRED/);
  assert.match(sql, /NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_/);
});

function verifyLease(lease, request, now) {
  if (lease.inspectorId !== request.inspectorId) throw new Error("GOLDEN-LEASE-INSPECTOR-MISMATCH");
  if (lease.expiresAt <= now) throw new Error("GOLDEN-LEASE-EXPIRED");
  if (lease.released) throw new Error("GOLDEN-LEASE-RELEASED");
  if (lease.windowStart !== request.windowStart || lease.windowEnd !== request.windowEnd) throw new Error("GOLDEN-LEASE-WINDOW-MISMATCH");
  return true;
}

const activeLease = { inspectorId: "inspector-a", expiresAt: 200, released: false, windowStart: 10, windowEnd: 20 };
test("behavior: mismatched Inspector and lease fails closed", () => {
  assert.throws(() => verifyLease(activeLease, { inspectorId: "inspector-b", windowStart: 10, windowEnd: 20 }, 100), /INSPECTOR-MISMATCH/);
});
test("behavior: expired and released leases fail closed", () => {
  assert.throws(() => verifyLease({ ...activeLease, expiresAt: 100 }, { inspectorId: "inspector-a", windowStart: 10, windowEnd: 20 }, 100), /EXPIRED/);
  assert.throws(() => verifyLease({ ...activeLease, released: true }, { inspectorId: "inspector-a", windowStart: 10, windowEnd: 20 }, 100), /RELEASED/);
});
test("behavior: wrong run window fails closed", () => {
  assert.throws(() => verifyLease(activeLease, { inspectorId: "inspector-a", windowStart: 11, windowEnd: 20 }, 100), /WINDOW-MISMATCH/);
});
test("behavior: release refuses a visit assigned to another Inspector", () => {
  assert.match(sql, /assignment\.visit_id=p_visit_id and assignment\.inspector_id=v_inspector/);
  assert.match(sql, /GOLDEN-LEASE-VISIT-MISMATCH/);
});
test("verification RPC is service-role-only and checks every active binding", () => {
  assert.match(sql, /verify_nonproduction_golden_inspector_lease/);
  assert.match(sql, /v_lease\.inspector_id<>p_inspector_id/);
  assert.match(sql, /v_lease\.expires_at<=clock_timestamp\(\)/);
  assert.match(sql, /where event\.lease_id=v_lease\.id/);
  assert.match(sql, /v_lease\.window_start is distinct from p_window_start/);
  assert.match(sql, /revoke all on function public\.verify_nonproduction_golden_inspector_lease[\s\S]*from public,anon,authenticated/);
});

function canReacquire({ activeLease, overlap }) {
  if (activeLease && !activeLease.released && !activeLease.expired) return false;
  if (!overlap) return true;
  return overlap.factoryCode.startsWith("R3-QA-CERT-") && overlap.planningStatus === "published" && overlap.operationalState === "new";
}

test("behavior: acquire then terminal release permits reacquire with a new run key", () => {
  assert.equal(canReacquire({ activeLease: { released: true, expired: false }, overlap: null }), true);
  assert.match(reuseSql, /GOLDEN-LEASE-RUN-KEY-CLOSED/);
  assert.match(reuseSql, /not exists \(select 1 from public\.nonproduction_golden_inspector_lease_events/);
});

test("behavior: an active overlapping lease still refuses reacquisition", () => {
  assert.equal(canReacquire({ activeLease: { released: false, expired: false }, overlap: null }), false);
});

test("behavior: only an unstarted harness predecessor may defer to governed cleanup", () => {
  const ownedNew = { factoryCode: "R3-QA-CERT-123", planningStatus: "published", operationalState: "new" };
  assert.equal(canReacquire({ activeLease: null, overlap: ownedNew }), true);
  assert.equal(canReacquire({ activeLease: null, overlap: { ...ownedNew, factoryCode: "BUSINESS-123" } }), false);
  assert.equal(canReacquire({ activeLease: null, overlap: { ...ownedNew, operationalState: "prepared" } }), false);
  assert.equal(canReacquire({ activeLease: null, overlap: { ...ownedNew, operationalState: "under_review" } }), false);
});

test("reuse migration preserves service-role, roster, conflict and audit boundaries", () => {
  assert.match(reuseSql, /auth\.role\(\)\) <> 'service_role'/);
  assert.match(reuseSql, /roster\.provenance='NONPRODUCTION_SYNTHETIC'/);
  assert.match(reuseSql, /factory\.factory_code like 'R3-QA-CERT-%'/);
  assert.match(reuseSql, /visit\.operational_state='new'/);
  assert.match(reuseSql, /NONPRODUCTION_GOLDEN_INSPECTOR_LEASE_ACQUIRED/);
  assert.doesNotMatch(reuseSql, /alter table public\.(assignments|visits)|disable row level security|delete from/i);
});
