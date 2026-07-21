#!/usr/bin/env node
// Boundary-condition checks for lib/dates.ts (Wave 3, V5.1 §7). No test
// runner is wired into this repo yet (Playwright e2e only) — this is a
// standalone, CI-runnable assertion script until one is. Run:
//   node --experimental-strip-types scripts/verify-dates.mjs   (Node <23.6)
//   node scripts/verify-dates.mjs                              (Node >=23.6)
import assert from "node:assert/strict";
import {
  formatDate, formatDateTime, formatDue, formatDateRange, formatTime,
  riyadhDateParts, riyadhDayDiff, isBeforeRiyadhToday, formatRelative,
} from "../src/lib/dates.ts";

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`ok  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
}

// English day-month-year order, not locale-default month-day-year.
check("formatDate en renders day-month-year (18 Jul 2026, not Jul 18)", () => {
  assert.equal(formatDate("2026-07-18T10:00:00Z", "en"), "18 Jul 2026");
});

// 22:30 UTC on Jul 18 is 01:30 Riyadh (+3) on Jul 19 — must roll to the next
// Riyadh calendar day, not stay on the UTC day.
check("riyadhDateParts rolls the day forward across the UTC->Riyadh +3h offset", () => {
  const parts = riyadhDateParts("2026-07-18T22:30:00Z");
  assert.deepEqual(parts, { year: 2026, month: 7, day: 19 });
});

// Just before Riyadh midnight vs just after — must land on different days.
check("riyadhDateParts: 20:59 UTC and 21:01 UTC straddle the Riyadh midnight boundary", () => {
  const before = riyadhDateParts("2026-07-18T20:59:00Z"); // 23:59 Riyadh, Jul 18
  const after = riyadhDateParts("2026-07-18T21:01:00Z");  // 00:01 Riyadh, Jul 19
  assert.deepEqual(before, { year: 2026, month: 7, day: 18 });
  assert.deepEqual(after, { year: 2026, month: 7, day: 19 });
});

check("riyadhDayDiff is 0 for two instants on the same Riyadh day", () => {
  assert.equal(riyadhDayDiff("2026-07-18T00:10:00Z", "2026-07-18T20:00:00Z"), 0);
});

check("riyadhDayDiff is 1 across the Riyadh midnight boundary even though <3h apart", () => {
  assert.equal(riyadhDayDiff("2026-07-18T20:59:00Z", "2026-07-18T21:01:00Z"), 1);
});

check("riyadhDayDiff handles a Gregorian month rollover (31 Jul -> 1 Aug)", () => {
  assert.equal(riyadhDayDiff("2026-07-31T22:00:00Z", "2026-08-01T22:00:00Z"), 1);
});

check("isBeforeRiyadhToday: yesterday (Riyadh) is before today", () => {
  assert.equal(isBeforeRiyadhToday("2026-07-17T12:00:00Z", "2026-07-18T12:00:00Z"), true);
});
check("isBeforeRiyadhToday: same Riyadh day is not before", () => {
  assert.equal(isBeforeRiyadhToday("2026-07-18T01:00:00Z", "2026-07-18T20:00:00Z"), false);
});

check("formatDue: overdue count uses Riyadh days, not raw ms/24h", () => {
  // Due 2026-07-04T22:00Z = 2026-07-05 Riyadh. Now 2026-07-18T21:01Z = 2026-07-19 Riyadh.
  // Riyadh-day diff = 14, even though raw hours (~23h) would floor to 13 full days.
  assert.equal(formatDue("2026-07-04T22:00:00Z", "en", "2026-07-18T21:01:00Z"), "5 Jul 2026 · 14 days overdue");
});
check("formatDue: due today reads 'due today', not '0 days overdue'", () => {
  assert.equal(formatDue("2026-07-18T05:00:00Z", "en", "2026-07-18T20:00:00Z"), "18 Jul 2026 · due today");
});
check("formatDue: future date reads 'due in N days'", () => {
  assert.equal(formatDue("2026-07-21T05:00:00Z", "en", "2026-07-18T20:00:00Z"), "21 Jul 2026 · due in 3 days");
});

check("formatDateRange en uses explicit From/To", () => {
  assert.equal(formatDateRange("2026-07-01T00:00:00Z", "2026-07-18T00:00:00Z", "en"), "From 1 Jul 2026 to 18 Jul 2026");
});
check("formatDateRange ar uses من/إلى", () => {
  assert.equal(formatDateRange("2026-07-01T00:00:00Z", "2026-07-18T00:00:00Z", "ar").startsWith("من "), true);
});

check("formatTime renders Riyadh-local HH:MM for a same-day window end", () => {
  assert.equal(formatTime("2026-07-18T08:40:00Z", "en"), "11:40");
});

check("formatDateTime includes the Riyadh label", () => {
  assert.equal(formatDateTime("2026-07-18T08:40:00Z", "en").endsWith("(Riyadh)"), true);
});

check("formatRelative: sub-minute reads 'just now'", () => {
  assert.equal(formatRelative("2026-07-18T20:00:20Z", "en", "2026-07-18T20:00:40Z"), "just now");
});
check("formatRelative: beyond 24h falls back to formatDate", () => {
  assert.equal(formatRelative("2026-07-15T20:00:00Z", "en", "2026-07-18T20:00:00Z"), formatDate("2026-07-15T20:00:00Z", "en"));
});

console.log(`\n${passed} check(s) passed${process.exitCode ? ", failures above" : "."}`);
