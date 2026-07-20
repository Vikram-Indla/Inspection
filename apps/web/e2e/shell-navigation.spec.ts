import { test, expect } from "@playwright/test";
import { buildShellNavigation, isShellRouteCurrent, shellScopeForRoute } from "../src/lib/shell-navigation";
import { storageStatePath } from "./personas";

const itemsFor = (roles: string[]) => buildShellNavigation(roles).flatMap(group => group.items);
const enabledHrefsFor = (roles: string[]) => itemsFor(roles).filter(item => item.enabled).map(item => item.href);

test.describe("TASK-WEB-COMPLIANCE-SHARED-SHELL-001 role matrix", () => {
  const businessHrefs = ["/dashboard", "/operations", "/factories", "/planning", "/field", "/reviews", "/admin/regulations", "/admin", "/admin/violations", "/ai/suggestions"];

  test("every non-admin persona receives the same enabled business catalogue and seven locked admin entries", () => {
    for (const role of ["planner", "inspector", "reviewer", "ops", "leadership"]) {
      const groups = buildShellNavigation([role]);
      expect(groups.map(group => group.id)).toEqual(["overview", "operations", "compliance", "insights", "administration"]);
      expect(enabledHrefsFor([role])).toEqual(businessHrefs);
      const adminItems = groups.find(group => group.id === "administration")!.items;
      expect(adminItems).toHaveLength(7);
      expect(adminItems.every(item => !item.enabled && item.disabledReasonEn === "Administrator access required.")).toBe(true);
    }
  });

  test("admin primary and advanced options compose from existing role families", () => {
    const security = itemsFor(["security_admin"]);
    expect(security.find(item => item.id === "users")?.enabled).toBe(true);
    expect(security.find(item => item.id === "roles")?.enabled).toBe(true);
    expect(security.find(item => item.id === "risk")?.enabled).toBe(false);
    expect(security.find(item => item.id === "surveys")?.enabled).toBe(false);
    expect(security.find(item => item.id === "devices")?.enabled).toBe(true);
    expect(security.find(item => item.id === "gis")).toBeUndefined();

    const composed = itemsFor(["compliance_admin", "form_admin", "workflow_admin", "security_admin", "gis_admin", "risk_owner"]);
    expect(composed.filter(item => item.visibility === "admin-primary").every(item => item.enabled)).toBe(true);
    expect(composed.filter(item => item.visibility === "admin-advanced").map(item => item.id)).toEqual([
      "workflows", "gis", "audit", "platform-operations", "security-access", "devices", "enforcement-cases",
    ]);
  });

  test("dashboard and live operations have distinct active states", () => {
    expect(isShellRouteCurrent("/dashboard", "/dashboard")).toBe(true);
    expect(isShellRouteCurrent("/operations", "/dashboard")).toBe(false);
    expect(isShellRouteCurrent("/operations", "/operations")).toBe(true);
    expect(isShellRouteCurrent("/operations/live", "/operations")).toBe(true);
  });

  test("scope consumers are explicit and non-consuming pages stay disabled", () => {
    expect(shellScopeForRoute("/dashboard")).toEqual({ date: true, region: true });
    expect(shellScopeForRoute("/operations")).toEqual({ date: false, region: true });
    expect(shellScopeForRoute("/planning")).toEqual({ date: false, region: false });
  });
});

test.describe("TASK-WEB-SHELL-001 responsive and language behavior", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("desktop navigation collapses with unified business and accessible locked admin options", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav.getByRole("link", { name: "Planning" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Factory 360" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Review & Approval" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Inspection Rules" })).toBeVisible();
    await expect(nav.locator('[data-nav-state="disabled"]')).toHaveCount(7);
    await expect(nav.getByRole("link", { name: /Users.*Administrator access required/ })).toHaveAttribute("aria-disabled", "true");
    await expect(nav.getByRole("link", { name: /Users.*Administrator access required/ })).not.toHaveAttribute("href");

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
