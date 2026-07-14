import { test, expect } from "@playwright/test";
import { buildShellNavigation, isShellRouteCurrent } from "../src/lib/shell-navigation";
import { storageStatePath } from "./personas";

const hrefsFor = (roles: string[]) => buildShellNavigation(roles).flatMap(group => group.items.map(item => item.href));

test.describe("TASK-WEB-SHELL-001 role matrix", () => {
  test("planner sees only governed planning/workspace destinations", () => {
    expect(hrefsFor(["planner"])).toEqual(["/factories", "/planning", "/visits"]);
  });

  test("inspector sees field destinations without admin or operations control planes", () => {
    expect(hrefsFor(["inspector"])).toEqual(["/factories", "/field", "/virtual"]);
  });

  test("admin-family grants compose without inventing unsupported tabs", () => {
    const hrefs = hrefsFor(["compliance_admin", "security_admin", "risk_owner"]);
    expect(hrefs).toEqual(["/admin", "/admin/regulations", "/admin/packages", "/admin/violations", "/admin/risk", "/admin/access"]);
    expect(hrefs).not.toContain("/analytics");
    expect(hrefs).not.toContain("/admin/lookups");
    expect(hrefs).not.toContain("/admin/integrations");
    expect(hrefs).not.toContain("/admin/notifications");
  });

  test("dashboard and live operations have distinct active states", () => {
    expect(isShellRouteCurrent("/dashboard", "/dashboard")).toBe(true);
    expect(isShellRouteCurrent("/operations", "/dashboard")).toBe(false);
    expect(isShellRouteCurrent("/operations", "/operations")).toBe(true);
    expect(isShellRouteCurrent("/operations/live", "/operations")).toBe(true);
  });

  test("operations and leadership receive the dashboard plus operations center without admin leakage", () => {
    expect(hrefsFor(["ops"])).toEqual(["/dashboard", "/operations", "/factories", "/visits"]);
    expect(hrefsFor(["leadership"])).toEqual(["/dashboard", "/operations", "/factories"]);
  });
});

test.describe("TASK-WEB-SHELL-001 responsive and language behavior", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("desktop navigation collapses without exposing another persona's tabs", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav.getByRole("link", { name: "Planning" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Factory 360" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Review & Approval" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Approval & Configuration" })).toHaveCount(0);

    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-collapsed/);
    await expect(nav.getByRole("link", { name: "Planning" })).toBeVisible();
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await expect(page.locator(".ax-shell")).not.toHaveClass(/is-collapsed/);
  });

  test("mobile drawer opens, traps the shell interaction and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-drawer-open/);
    await expect(page.locator(".ax-shell__close")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ax-shell")).not.toHaveClass(/is-drawer-open/);
    await expect(menu).toBeFocused();
  });

  test("Arabic applies document RTL and both visual themes remain operable", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("nav.ax-shell__nav")).toHaveAttribute("aria-label", /[\u0600-\u06FF]/);
    const theme = page.locator("button.ax-topbar-icon").filter({ has: page.locator("svg") }).first();
    const firstOfferedMode = await theme.getAttribute("aria-label");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "light" : "dark");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "dark" : "light");
  });
});
