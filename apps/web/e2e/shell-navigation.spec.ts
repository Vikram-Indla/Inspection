import { test, expect } from "@playwright/test";
import { buildShellNavigation, isShellRouteCurrent, shellScopeForRoute, isFieldOnlyPersona, SHELL_NAVIGATION } from "../src/lib/shell-navigation";
import { homeForRoles } from "../src/lib/role-home";
import { storageStatePath } from "./personas";

const itemsFor = (roles: string[]) => buildShellNavigation(roles).flatMap(group => group.items);
const enabledHrefsFor = (roles: string[]) => itemsFor(roles).filter(item => item.enabled).map(item => item.href);
// The shared business catalogue = the "business"-visibility destinations, which
// every web persona receives identically. (Enabled-href equality is not a valid
// cross-persona check: advanced admin items such as ops enforcement tools are
// role-specific additions on top of this shared set.)
const businessHrefsFor = (roles: string[]) =>
  itemsFor(roles).filter(item => item.visibility === "business" && item.enabled).map(item => item.href);
const enabledBusinessHrefs = ["/dashboard", "/operations", "/factories", "/planning", "/visits", "/reviews", "/admin/regulations", "/admin/compliance-approvals", "/enforcement"];

test.describe("TASK-WEB-COMPLIANCE-SHARED-SHELL-001 role matrix", () => {
  // TASK-WEB-CHANNEL-ACCESS-GATE-001 (change-control of CMP-REQ-SHELL-001..003):
  // the identical-shell contract is scoped to WEB-channel business personas.
  // The Inspector is an iPad-channel persona (rbac_matrix.csv RBAC-009/010) and
  // is redirected off the web portal, so it no longer receives the web nav or a
  // locked Administration group. See the "field channel" describe block below.
  test("every WEB business persona receives the fixed catalogue and six locked Administration hubs", () => {
    for (const role of ["planner", "reviewer", "ops", "leadership"]) {
      const groups = buildShellNavigation([role]);
      expect(groups.map(group => group.id)).toEqual(["overview", "operations", "compliance", "insights", "administration"]);
      expect(businessHrefsFor([role])).toEqual(enabledBusinessHrefs);
      const adminItems = groups.find(group => group.id === "administration")!.items;
      expect(adminItems.filter(item => item.visibility === "admin-primary")).toHaveLength(6);
      expect(adminItems.filter(item => item.visibility === "admin-primary").every(item => !item.enabled && item.disabledReasonEn === "Administrator access required.")).toBe(true);
    }
  });

  test("Administration exposes only the six governed hubs and composes from existing role families", () => {
    expect(SHELL_NAVIGATION.find(group => group.id === "administration")?.items.map(item => [item.labelEn, item.href])).toEqual([
      ["Users & Roles", "/admin/access"],
      ["Lookup Management", "/admin/planning/lookups"],
      ["Risk Configuration", "/admin/risk"],
      ["Survey Configuration", "/admin/items"],
      ["Notification Configuration", "/admin/notifications"],
      ["Integration Management", "/admin/integrations"],
    ]);
    const security = itemsFor(["security_admin"]);
    expect(security.find(item => item.id === "users-roles")?.enabled).toBe(true);
    expect(security.find(item => item.id === "lookup-management")?.enabled).toBe(true);
    expect(security.find(item => item.id === "risk-configuration")?.enabled).toBe(false);
    expect(security.find(item => item.id === "survey-configuration")?.enabled).toBe(false);
    expect(security.find(item => item.id === "integration-management")?.enabled).toBe(true);

    const composed = itemsFor(["compliance_admin", "form_admin", "workflow_admin", "security_admin", "gis_admin", "risk_owner"]);
    expect(composed.filter(item => item.visibility === "admin-primary").every(item => item.enabled)).toBe(true);
    expect(composed.filter(item => item.visibility === "admin-advanced")).toEqual([]);
  });

  test("authority targets remain explicit while unfinished cutovers fail honestly", () => {
    const definitions = SHELL_NAVIGATION.flatMap(group => group.items);
    expect(definitions.find(item => item.id === "inspection-execution")?.href).toBe("/planning/visits?view=execution");
    expect(definitions.find(item => item.id === "analytics")?.href).toBe("/dashboard?view=analytics");
    const planner = itemsFor(["planner"]);
    expect(planner.find(item => item.id === "inspection-execution")).toMatchObject({ href: "/visits", enabled: true });
    expect(planner.find(item => item.id === "analytics")).toMatchObject({
      href: "/dashboard?view=analytics",
      enabled: false,
      disabledReasonEn: "Analytics is awaiting its approved module wiring.",
    });
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

test.describe("TASK-WEB-CHANNEL-ACCESS-GATE-001 field channel (rbac_matrix.csv RBAC-009/010)", () => {
  test("a field-only Inspector sees only the field channel — no web catalogue, no admin group", () => {
    const groups = buildShellNavigation(["inspector"]);
    // Only groups that still carry a field-channel destination survive.
    expect(groups.map(group => group.id)).toEqual(["operations"]);
    expect(enabledHrefsFor(["inspector"])).toEqual(["/field"]);
    // The Administration group is dropped entirely — not even a locked entry.
    expect(groups.find(group => group.id === "administration")).toBeUndefined();
    // No web-portal destinations leak into the shared chrome.
    const hrefs = itemsFor(["inspector"]).map(item => item.href);
    for (const web of ["/dashboard", "/operations", "/factories", "/planning", "/reviews", "/admin/regulations", "/admin", "/ai/suggestions"]) {
      expect(hrefs).not.toContain(web);
    }
  });

  test("an operational grant wins: a multi-role Inspector+Planner keeps the full web catalogue", () => {
    expect(isFieldOnlyPersona(["inspector", "planner"])).toBe(false);
    expect(businessHrefsFor(["inspector", "planner"])).toEqual(enabledBusinessHrefs);
    expect(buildShellNavigation(["inspector", "planner"]).find(group => group.id === "administration")).toBeDefined();
  });

  test("field-only detection is precise and never locks out web or no-role sessions", () => {
    expect(isFieldOnlyPersona(["inspector"])).toBe(true);
    expect(isFieldOnlyPersona(["planner"])).toBe(false);
    expect(isFieldOnlyPersona(["security_admin"])).toBe(false);
    expect(isFieldOnlyPersona([])).toBe(false); // no roles → not field-only → gate must not redirect
  });

  test("the Inspector field home matches the channel-gate redirect target", () => {
    expect(homeForRoles(["inspector"])).toBe("/field");
  });
});

test.describe("TASK-WEB-SHELL-001 responsive and language behavior", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("desktop navigation collapses with unified business and accessible locked admin options", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    // exact: the M9 "Planning *" admin entries would otherwise substring-match.
    await expect(nav.getByRole("link", { name: "Planning", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Factory 360" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Review & Approval" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Compliance Library" })).toBeVisible();
    await nav.getByRole("button", { name: "Administration" }).click();
    await expect(nav.locator('[data-nav-state="disabled"]')).toHaveCount(7);
    await expect(nav.getByRole("link", { name: /Users & Roles.*Administrator access required/ })).toHaveAttribute("aria-disabled", "true");
    await expect(nav.getByRole("link", { name: /Users & Roles.*Administrator access required/ })).not.toHaveAttribute("href");

    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(page.locator(".sq-shell")).toHaveClass(/is-collapsed/);
    await expect(nav.getByRole("link", { name: "Planning", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await expect(page.locator(".sq-shell")).not.toHaveClass(/is-collapsed/);
  });

  test("government shell keeps notification and account controls responsive", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const account = page.locator(".sq-shell-account__trigger");
    const identity = page.locator(".sq-shell-account__identity");
    await expect(account).toBeVisible();
    await expect(identity).toBeVisible();
    await expect(page.locator(".sq-notification__trigger")).toBeVisible();

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
    await expect(page.locator(".sq-shell")).toHaveClass(/is-drawer-open/);
    await expect(page.locator(".sq-shell__close")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".sq-shell")).not.toHaveClass(/is-drawer-open/);
    await expect(menu).toBeFocused();
  });

  test("Arabic applies document RTL and both visual themes remain operable", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("nav.sq-shell__nav")).toHaveAttribute("aria-label", /[\u0600-\u06FF]/);
    const theme = page.locator(".sq-pagehead__actions > button.sq-topbar-icon");
    const firstOfferedMode = await theme.getAttribute("aria-label");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "light" : "dark");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", firstOfferedMode?.includes("الفاتح") ? "dark" : "light");
  });
});
