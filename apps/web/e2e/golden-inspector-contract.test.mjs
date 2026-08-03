import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");

test("golden P1 resolves the controlled Inspector identity without stale fixture credentials", () => {
  assert.match(source, /email: PERSONAS\.inspector\.email/);
  assert.match(source, /password: PERSONAS\.inspector\.password/);
  assert.match(source, /inspectorUserId = \(await login\(inspectorCreds\.email, inspectorCreds\.password\)\)\.userId/);
  assert.doesNotMatch(source, /9b4d2c98-c284-49c1-81ee-d418efc23c31/);
  assert.doesNotMatch(source, /g10-inspector-1784679710389@mim\.gov\.sa/);
});

test("golden P1 fails closed unless the controlled Inspector is a governed live option", () => {
  assert.match(source, /option:not\(\[value=""\]\)/);
  assert.match(source, /Planner selector must expose an eligible Inspector/);
  assert.match(source, /controlled Inspector must remain eligible in the governed Planner selector/);
  assert.match(source, /\.toContain\(inspectorUserId\)/);
  assert.match(source, /await inspectorSelect\.selectOption\(inspectorUserId\)/);
});
