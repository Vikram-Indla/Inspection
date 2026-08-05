import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./ensure_golden_journey_fixture.mjs", import.meta.url), "utf8");

test("golden fixture repair is production-refused, allowlisted and confirmation-gated", () => {
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /projectRef !== APPROVED_REF/);
  assert.match(source, /CONFIRM_GOLDEN_JOURNEY_NONPRODUCTION_FIXTURE/);
});

test("credentials stay external and rotated primary-cohort identities are authenticated", () => {
  assert.match(source, /setting\("SAQEEL_CROSS_ROLE_PASSWORD"\)/);
  assert.match(source, /setting\("SAQEEL_TEST_PLANNER_EMAIL"\)/);
  assert.match(source, /setting\("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL"\)/);
  assert.doesNotMatch(source, /console\.log\([^)]*(password|serviceRole|jwt)/i);
});

test("fixture is deterministic, idempotent and preserves maker-checker publication", () => {
  assert.match(source, /VERSION_ID = "9e5f0101-0000-4000-8000-000000000002"/);
  assert.match(source, /if \(existingVersions\.length\)/);
  assert.match(source, /planner\.userId === admin\.userId/);
  assert.match(source, /rpc\/publish_package_version/);
  assert.doesNotMatch(source, /package_versions[^\n]+method: "PATCH"/);
});

test("published linked fixture contains the governed FS-101 item set", () => {
  for (const code of ["FS-101", "FS-102", "FS-107", "EG-201", "HZ-310"]) assert.match(source, new RegExp(`"${code}"`));
  assert.match(source, /regulations\?\.status !== "published"/);
  assert.match(source, /GOVERNED_ITEMS/);
  assert.match(source, /ensureExact\("inspection_items"/);
  assert.match(source, /published\.package_id !== PACKAGE_ID/);
  assert.match(source, /!containsFs101\(published\.definition\)/);
});

test("recovery geofence uses only accepted versioned GIS authority", () => {
  assert.match(source, /GIS_AUTHORITY_PATH = resolve\("supabase\/migrations\/0001_foundation\.sql"\)/);
  assert.match(source, /"geofence_default_radius_m":\\s\*\(\\d\+\)/);
  assert.match(source, /startsWith\("v1-accepted-"\)/);
  assert.doesNotMatch(source, /const (?:GEOFENCE_)?RADIUS\s*=\s*\d+/);
});

test("recovery geofence is opt-in, harness-owned, idempotent and conflict-refused", () => {
  assert.match(source, /GOLDEN_RECOVERY_FACTORY_ID/);
  assert.match(source, /factory_code\?\.startsWith\("R3-QA-CERT-"\)/);
  assert.match(source, /before === authority\.radius/);
  assert.match(source, /different governed geofence radius/);
  assert.match(source, /method: "PATCH", body: \{ geofence_radius_m: authority\.radius \}/);
});

test("recovery geofence writes an append-only provenance audit without weakening scope", () => {
  assert.match(source, /action: "nonproduction_golden_geofence_reconciled"/);
  assert.match(source, /config_versions: \{ gis: authority\.version \}/);
  assert.match(source, /object_type: "factories"/);
  assert.doesNotMatch(source, /audit_events[^\n]+method: "(?:PATCH|DELETE)"/);
});
