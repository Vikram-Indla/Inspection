import { test, expect } from "@playwright/test";
import { filterVisits, regionalCoverage, withinWindow } from "../src/app/(app)/visits/map/coverage-filters";
import type { MappedVisit } from "../src/app/(app)/visits/map/VisitMap";

// INSP-697 — Coverage Filters / Unassigned Visits / Regional Summary pure
// logic, extracted from CoveragePanel.tsx (Figma SCR-PLN-200, node 433:49148,
// /planning/map only). Pure-function suite: no DOM, no auth, no live backend.
const NOW = new Date("2026-08-02T00:00:00.000Z").getTime();

function visit(overrides: Partial<MappedVisit>): MappedVisit {
  return {
    id: "v1", factoryId: "f1", factoryName: "Al Rasheed Steel Works",
    region: "Riyadh", city: "Riyadh", factoryLat: 24.7, factoryLng: 46.6,
    inspectorName: "", inspectorLat: null, inspectorLng: null, inspectorAt: null,
    operationalState: "not_started", riskBand: "high",
    windowStart: "2026-08-05T09:00:00.000Z", windowEnd: "2026-08-05T11:00:00.000Z",
    ...overrides,
  };
}

test.describe("INSP-697 Coverage Filters — pure logic contract", () => {
  test("withinWindow: null days means every visit passes", () => {
    expect(withinWindow(null, null, NOW)).toBe(true);
    expect(withinWindow(undefined, null, NOW)).toBe(true);
  });

  test("withinWindow: a visit with no window_start fails any bounded window", () => {
    expect(withinWindow(null, 30, NOW)).toBe(false);
  });

  test("withinWindow: 30-day window includes a visit 5 days out, excludes one 40 days out", () => {
    expect(withinWindow(new Date(NOW + 5 * 86400000).toISOString(), 30, NOW)).toBe(true);
    expect(withinWindow(new Date(NOW + 40 * 86400000).toISOString(), 30, NOW)).toBe(false);
  });

  test("filterVisits: region, risk band, and inspector-status filters compose (AND)", () => {
    const visits = [
      visit({ id: "a", region: "Riyadh", riskBand: "high", inspectorName: "" }),
      visit({ id: "b", region: "Riyadh", riskBand: "low", inspectorName: "" }),
      visit({ id: "c", region: "Jeddah", riskBand: "high", inspectorName: "K. Al-Otaibi" }),
    ];
    const result = filterVisits(visits, { region: "Riyadh", risk: "high", windowDays: null, inspectorFilter: "unassigned" }, NOW);
    expect(result.map(v => v.id)).toEqual(["a"]);
  });

  test("filterVisits: inspectorFilter=assigned keeps only visits with a named inspector", () => {
    const visits = [
      visit({ id: "a", inspectorName: "" }),
      visit({ id: "b", inspectorName: "N. Al-Harbi" }),
    ];
    expect(filterVisits(visits, { region: "", risk: "", windowDays: null, inspectorFilter: "assigned" }, NOW).map(v => v.id)).toEqual(["b"]);
  });

  test("regionalCoverage: counts per region, sorted descending, blank region excluded", () => {
    const visits = [
      visit({ id: "a", region: "Riyadh" }), visit({ id: "b", region: "Riyadh" }),
      visit({ id: "c", region: "Jeddah" }), visit({ id: "d", region: "" }),
    ];
    expect(regionalCoverage(visits)).toEqual([["Riyadh", 2], ["Jeddah", 1]]);
  });
});
