import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { firstBlocker, prefersReducedMotion, type BlockerGroup } from "../src/components/field/a11y";

// SCR-IPAD Accessibility, RTL & Interaction Hardening — behavioral coverage for
// the reusable helpers plus static assertions that the cross-journey toolkit and
// its wiring carry the required a11y patterns. No browser/backend.

const webRoot = path.resolve(__dirname, "..");
const read = (f: string) => fs.readFileSync(path.join(webRoot, f), "utf8");

const css = "src/components/field/field-a11y.module.css";
const liveRegion = "src/components/field/LiveRegion.tsx";
const workspace = "src/app/(app)/field/inspection/[id]/Workspace.tsx";
const myTasks = "src/components/sections/field-my-tasks/my-tasks-screen.tsx";

test.describe("SCR-IPAD a11y — blocker navigation helper (jump to first)", () => {
  const g = (over: Partial<BlockerGroup> & { key: string }): BlockerGroup =>
    ({ title: over.key, unanswered: [], evidence: [], forms: [], ...over });

  test("returns the first blocking item in reading order (unanswered → evidence → forms)", () => {
    expect(firstBlocker([g({ key: "s1", unanswered: ["Q-01", "Q-02"] })])).toEqual({ sectionKey: "s1", code: "Q-01" });
    expect(firstBlocker([g({ key: "s1", evidence: ["Q-05"] })])).toEqual({ sectionKey: "s1", code: "Q-05" });
    expect(firstBlocker([g({ key: "s1", forms: ["Q-09"] })])).toEqual({ sectionKey: "s1", code: "Q-09" });
  });

  test("skips groups with nothing blocking and picks the first that does", () => {
    expect(firstBlocker([g({ key: "s1" }), g({ key: "s2", forms: ["Q-09"] })])).toEqual({ sectionKey: "s2", code: "Q-09" });
  });

  test("returns null when nothing blocks", () => {
    expect(firstBlocker([])).toBeNull();
    expect(firstBlocker([g({ key: "s1" })])).toBeNull();
  });
});

test.describe("SCR-IPAD a11y — reduced motion default", () => {
  test("prefersReducedMotion is false when matchMedia is unavailable (SSR-safe)", () => {
    // Node has no window.matchMedia → the helper defaults to motion-allowed
    // rather than throwing, so callers can safely branch on it.
    expect(prefersReducedMotion()).toBe(false);
  });
});

test.describe("SCR-IPAD a11y — toolkit carries the required patterns", () => {
  test("the a11y stylesheet covers reduced-motion, coarse-pointer targets, focus-visible, RTL flip and safe-area", () => {
    const c = read(css);
    expect(c).toContain("@media (prefers-reduced-motion: reduce)");
    expect(c).toContain("@media (pointer: coarse)");
    expect(c).toContain("min-block-size: 44px");
    expect(c).toContain(":focus-visible");
    expect(c).toContain('[dir="rtl"]');
    expect(c).toContain("[data-directional]");
    expect(c).toContain("scaleX(-1)");
    expect(c).toContain("env(safe-area-inset-bottom)");
    // Tokens only — no bare colors in the a11y layer.
    expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(c).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
  });

  test("LiveRegion announces politely and atomically", () => {
    const l = read(liveRegion);
    expect(l).toContain('aria-live={assertive ? "assertive" : "polite"}');
    expect(l).toContain('aria-atomic="true"');
    expect(l).toContain('role="status"');
  });
});

test.describe("SCR-IPAD a11y — cross-journey wiring", () => {
  test("the inspection workspace mounts the scope, announces status, focuses blockers and offers jump navigation", () => {
    const w = read(workspace);
    expect(w).toContain("a11y.scope");
    expect(w).toContain("<LiveRegion message={msg}");
    expect(w).toMatch(/role="alert"[\s\S]*tabIndex=\{-1\}[\s\S]*ref=\{validationRef\}/);
    expect(w).toContain("focusAndScrollTo(`sq-section-");
    expect(w).toContain("firstBlocker(validation)");
  });

  test("a second journey (my-tasks) opts into the same reusable scope", () => {
    expect(read(myTasks)).toContain("a11y.scope");
  });
});
