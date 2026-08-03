import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../src/app/(app)/planning/single/page.tsx", import.meta.url), "utf8");
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
