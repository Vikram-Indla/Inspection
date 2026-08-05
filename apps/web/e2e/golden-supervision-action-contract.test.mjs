import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/(app)/planning/single/page.tsx", import.meta.url), "utf8");
const supervisionPage = readFileSync(new URL("../src/app/(app)/planning/supervision/page.tsx", import.meta.url), "utf8");
const journey = readFileSync(new URL("./golden-journey.spec.ts", import.meta.url), "utf8");
const p1 = journey.slice(
  journey.indexOf('test("P1 planner:'),
  journey.indexOf('test("P2 inspector:'),
);

test("Single Planning gates submission through the server action's fail-closed capability resolver", () => {
  assert.match(page, /getPlanningAccess\(sb, \["planning\.submit_for_supervision"\]\)/);
  assert.match(page, /transitionAccess\.error === null/);
  assert.match(page, /transitionAccess\.can\("planning\.submit_for_supervision"\)/);
  assert.match(page, /transitionsExecutable=\{transitionsExecutable\}/);
  assert.doesNotMatch(page, /transitionsExecutable=\{contract\.data\.can_submit_for_supervision\}/);
});

test("golden P1 uses the governed supervision action and requires its successful redirect", () => {
  assert.match(p1, /name: \/submit for supervision\/i/);
  assert.match(p1, /url\.pathname === "\/planning\/supervision"/);
  assert.match(p1, /url\.searchParams\.get\("submitted"\)/);
  assert.doesNotMatch(p1, /name: \/publish visit\/i/);
});

test("golden P1.5 releases only the exact submitted visit to a reserved available controlled Inspector", () => {
  assert.match(journey, /journeySupervisorPage/);
  assert.match(journey, /identifierField\(page\)\.fill\(PERSONAS\.supervisor\.email\)/);
  assert.match(journey, /passwordField\(page\)\.fill\(PERSONAS\.supervisor\.password\)/);
  assert.match(journey, /url\.pathname === "\/dashboard"/);
  assert.match(journey, /#role-dashboard-summary/);
  assert.match(p1, /journeySupervisorPage\(browser\)/);
  assert.match(p1, /goto\(`\/planning\/supervision\?submitted=\$\{visitId\}`\)/);
  assert.match(p1, /input\[name="visit_id"\]\[value="\$\{visitId\}"\]/);
  assert.match(p1, /toHaveCount\(1\)/);
  assert.match(p1, /rpc\/list_available_supervision_inspectors/);
  assert.match(p1, /reserved Inspector must remain authoritatively available/);
  assert.match(p1, /Supervisor queue must expose the controlled Inspector/);
  assert.match(p1, /selectOption\(inspectorUserId\)/);
  assert.match(p1, /toHaveValue\(inspectorUserId\)/);
  assert.match(p1, /name: \/approve & release\/i/);
  assert.match(p1, /approved request must leave the exact pending queue/);
  assert.match(p1, /No visit is awaiting supervision\./);
  assert.match(p1, /planning_supervision_requests\?visit_id=eq\.\$\{visitId\}&select=status,decision_by,decided_at,proposed_inspector_id/);
  assert.match(p1, /decision_by: supervisorSession\.userId/);
  assert.match(p1, /proposed_inspector_id: proposedInspectorUserId/);
  assert.match(p1, /planning_status: "published"/);
  assert.match(p1, /inspector_id: inspectorUserId/);
  assert.match(p1, /status: "assigned"/);
  assert.match(p1, /rpc\/release_nonproduction_golden_inspector_lease/);
  assert.match(p1, /available-controlled-inspector\.png/);
  assert.doesNotMatch(p1, /exactRequest\.getByRole\("status"\)/);
});

test("golden P1.5 proves the exact request is Supervisor-visible before rendering", () => {
  assert.match(p1, /const supervisorSession = await login\(PERSONAS\.supervisor\.email, PERSONAS\.supervisor\.password\)/);
  assert.match(p1, /planning_supervision_requests\?visit_id=eq\.\$\{visitId\}&status=eq\.pending&select=id,visit_id,visits!inner\(planning_status\)/);
  assert.match(p1, /verify exact pending supervision request/);
  assert.match(p1, /rows\.length > 1/);
  assert.match(p1, /rows\[0\]\.visit_id === visitId/);
  assert.match(p1, /rows\[0\]\.visits\.planning_status === "pending_supervision"/);
  assert.match(p1, /"exact Supervisor-visible pending request", 5/);
  assert.match(p1, /await supervisor\.goto\(`\/planning\/supervision\?submitted=\$\{visitId\}`\)/);
  assert.match(p1, /the exact P1 visit must have one pending supervision request/);
  assert.doesNotMatch(p1, /waitForTimeout|setTimeout\([^)]*Supervisor/);
});

test("Supervisor queue targets an exact validated visit instead of relying on the bounded oldest-first list", () => {
  assert.match(supervisionPage, /searchParams: Promise<\{ submitted\?: string \}>/);
  assert.match(supervisionPage, /const UUID = \^?\/\^\[0-9a-f\]/);
  assert.match(supervisionPage, /submitted && !UUID\.test\(submitted\)/);
  assert.match(supervisionPage, /if \(submitted\) requestQuery = requestQuery\.eq\("visit_id", submitted\)/);
  assert.doesNotMatch(supervisionPage, /delete\(|update\(|cancel_published_visits_atomic/);
});

test("Supervisor roster is request-scoped by the same authoritative availability predicate as release", () => {
  assert.match(supervisionPage, /rpc\("list_available_supervision_inspectors", \{ p_visit_ids: visitIds \}\)/);
  assert.match(supervisionPage, /inspectorsByVisit\[visitId\]/);
  assert.doesNotMatch(supervisionPage, /from\("user_roles"\)/);
});
