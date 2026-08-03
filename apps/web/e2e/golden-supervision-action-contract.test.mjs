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

test("golden P1.5 releases only the exact submitted visit to the controlled Inspector", () => {
  assert.match(journey, /journeySupervisorPage/);
  assert.match(journey, /identifierField\(page\)\.fill\(PERSONAS\.supervisor\.email\)/);
  assert.match(journey, /passwordField\(page\)\.fill\(PERSONAS\.supervisor\.password\)/);
  assert.match(journey, /url\.pathname === "\/dashboard"/);
  assert.match(journey, /#role-dashboard-summary/);
  assert.match(p1, /journeySupervisorPage\(browser\)/);
  assert.match(p1, /input\[name="visit_id"\]\[value="\$\{visitId\}"\]/);
  assert.match(p1, /toHaveCount\(1\)/);
  assert.match(p1, /Supervisor queue must expose the controlled Inspector/);
  assert.match(p1, /selectOption\(inspectorUserId\)/);
  assert.match(p1, /toHaveValue\(inspectorUserId\)/);
  assert.match(p1, /name: \/approve & release\/i/);
  assert.match(p1, /planning_status: "published"/);
  assert.match(p1, /inspector_id: inspectorUserId/);
});

test("Supervisor roster starts from governed Inspector grants and tolerates profile-name RLS", () => {
  assert.match(supervisionPage, /from\("user_roles"\)/);
  assert.match(supervisionPage, /eq\("role_key", "inspector"\)/);
  assert.match(supervisionPage, /profiles!user_roles_user_id_fkey\(full_name\)/);
  assert.match(supervisionPage, /profile\?\.full_name\?\.trim\(\) \|\| userId\.slice\(0, 8\)/);
  assert.doesNotMatch(supervisionPage, /from\("profiles"\).*user_roles/);
});
