import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  buildShellNavigation,
  isAdminOnlyPersona,
  isShellRouteCurrent,
  shellScopeForRoute,
  isFieldOnlyPersona,
} from "../src/lib/shell-navigation";
import { homeForRoles } from "../src/lib/role-home";
import { storageStatePath } from "./personas";

const itemsFor = (roles: string[]) => buildShellNavigation(roles).flatMap(group => group.items);
const enabledHrefsFor = (roles: string[]) => itemsFor(roles).filter(item => item.enabled).map(item => item.href);
const businessHrefsFor = (roles: string[]) =>
  itemsFor(roles).filter(item => item.visibility === "business" && item.enabled).map(item => item.href);
const businessHrefs = [
  "/dashboard", "/operations", "/factories", "/planning", "/execution", "/reviews",
  "/admin/regulations", "/admin/compliance-approvals", "/admin/violations", "/analytics",
];
const canonicalAdminIds = [
  "adm-users", "adm-lookup", "adm-survey", "adm-planning-expiry", "adm-planning-lookups",
  "adm-planning-status", "adm-compliance-requests", "adm-risk", "adm-integration",
  "adm-gis", "adm-gis-spatial", "adm-notif", "adm-delegation", "adm-execution", "adm-operations",
  "adm-enforcement-recommendations", "adm-workflows", "adm-audit", "adm-access-review",
  "adm-devices",
];

