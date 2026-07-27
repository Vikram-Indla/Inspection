import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildShellNavigation } from "../src/lib/shell-navigation";

// TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002
// SPONSOR-UIU-001..024 · UIU-ISP-AC-001..024
const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test.describe("Inspector shell foundation and sponsor-corrected shared business navigation", () => {
  test("UIU-ISP-AC-001..006 collapse preference remains while Prompt 01 governs shared navigation", () => {
    const shell = read("src/components/ShellClient.tsx");
    const nav = buildShellNavigation(["inspector"]);
    expect(shell).toContain("useState(false)");
    expect(shell).toContain('localStorage.getItem("saqeel-shell-collapsed") === "1"');
    expect(shell).toContain('localStorage.setItem("saqeel-shell-collapsed", next ? "1" : "0")');
    // TASK-WEB-CHANNEL-ACCESS-GATE-001 (change-control): the Inspector is an
    // iPad-channel persona (rbac_matrix.csv RBAC-009/010), redirected off the
    // web portal. The shared shell now exposes only the field channel to it —
    // just Execution, and no Administration group (not even locked).
    expect(nav.map(group => group.id)).toEqual(["operations"]);
    expect(nav.find(group => group.id === "operations")?.items).toEqual([
      expect.objectContaining({ href: "/field", labelEn: "Execution", labelAr: "التنفيذ", enabled: true }),
    ]);
    expect(nav.find(group => group.id === "administration")).toBeUndefined();
  });

  test("UIU-ISP-AC-007..011 field task bar is labelled, restrained and touch sized", () => {
    const tabs = read("src/components/FieldTabs.tsx");
    const css = read("src/app/saqeel-components-legacy.css");
    expect(tabs).toContain('className="sq-field-taskbar__primary"');
    expect(tabs).toContain("{labels.fab}");
    expect(tabs).not.toContain("Raised center FAB");
    expect(tabs).not.toContain('href="/signout"');
    expect(tabs).not.toContain("sq-radius-full");
    expect(css).toContain("min-block-size: var(--control-h-field)");
    expect(css).toContain("border-block-start: 1px solid var(--border-subtle)");
    expect(css).toContain("padding-block-end: 104px");
    expect(css).not.toContain(".sq-field-taskbar__primary { border-radius: var(--radius-full)");
  });

  test("UIU-ISP-AC-012..013 active assignments precede notifications and analytics", () => {
    const page = read("src/app/(app)/field/page.tsx");
    const home = read("src/components/field/FieldHome.tsx");
    expect(page.indexOf("<FieldHome")).toBeGreaterThan(-1);
    expect(page.indexOf("<FieldHome")).toBeLessThan(page.indexOf('<details className="sq-field-performance">'));
    expect(page).toContain('title={t("field.assignments.title", "My assignments")}');
    expect(page).not.toContain("SCR-IPAD-600 · assigned-only");
    expect(home.indexOf('<section id="visits"')).toBeLessThan(home.indexOf("M03-001 — inspector inbox remains available"));
  });

  test("UIU-ISP-AC-014..020 preserves theme, RTL, status, input and Atlas boundaries", () => {
    const tabs = read("src/components/FieldTabs.tsx");
    const css = read("src/app/saqeel-components-legacy.css");
    const tokens = read("src/app/tokens.css");
    const login = read("src/app/login/login.css");
    expect(tabs).toContain('aria-current={active === "dashboard" ? "page" : undefined}');
    expect(tabs).toContain("<Icon d={GLYPHS.next} />");
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
