import { test, expect } from "@playwright/test";
import { buildShellNavigation, isShellRouteCurrent } from "../src/lib/shell-navigation";
import { storageStatePath } from "./personas";

const hrefsFor = (roles: string[]) => buildShellNavigation(roles).flatMap(group => group.items.map(item => item.href));

test.describe("TASK-WEB-SHELL-001 role matrix", () => {
  test("planner sees the shared Command destinations plus governed planning/workspace", () => {
    // Dashboard + Operations Center are shared non-admin destinations (business
    // direction 2026-07-16); Factory 360 was already shared.
    expect(hrefsFor(["planner"])).toEqual(["/dashboard", "/operations", "/factories", "/planning", "/visits"]);
  });

  test("inspector sees the shared Command destinations plus field, never admin", () => {
    expect(hrefsFor(["inspector"])).toEqual(["/dashboard", "/operations", "/factories", "/field", "/virtual"]);
  });

  test("admin-family grants compose without inventing unsupported tabs", () => {
    // compliance_admin → regulations/packages/violations/items/localization/audit;
    // security_admin → access/localization/audit; risk_owner → risk/audit.
    // /admin (home) and /admin/audit are visible to every admin family.
    const hrefs = hrefsFor(["compliance_admin", "security_admin", "risk_owner"]);
    expect(hrefs).toEqual([
      "/admin",
      "/admin/regulations",
      "/admin/packages",
      "/admin/violations",
      "/admin/items",
      "/admin/risk",
      "/admin/access",
      "/admin/notifications",
      "/admin/localization",
      "/admin/audit",
    ]);
    // SCR-ADM-080 (Cycle 2) — Notification & SLA Rules is visible to every
    // admin family (adminRoles), same as /admin and /admin/audit.
    expect(hrefs).toContain("/admin/notifications");
    expect(hrefs).not.toContain("/analytics");
    expect(hrefs).not.toContain("/admin/lookups");
    expect(hrefs).not.toContain("/admin/integrations");
    // workflows (workflow_admin) and gis (gis_admin) are outside this role set.
    expect(hrefs).not.toContain("/admin/workflows");
    expect(hrefs).not.toContain("/admin/gis");
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

  test("government shell keeps notification and account controls responsive", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const account = page.locator(".ax-shell-account__trigger");
    const identity = page.locator(".ax-shell-account__identity");
    await expect(account).toBeVisible();
    await expect(identity).toBeVisible();
    await expect(page.locator(".ax-notification__trigger")).toBeVisible();

    await page.setViewportSize({ width: 930, height: 900 });
    await expect(account).toBeVisible();
    await expect(identity).toBeHidden();
    const box = await account.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(930);
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
    const theme = page.locator(".ax-pagehead__actions > button.ax-topbar-icon");
    const firstOfferedMode = await theme.getAttribute("aria-label");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "light" : "dark");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "dark" : "light");
  });
});