test.describe("TASK-WEB-COMPLIANCE-SHARED-SHELL-001 role matrix", () => {
  test("every business persona receives the canonical catalogue and Administration entry", () => {
    for (const role of ["planner", "inspector", "reviewer", "ops", "leadership"]) {
      const groups = buildShellNavigation([role]);
      expect(businessHrefsFor([role])).toEqual(businessHrefs);
      const adminItems = groups.filter(group => group.id === "administration" || group.id.startsWith("admin-"))
        .flatMap(group => group.items);
      expect(adminItems.every(item => item.enabled)).toBe(true);
      expect(adminItems).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "adm-users", href: "/admin/access" }),
      ]));
    }
  });

  test("all three canonical presentation roles receive the same full catalogue", () => {
    const security = itemsFor(["security_admin"]);
    expect(security.filter(item => item.visibility === "business").map(item => item.href)).toEqual(businessHrefs);
    expect(security.filter(item => item.visibility === "canonical-admin").map(item => item.id)).toEqual(canonicalAdminIds);
    expect(itemsFor(["planner"]).map(item => item.id)).toEqual(security.map(item => item.id));
    expect(itemsFor(["inspector"]).map(item => item.id)).toEqual(security.map(item => item.id));
  });

  test("administration is pinned as one collapsed group with every governed destination", () => {
    const groups = buildShellNavigation(["planner"]);
    expect(groups.map(group => group.id)).toEqual([
      "overview", "operations", "compliance", "insights", "administration",
    ]);
    const administration = groups.find(group => group.id === "administration");
    expect(administration?.items.map(item => [item.labelEn, item.href])).toEqual([
      ["Users & roles", "/admin/access"],
      ["Language & translations", "/admin/localization"],
      ["Survey Configuration", "/admin/packages"],
      ["Planning Expiry Rules", "/admin/planning/expiry"],
      ["Planning Lookups", "/admin/planning/lookups"],
      ["Planning Status Rules", "/admin/planning/status"],
      ["Configuration Requests", "/admin/compliance-requests"],
      ["Risk Configuration", "/admin/risk"],
      ["Integration Management", "/admin/integrations"],
      ["GIS Studio", "/admin/gis"],
      ["Spatial Canvas", "/admin/gis/spatial"],
      ["Notification Configuration", "/admin/notifications"],
      ["Delegation", "/admin/delegation"],
      ["Execution Settings", "/admin/execution"],
      ["System Operations", "/admin/operations"],
      ["Enforcement Recommendations", "/admin/enforcement-recommendations"],
      ["Workflow Builder", "/admin/workflows"],
      ["Audit Trail", "/admin/audit"],
      ["Access Review", "/admin/security-access"],
      ["Trusted Devices", "/admin/devices"],
    ]);
    expect(administration?.items.every(item => item.enabled)).toBe(true);
  });

  test("legacy extra routes are folded out of the canonical rail", () => {
    const hrefs = itemsFor(["planner"]).map(item => item.href);
    expect(hrefs).not.toEqual(expect.arrayContaining([
      "/visits", "/tasks", "/virtual", "/cases", "/committee", "/portal",
    ]));
    expect(hrefs).toEqual(expect.arrayContaining(["/execution", "/admin/violations"]));
  });

  test("administrator capability profiles retain the canonical business catalogue", () => {
    const security = itemsFor(["security_admin"]);
    expect(security.filter(item => item.visibility === "business").map(item => item.href)).toEqual(businessHrefs);
  });

  test("admin routes consume the same shared shell", () => {
    const layout = readFileSync(resolve(__dirname, "../src/app/(app)/layout.tsx"), "utf8");
    expect(layout).toContain('import AppShell from "@/components/app-shell/app-shell"');
    expect(layout).toContain("<AppShell>{children}</AppShell>");
    expect(layout).not.toContain("AdminShellClient");
  });

  test("pinned Administration chrome keeps keyboard and mobile accessibility contracts", () => {
    const mobileNav = readFileSync(resolve(__dirname, "../src/components/app-shell/shell-mobile-nav/shell-mobile-nav.tsx"), "utf8");
    expect(mobileNav).toContain('if (event.key === "Escape")');
    expect(mobileNav).toContain('role="dialog" aria-modal="true"');
    const rail = readFileSync(resolve(__dirname, "../src/components/app-shell/shell-rail/shell-rail.tsx"), "utf8");
    expect(rail).toContain("groups.filter(group => group.isAdministration)");
    const navGroup = readFileSync(resolve(__dirname, "../src/components/app-shell/shell-rail/shell-nav-group.tsx"), "utf8");
    expect(navGroup).toContain('data-pinned={group.isAdministration ? "" : undefined}');
    expect(navGroup).toContain("open={holdsCurrentRoute || !group.isAdministration}");
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

test.describe("ADMIN-SHELL-PERSONA-001 admin-only channel", () => {
  test("admin-only detection requires an admin grant and no business grant", () => {
    expect(isAdminOnlyPersona(["admin"])).toBe(true);
    expect(isAdminOnlyPersona(["security_admin"])).toBe(false);
    expect(isAdminOnlyPersona(["compliance_admin", "form_admin"])).toBe(false);
    expect(isAdminOnlyPersona(["admin", "planner"])).toBe(false);
    expect(isAdminOnlyPersona(["planner"])).toBe(false);
    expect(isAdminOnlyPersona([])).toBe(false);
  });

  test("parent layout no longer redirects capability profiles between shells", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/(app)/layout.tsx"), "utf8");
    expect(layout).toContain("return <AppShell>{children}</AppShell>");
    expect(layout).not.toContain("isAdminOnlyPersona");
    expect(layout).not.toContain("isBusinessOnlyPath");
  });

  test("admin routes retain the common global-search and scope cluster", () => {
    const topbar = readFileSync(join(process.cwd(), "src/components/app-shell/shell-topbar/shell-topbar.tsx"), "utf8");
    expect(topbar).toContain("<ShellSearch");
    expect(topbar).toContain("<ShellScopeControls");
    expect(topbar).toContain("view.isAdminWorkspace ? (");
    expect(topbar).toContain("<ShellAdminPalette");
    const scopeControls = readFileSync(join(process.cwd(), "src/components/app-shell/shell-topbar/shell-scope-controls.tsx"), "utf8");
    expect(scopeControls).toContain("disabled={!scope.date}");
    expect(scopeControls).toContain("disabled={!scope.region || !regions.length}");
  });

  test("account trigger carries the verified identity and keeps the email in the menu", () => {
    const menu = readFileSync(join(process.cwd(), "src/components/app-shell/shell-topbar/shell-user-menu.tsx"), "utf8");
    expect(menu).toContain("aria-label={`${identity.name} — ${identity.roleSummary}`}");
    expect(menu).toContain("title={identity.email}");
    expect(menu).toContain('aria-hidden="true">{identity.initials}');
    expect(menu).toContain("{identity.email}");
  });
});

test.describe("TASK-WEB-CHANNEL-ACCESS-GATE-001 field channel (rbac_matrix.csv RBAC-009/010)", () => {
  test("Inspector receives the canonical shared catalogue and guarded Administration entry", () => {
    const groups = buildShellNavigation(["inspector"]);
    expect(groups.map(group => group.id)).toEqual(["overview", "operations", "compliance", "insights", "administration"]);
    expect(businessHrefsFor(["inspector"])).toEqual(businessHrefs);
    expect(enabledHrefsFor(["inspector"])).toContain("/admin/access");
  });

  test("a multi-role Inspector+Planner keeps the canonical catalogue", () => {
    expect(isFieldOnlyPersona(["inspector", "planner"])).toBe(false);
    expect(businessHrefsFor(["inspector", "planner"])).toEqual(businessHrefs);
    expect(enabledHrefsFor(["inspector", "planner"])).toContain("/admin/access");
  });

  test("field-only detection is precise and never locks out web or no-role sessions", () => {
    expect(isFieldOnlyPersona(["inspector"])).toBe(true);
    expect(isFieldOnlyPersona(["planner"])).toBe(false);
    expect(isFieldOnlyPersona(["security_admin"])).toBe(false);
    expect(isFieldOnlyPersona([])).toBe(false);
  });

  test("every canonical role lands on the shared Dashboard", () => {
    for (const role of ["admin", "planner", "supervisor", "inspector"]) {
      expect(homeForRoles([role])).toBe("/dashboard");
    }
  });
});

test.describe("TASK-WEB-SHELL-001 responsive and language behavior", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("desktop navigation collapses with the authorized business catalogue only", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav.getByRole("link", { name: "Planning", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Factory 360" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Review & Approval" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Compliance Library" })).toBeVisible();
    await expect(nav.locator("summary").filter({ hasText: "Administration" })).toBeVisible();
    await expect(nav.locator('[aria-disabled="true"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-shell-rail", "collapsed");
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-shell-rail", "expanded");
    await expect(nav.getByRole("link", { name: "Planning", exact: true })).toBeVisible();
  });

  test("government shell keeps notification and account controls responsive", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const account = page.locator('header button[aria-haspopup="dialog"][title*="@"]');
    const identity = account.getByText("E2E Planner");
    await expect(account).toBeVisible();
    await expect(identity).toBeVisible();
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();

    await page.setViewportSize({ width: 600, height: 900 });
    await expect(account).toBeVisible();
    await expect(identity).toBeHidden();
    const box = await account.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(600);
  });

  test("mobile drawer opens, traps the shell interaction and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.click();
    const drawer = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Close navigation" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test("Arabic applies document RTL and both visual themes remain operable", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => localStorage.setItem("saqeel-theme", "light"));
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('nav[data-variant="rail"]')).toHaveAttribute("aria-label", /[؀-ۿ]/);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "الوضع الداكن" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "تتبع النظام" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
