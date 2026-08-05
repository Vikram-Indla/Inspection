import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./provision_governed_uat_identities.mjs", import.meta.url), "utf8");

test("governed UAT provisioning is project-allowlisted and confirmation-gated", () => {
  assert.match(source, /APPROVED_REF = "iiozvqntawxfwbgffzqu"/);
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /CONFIRM_GOVERNED_UAT_IDENTITIES_NONPRODUCTION/);
  assert.match(source, /value\("SAQEEL_UAT_PASSWORD"\)\?\.trim\(\)/);
  assert.match(source, /optionalOverride \|\| required\("SAQEEL_CROSS_ROLE_PASSWORD"\)/);
  assert.doesNotMatch(source, /SAQEEL_UAT_PASSWORD[^\n]*\|\|[^\n]*["'][^"']+["']/);
});

test("complete deterministic cohort uses the government domain", () => {
  assert.match(source, /Array\.from\(\{ length: 30 \}/);
  assert.match(source, /inspector\$\{index \+ 1\}@mim\.gov\.sa/);
  assert.match(source, /definitions\.length !== 45/);
  assert.doesNotMatch(source, /@local\.saqeel\.test|@saqeel\.test/);
});

test("reruns reconcile by deterministic id and refuse email collisions", () => {
  assert.match(source, /byEmail && byEmail\.id !== account\.id/);
  assert.match(source, /if \(byId\).*method: "PUT"/s);
  assert.match(source, /on_conflict=user_id/);
  assert.match(source, /on_conflict=user_id,role_key/);
});

test("all accounts are authenticated without secret output", () => {
  assert.match(source, /for \(const account of definitions\).*grant_type=password/s);
  assert.match(source, /session\.user\?\.id !== account\.id/);
  assert.doesNotMatch(source, /console\.log/);
  assert.doesNotMatch(source, /sharedSecret[^\n]*process\.stdout/);
});

test("primary-cohort harnesses use the optional override then governed fallback", () => {
  const harnesses = [
    "../../apps/web/e2e/insp-primary-cohort-dashboard.spec.ts",
    "../../apps/web/e2e/dm-007-planner-auth-session.spec.ts",
    "../../apps/web/e2e/inspector-responsive/route-sweep-responsive.spec.ts",
    "../../apps/web/e2e/inspector-responsive/visit-statement-responsive.spec.ts",
  ];
  for (const relativePath of harnesses) {
    const harness = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.match(harness, /SAQEEL_UAT_PASSWORD\?\.trim\(\) \|\| process\.env\.SAQEEL_CROSS_ROLE_PASSWORD\?\.trim\(\)/);
  }
});
