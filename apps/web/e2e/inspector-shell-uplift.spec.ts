import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildShellNavigation } from "../src/lib/shell-navigation";

// TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002
// SPONSOR-UIU-001..024 · UIU-ISP-AC-001..024
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("Inspector shell foundation and sponsor-corrected shared business navigation", () => {
  test("UIU-ISP-AC-001..006 collapse preference remains while the shared catalogue governs navigation", () => {
    const toggle = read("src/components/app-shell/shell-rail/shell-rail-toggle.tsx");
    const nav = buildShellNavigation(["inspector"]);
    expect(toggle).toContain('const STORAGE_KEY = "saqeel-shell-collapsed"');
    expect(toggle).toContain("useState(false)");
    expect(toggle).toContain('localStorage.getItem(STORAGE_KEY) === "1"');
    expect(toggle).toContain('localStorage.setItem(STORAGE_KEY, next ? "1" : "0")');
    expect(nav.map(group => group.id)).toEqual([
      "overview", "operations", "compliance", "insights", "administration",
    ]);
    expect(nav.flatMap(group => group.items).find(item => item.href === "/execution")).toMatchObject({
      labelEn: "Execution", labelAr: "التنفيذ", enabled: true,
    });
    expect(nav.find(group => group.id === "administration")?.items.every(item => item.enabled)).toBe(true);
  });

  test("UIU-ISP-AC-007..011 field task bar is labelled, restrained and touch sized", () => {
    const tabs = read("src/components/FieldTabs.tsx");
    const css = read("src/app/saqeel-runtime.css");
    expect(tabs).toContain('className="sq-field-taskbar"');
    expect(tabs).toContain('href="/field/my-tasks"');
    expect(tabs).toContain('href="/field/establishments"');
    expect(tabs).toContain('href="/field/notifications"');
    expect(tabs).toContain('href="/field/account"');
    expect(tabs).not.toContain("Raised center FAB");
    expect(tabs).not.toContain('href="/signout"');
    expect(tabs).not.toContain("sq-radius-full");
    expect(css).toContain("min-block-size: var(--control-h-field)");
    expect(css).toContain("border-block-start: 1px solid var(--border-subtle)");
    expect(css).toContain("padding-block-end: 104px");
    expect(css).not.toContain(".sq-field-taskbar__primary { border-radius: var(--radius-full)");
  });

  test("UIU-ISP-AC-012..013 active assignments precede pending attention and analytics", () => {
    const page = read("src/components/sections/field-home/field-home-screen.tsx");
    const mapIndex = page.indexOf("<FieldOperationsMap");
    const scheduleIndex = page.indexOf("<FieldSchedule");
    const pendingIndex = page.indexOf("<FieldPendingAttention");
    const insightIndex = page.indexOf("<FieldInsightStrip");
    expect(mapIndex).toBeGreaterThan(-1);
    expect(scheduleIndex).toBeGreaterThan(mapIndex);
    expect(pendingIndex).toBeGreaterThan(scheduleIndex);
    expect(insightIndex).toBeGreaterThan(pendingIndex);
    expect(page).not.toContain("SCR-IPAD-600 · assigned-only");
  });

  test("UIU-ISP-AC-014..020 preserves theme, RTL, status, input and Atlas boundaries", () => {
    const tabs = read("src/components/FieldTabs.tsx");
    const css = read("src/app/saqeel-runtime.css");
    const tokens = read("src/app/tokens.css");
    const login = read("src/app/login/login.css");
    expect(tabs).toContain('aria-current={active === "home" ? "page" : undefined}');
    expect(tabs).toContain('aria-current={active === "account" ? "page" : undefined}');
    expect(css).toContain("inset-inline: 0");
    expect(css).toContain("var(--focus-ring)");
    expect(tokens).toContain("--radius-sm: 6px"); // supplied Revamp radius, direct semantic token
    expect(tokens).toContain("--type-input: 400 14px/1.5 var(--font-body)"); // input font, direct token
    expect(login).toContain("lg-atlas");
  });

  test("UIU-ISP-AC-021..024 production compliance claims remain explicit release gates", () => {
    const master = read("../../design/claude-design-mvp1/ui-revamp-uplift/UI_REVAMP_UPLIFT_MASTER.md");
    expect(master).toContain("Mandatory release gates");
    expect(master).toContain("WCAG 2.2 AA verification");
    expect(master).toContain("DGA/Platforms Code");
    expect(master).toContain("native linguistic review");
    expect(master).toContain("observed morning and night sessions");
    expect(master).toContain("production compliance certification pending");
  });
});
