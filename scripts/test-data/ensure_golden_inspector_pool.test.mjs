import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source = readFileSync(new URL("./ensure_golden_inspector_pool.mjs", import.meta.url), "utf8");

test("pool is exactly allowlisted, production-refused and acknowledgement-gated", () => {
  assert.match(source, /APPROVED_REF = "iiozvqntawxfwbgffzqu"/);
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /CONFIRM_GOLDEN_INSPECTOR_POOL_NONPRODUCTION/);
});
test("pool supports indexed slots 01 through 30 with legacy slot-one compatibility", () => {
  assert.match(source, /Array\.from\(\{ length: 30 \}/);
  assert.match(source, /SAQEEL_TEST_INSPECTOR_\$\{slot\}_EMAIL/);
  assert.match(source, /SAQEEL_TEST_INSPECTOR_\$\{slot\}_PASSWORD/);
  assert.match(source, /SAQEEL_TEST_INSPECTOR_EMAIL/);
  assert.match(source, /SAQEEL_TEST_PASSWORD/);
});
test("partial and duplicate references fail closed and credentials are never created or printed", () => {
  assert.match(source, /partial slot/);
  assert.match(source, /duplicate Inspector email references/);
  assert.match(source, /duplicate authenticated users/);
  assert.doesNotMatch(source, /\/auth\/v1\/admin\/users|password:\s*['"][^'"]+['"]|console\.log/);
});
test("reconciliation is exact, idempotent and limited to active Riyadh synthetic roster rows", () => {
  assert.match(source, /GOLDEN_POOL_PROFILE_COLLISION/);
  assert.match(source, /GOLDEN_POOL_ROSTER_COLLISION/);
  assert.match(source, /profileScopeDrift/);
  assert.match(source, /rosterDrift/);
  assert.match(source, /before_state:/);
  assert.match(source, /role_key: "inspector"/);
  assert.match(source, /provenance: "NONPRODUCTION_SYNTHETIC"/);
  assert.match(source, /seed_batch_id: BATCH/);
  assert.match(source, /NONPRODUCTION_GOLDEN_INSPECTOR_RECONCILED/);
});
test("lease selection accepts only a returned configured user", () => {
  assert.match(source, /acquire_nonproduction_golden_inspector_lease/);
  assert.match(source, /leased user is outside the configured pool/);
  assert.match(source, /remaining_reference_gap: 30 - authenticated\.length/);
  assert.match(source, /reconciliation\.filter\(result => result\.changed\)\.length/);
  assert.match(source, /release_nonproduction_golden_inspector_lease/);
  assert.match(source, /verify_nonproduction_golden_inspector_lease/);
  assert.match(source, /p_inspector_id: chosen\.userId/);
  assert.match(source, /p_window_start: windowStart, p_window_end: windowEnd/);
  assert.match(source, /lease verification failed closed/);
  assert.match(source, /GOLDEN_INSPECTOR_LEASE_EVENT/);
});
