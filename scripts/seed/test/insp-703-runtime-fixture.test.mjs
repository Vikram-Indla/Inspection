import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../ensure-insp-703-runtime-fixture.mjs", import.meta.url), "utf8");

test("INSP-703 fixture is fail-closed and keeps service authority read-only", () => {
  assert.match(source, /projectRefFromUrl\(url\) !== APPROVED_TARGET_REF/);
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /auth\/v1\/admin\/users\?page=1&per_page=1000/);
  assert.doesNotMatch(source, /auth\/v1\/admin\/users[^`]*method:/);
  assert.doesNotMatch(source, /serviceRole[^\n]*(POST|PATCH|DELETE)/);
});

test("INSP-703 fixture uses guarded planning and readiness transitions", () => {
  assert.match(source, /rpc\("publish_single_visit"/);
  assert.match(source, /rpc\("accept_prepare_assignment"/);
  assert.match(source, /rpc\("save_visit_preparation"/);
  assert.match(source, /rpc\("confirm_visit_ready"/);
  assert.doesNotMatch(source, /set_operational_state/);
  assert.doesNotMatch(source, /\/rest\/v1\/inspections[^\n]*method:\s*"(POST|PATCH)"/);
});

test("INSP-703 runtime assertion cannot skip when its fixture is absent", () => {
  const spec = readFileSync(
    new URL("../../../apps/web/e2e/insp-703-sync-label-arabic-contract.spec.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(spec, /test\.skip\(inspections\.length/);
  assert.match(spec, /must have an RLS-visible in-progress inspection/);
});
