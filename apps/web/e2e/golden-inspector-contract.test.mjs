import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");
const inspectorLogin = source.slice(
  source.indexOf("async function journeyInspectorPage"),
  source.indexOf("test.beforeAll"),
);

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

test("golden P2 Inspector login uses the governed structural form helpers", () => {
  assert.match(source, /identifierField,/);
  assert.match(source, /passwordField,/);
  assert.match(inspectorLogin, /identifierField\(page\)\.fill\(inspectorCreds\.email\)/);
  assert.match(inspectorLogin, /passwordField\(page\)\.fill\(inspectorCreds\.password\)/);
  assert.doesNotMatch(inspectorLogin, /locator\(["']#email["']\)/);
  assert.doesNotMatch(inspectorLogin, /locator\(["']#pw["']\)/);
});

test("golden P2 requires the shared Dashboard landing and useful content before field navigation", () => {
  assert.match(inspectorLogin, /url\.pathname === "\/dashboard"/);
  assert.match(inspectorLogin, /#role-dashboard-summary/);
  assert.match(inspectorLogin, /not\.toContainText\("ERR-AUTH"/);
  assert.match(inspectorLogin, /P2_LOGIN_STEP_TIMEOUT/);
  assert.doesNotMatch(inspectorLogin, /pathname\.startsWith\("\/field"\)/);
  assert.match(source, /P2 Inspector opens the governed field journey/);
  assert.match(source, /page\.goto\("\/field"\)/);
});

test("golden fixture rollover retires only overlapping unstarted harness-owned assignments", () => {
  assert.match(source, /async function retireOverlappingGoldenAssignments\(plannerJwt: string\)/);
  assert.match(source, /visits\.planning_status=in\.\(published,returned\)/);
  assert.match(source, /visits\.operational_state=eq\.new/);
  assert.match(source, /visits\.factories\.factory_code=like\.R3-QA-CERT-\*/);
  assert.match(source, /startsWith\("R3-QA-CERT-"\)/);
  assert.match(source, /rpc\/reschedule_published_visits_atomic/);
  assert.match(source, /Controlled UAT golden-journey fixture rollover/);
  assert.match(source, /await retireOverlappingGoldenAssignments\(planner\.jwt\)/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("golden fixture copies governed GIS authority and fails closed without a valid source", () => {
  assert.match(source, /function acceptedSeedGeofenceRadius\(\)/);
  assert.match(source, /"supabase", "migrations", "0001_foundation\.sql"/);
  assert.match(source, /accepted GIS seed must provide version provenance/);
  assert.match(source, /async function governedFixtureGeofenceRadius\(plannerJwt: string\)/);
  assert.match(source, /engine_settings\?engine=eq\.gis&select=settings,version_label&limit=1/);
  assert.match(source, /settings\?\.geofence_default_radius_m/);
  assert.match(source, /Number\.isFinite\(liveRadius\)/);
  assert.match(source, /liveRadius > 0/);
  assert.match(source, /Number\.isInteger\(liveRadius\)/);
  assert.match(source, /must provide version provenance/);
  assert.match(source, /return acceptedSeedGeofenceRadius\(\)/);
  assert.match(source, /geofence_radius_m: fixtureGeofenceRadius/);
  assert.doesNotMatch(source, /geofence_radius_m:\s*150/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});
