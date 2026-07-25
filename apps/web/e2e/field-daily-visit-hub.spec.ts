import { expect, test } from "@playwright/test";
import { buildDailyVisitHub, type DailyVisit, visitDestination } from "../src/lib/field/daily-visit-hub";

const visit = (overrides: Partial<DailyVisit> = {}): DailyVisit => ({
  id: "visit-1",
  planning_status: "published",
  operational_state: "new",
  execution_mode: "physical",
  visit_type: "routine",
  window_start: "2026-07-25T06:00:00.000Z",
  window_end: "2026-07-25T08:00:00.000Z",
  factory_id: "factory-1",
  package_version_id: "package-1",
  factories: { id: "factory-1", name: "Factory", factory_code: "F-1", region: "Riyadh", city: "Riyadh" },
  inspections: null,
  ...overrides,
});

test.describe("SCR-IPAD-600 daily visit hub model", () => {
  const now = new Date("2026-07-25T09:00:00.000Z");

  test("scopes today in Riyadh and selects the earliest incomplete visit", () => {
    const hub = buildDailyVisitHub([
      visit({ id: "later", window_start: "2026-07-25T10:00:00.000Z" }),
      visit({ id: "earlier", window_start: "2026-07-25T06:00:00.000Z" }),
      visit({ id: "tomorrow", window_start: "2026-07-25T22:00:00.000Z" }),
      visit({ id: "other-state", planning_status: "draft" }),
    ], now);
    expect(hub.today.map((item) => item.id)).toEqual(["earlier", "later"]);
    expect(hub.nextVisit?.id).toBe("earlier");
  });

  test("routes canonical preparation, travel and workspace states", () => {
    expect(visitDestination(visit())).toBe("/field/visit-1");
    expect(visitDestination(visit({ operational_state: "on_the_way" }))).toBe("/field/visit-1/travel");
    expect(visitDestination(visit({ operational_state: "arrived" }))).toBe("/field/visit-1/travel");
    expect(visitDestination(visit({ operational_state: "executing", inspections: { id: "inspection-1", status: "in_progress", started_at: null, submitted_at: null, reviews: [] } }))).toBe("/field/inspection/inspection-1");
  });

  test("counts attention once and exposes an honest resumable inspection", () => {
    const active = visit({
      inspections: { id: "inspection-1", status: "returned", started_at: "2026-07-25T06:30:00Z", submitted_at: null, reviews: [{ returned_sections: ["s1"] }] },
    });
    const hub = buildDailyVisitHub([active], now);
    expect(hub.attentionCount).toBe(1);
    expect(hub.resumable?.id).toBe("visit-1");
  });

  test("expired assigned work contributes to attention but never becomes next visit", () => {
    const expired = visit({ id: "expired", planning_status: "expired" });
    const hub = buildDailyVisitHub([expired], now);
    expect(hub.attentionCount).toBe(1);
    expect(hub.nextVisit).toBeNull();
  });

  test("completed-today requires a submitted fact or submitted operational state", () => {
    const done = visit({
      operational_state: "submitted",
      inspections: { id: "inspection-1", status: "submitted", started_at: null, submitted_at: "2026-07-25T08:00:00Z", reviews: [] },
    });
    const hub = buildDailyVisitHub([done, visit({ id: "open" })], now);
    expect(hub.completedToday.map((item) => item.id)).toEqual(["visit-1"]);
    expect(hub.incompleteToday.map((item) => item.id)).toEqual(["open"]);
  });
});
