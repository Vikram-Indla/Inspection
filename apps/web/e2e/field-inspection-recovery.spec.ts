import { expect, test } from "@playwright/test";
import {
  detectServerAdvance, sectionKeyForItem, type RecoveryState,
} from "../src/app/(app)/field/inspection/[id]/recovery-runtime";
import type { Section } from "../src/app/(app)/field/inspection/[id]/runtime";

// SCR-IPAD — behavioral coverage for Inspector Offline Conflict & Recovery.
// Pure logic, no browser/backend: proves the stale submitted-version detection
// (fail-closed, immutable-version protection) and the conflict→section
// navigation mapping the workspace relies on.

const adv = (loaded: [string, number], server: [string, number]): RecoveryState =>
  detectServerAdvance({ status: loaded[0], version: loaded[1] }, { status: server[0], version: server[1] });

test.describe("SCR-IPAD recovery — stale submitted-version detection", () => {
  test("server reaching a locked state the device did not start in → advanced", () => {
    expect(adv(["in_progress", 0], ["submitted", 0])).toBe("advanced");
    expect(adv(["in_progress", 0], ["under_review", 0])).toBe("advanced");
    expect(adv(["in_progress", 0], ["approved", 1])).toBe("advanced");
    expect(adv(["in_progress", 0], ["rejected", 1])).toBe("advanced");
  });

  test("a newer submission version than the device knew → advanced (immutable-version protection)", () => {
    expect(adv(["in_progress", 0], ["in_progress", 1])).toBe("advanced");
    expect(adv(["returned", 1], ["returned", 2])).toBe("advanced");
  });

  test("server returned for correction while device holds a pre-return copy → returned", () => {
    expect(adv(["in_progress", 0], ["returned", 0])).toBe("returned");
  });

  test("no advance when the device copy is still current", () => {
    expect(adv(["in_progress", 0], ["in_progress", 0])).toBe("none");
    expect(adv(["returned", 1], ["returned", 1])).toBe("none");
    // Device already in the locked state (e.g. it loaded submitted) → not an advance.
    expect(adv(["submitted", 1], ["submitted", 1])).toBe("none");
  });

  test("locked-status advance takes priority and never yields a false 'returned'", () => {
    // A submitted server with an equal version is still an advance, not 'none'.
    expect(adv(["in_progress", 0], ["submitted", 0])).toBe("advanced");
  });
});

test.describe("SCR-IPAD recovery — conflict → affected section navigation", () => {
  const sections: Section[] = [
    { key: "sec-a", title: "A", items: ["ITEM-001", "ITEM-002"] },
    { key: "sec-b", title: "B", items: ["ITEM-003"] },
    { key: "sec-c", title: "C" },   // no items array
  ];

  test("resolves the owning section key for an item code", () => {
    expect(sectionKeyForItem(sections, "ITEM-002")).toBe("sec-a");
    expect(sectionKeyForItem(sections, "ITEM-003")).toBe("sec-b");
  });

  test("returns null for an out-of-scope code (no fabricated navigation)", () => {
    expect(sectionKeyForItem(sections, "ITEM-999")).toBeNull();
    expect(sectionKeyForItem([], "ITEM-001")).toBeNull();
  });
});
