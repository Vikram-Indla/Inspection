import { test, expect } from "@playwright/test";
import {
  canActivateSla, computeDueAt, isSlaTransitionAllowed, slaStatusAt, evaluatePause, evaluateResume,
  type SlaCalendar,
} from "../src/lib/workflow/sla";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0033 · DEC-003-honest. Self-authored, pure.

// A fully-specified Mon–Fri 09:00–17:00 calendar SUPPLIED by the test (governed
// input). Production supplies a DEC-003-authorized calendar; nothing is defaulted.
const cal: SlaCalendar = {
  timezone: "Asia/Riyadh", workingDays: [1, 2, 3, 4, 5],
  workingStartMinutes: 9 * 60, workingEndMinutes: 17 * 60, holidays: [], activationAuthorized: true,
};

test("mvp2-m2-02 0033 DEC-003: activation blocked without an authorized/complete calendar", () => {
  expect(canActivateSla(null, 60).activatable).toBe(false);
  expect(canActivateSla({ ...cal, activationAuthorized: false }, 60).activatable).toBe(false);
  expect(canActivateSla({ ...cal, workingDays: null }, 60).activatable).toBe(false);
  expect(canActivateSla(cal, null).activatable).toBe(false);   // no governed duration
  expect(canActivateSla(cal, 60).activatable).toBe(true);      // all governed inputs present
});

test("mvp2-m2-02 0033 due date computed only from supplied working calendar", () => {
  // Monday 2026-07-13 10:00Z + 60 working minutes = 11:00Z same day.
  expect(computeDueAt("2026-07-13T10:00:00.000Z", 60, cal)).toBe("2026-07-13T11:00:00.000Z");
});

test("mvp2-m2-02 0033 due date rolls to the next working day when the window is exhausted", () => {
  // Monday 16:30Z + 60 min: 30 min today (→17:00), 30 min carry to Tue 09:00 → 09:30Z.
  expect(computeDueAt("2026-07-13T16:30:00.000Z", 60, cal)).toBe("2026-07-14T09:30:00.000Z");
});

test("mvp2-m2-02 0033 holidays are skipped in due computation", () => {
  const withHoliday: SlaCalendar = { ...cal, holidays: ["2026-07-14"] };
  // Same as above but Tue is a holiday → carry to Wed 09:30Z.
  expect(computeDueAt("2026-07-13T16:30:00.000Z", 60, withHoliday)).toBe("2026-07-15T09:30:00.000Z");
});

test("mvp2-m2-02 0033 computeDueAt returns null on an incomplete calendar (no fabrication)", () => {
  expect(computeDueAt("2026-07-13T10:00:00.000Z", 60, { ...cal, workingStartMinutes: null })).toBeNull();
});

test("mvp2-m2-02 0033 timer state machine", () => {
  expect(isSlaTransitionAllowed("pending_activation", "running")).toBe(true);
  expect(isSlaTransitionAllowed("running", "paused")).toBe(true);
  expect(isSlaTransitionAllowed("paused", "running")).toBe(true);
  expect(isSlaTransitionAllowed("running", "breached")).toBe(true);
  expect(isSlaTransitionAllowed("pending_activation", "breached")).toBe(false);
  expect(isSlaTransitionAllowed("met", "running")).toBe(false);
});

test("mvp2-m2-02 0033 slaStatusAt is a derived read (no scheduler, no fabrication)", () => {
  const t = { status: "running" as const, dueAt: "2026-07-13T17:00:00.000Z", warnAt: "2026-07-13T16:00:00.000Z", breachAt: "2026-07-13T17:00:00.000Z" };
  expect(slaStatusAt("2026-07-13T12:00:00.000Z", t)).toBe("running");
  expect(slaStatusAt("2026-07-13T16:30:00.000Z", t)).toBe("warning");
  expect(slaStatusAt("2026-07-13T17:30:00.000Z", t)).toBe("breach");
  // pending when not yet activated (no due date)
  expect(slaStatusAt("2026-07-13T12:00:00.000Z", { status: "pending_activation", dueAt: null })).toBe("pending");
});

test("mvp2-m2-02 0033 pause requires running+reason; resume requires paused", () => {
  expect(evaluatePause("running", "site closed").ok).toBe(true);
  expect(evaluatePause("running", "").ok).toBe(false);
  expect(evaluatePause("paused", "x").ok).toBe(false);
  expect(evaluateResume("paused").ok).toBe(true);
  expect(evaluateResume("running").ok).toBe(false);
});
