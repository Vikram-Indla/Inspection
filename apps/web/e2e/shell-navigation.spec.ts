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
// The shared business catalogue = the "business"-visibility destinations, which
// every web persona receives identically. (Enabled-href equality is not a valid
// cross-persona check: advanced admin items such as ops enforcement tools are
// role-specific additions on top of this shared set.)
const businessHrefsFor = (roles: string[]) =>
  itemsFor(roles).filter(item => item.visibility === "business" && item.enabled).map(item => item.href);
const businessHrefs = [
  "/dashboard", "/operations", "/factories", "/planning", "/field", "/reviews",
  "/admin/regulations", "/admin/compliance-approvals", "/admin/violations", "/analytics",
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
        expect.objectContaining({ id: "admin-home", href: "/admin" }),
      ]));
    }
  });

  test("all three canonical presentation roles receive the same full catalogue", () => {
    const security = itemsFor(["security_admin"]);
    expect(security.filter(item => item.visibility === "business").map(item => item.href)).toEqual(businessHrefs);
    expect(security.filter(item => item.visibility === "canonical-admin").map(item => item.id)).toEqual([
      "adm-users", "adm-lookup", "adm-risk", "adm-survey", "adm-notif", "adm-integration",
    ]);
    expect(itemsFor(["planner"]).map(item => item.id)).toEqual(security.map(item => item.id));
    expect(itemsFor(["inspector"]).map(item => item.id)).toEqual(security.map(item => item.id));
  });

  test("administration is pinned as one collapsed group with six canonical destinations", () => {
    const groups = buildShellNavigation(["planner"]);
    expect(groups.map(group => group.id)).toEqual([
      "overview", "operations", "compliance", "insights", "administration",
    ]);
    const administration = groups.find(group => group.id === "administration");
    expect(administration?.items.map(item => [item.labelEn, item.href])).toEqual([
      ["Users & Roles", "/admin/access"],
      ["Lookup Management", "/admin/localization"],
      ["Risk Configuration", "/admin/risk"],
      ["Survey Configuration", "/admin/packages"],
      ["Notification Configuration", "/admin/notifications"],
      ["Integration Management", "/admin/integrations"],
    ]);
    expect(administration?.items.every(item => item.enabled)).toBe(true);
  });

  test("legacy extra routes are folded out of the canonical rail", () => {
    const hrefs = itemsFor(["planner"]).map(item => item.href);
    expect(hrefs).not.toEqual(expect.arrayContaining([
      "/visits", "/tasks", "/virtual", "/cases", "/committee", "/portal",
    ]));
    expect(hrefs).toEqual(expect.arrayContaining(["/field", "/admin/violations"]));
  });

  test("administrator capability profiles retain the canonical business catalogue", () => {
    const security = itemsFor(["security_admin"]);
    expect(security.filter(item => item.visibility === "business").map(item => item.href)).toEqual(businessHrefs);
  });

  test("admin routes consume the same shared shell", () => {
    const shell = readFileSync(resolve(__dirname, "../src/components/Shell.tsx"), "utf8");
    expect(shell).toContain("<ShellClient");
    expect(shell).not.toContain("AdminShellClient");
  });

  test("pinned Administration chrome keeps keyboard and mobile accessibility contracts", () => {
    const source = readFileSync(resolve(__dirname, "../src/components/ShellClient.tsx"), "utf8");
    expect(source).toContain('event.key !== "Escape"');
    expect(source).toContain('className="sq-shell__nav-footer"');
    expect(source).toContain('group.id === "administration"');
    expect(source).toContain("sq-shell__expand-row");
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
    expect(isAdminOnlyPersona(["security_admin"])).toBe(true);
    expect(isAdminOnlyPersona(["compliance_admin", "form_admin"])).toBe(true);
    expect(isAdminOnlyPersona(["security_admin", "planner"])).toBe(false);
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
    const shell = readFileSync(join(process.cwd(), "src/components/ShellClient.tsx"), "utf8");
    expect(shell).toContain('<div className="sq-shell-controls">');
    expect(shell).toContain("routeScope.date ? (");
    expect(shell).toContain("sq-shell-scope--region");
    expect(shell).toContain(") : null}");
    expect(shell).toContain("(max-width: 1024px), (pointer: coarse)");
  });

  test("account trigger presents only the signed-in work email", () => {
    const shell = readFileSync(join(process.cwd(), "src/components/ShellClient.tsx"), "utf8");
    expect(shell).toContain('aria-label={email}');
    expect(shell).toContain('title={email}');
    expect(shell).toContain('{initials(email)}');
    expect(shell).toContain('<strong>{email}</strong><small aria-hidden="true" />');
    expect(shell).not.toContain('const accountHoverLabel');
    expect(shell).not.toContain('<small>{roleLabel}</small>');
  });
});

test.describe("TASK-WEB-CHANNEL-ACCESS-GATE-001 field channel (rbac_matrix.csv RBAC-009/010)", () => {
  test("Inspector receives the canonical shared catalogue and guarded Administration entry", () => {
    const groups = buildShellNavigation(["inspector"]);
    expect(groups.map(group => group.id)).toEqual(["overview", "operations", "compliance", "insights", "administration"]);
    expect(businessHrefsFor(["inspector"])).toEqual(businessHrefs);
    expect(enabledHrefsFor(["inspector"])).toContain("/admin");
  });

  test("a multi-role Inspector+Planner keeps the canonical catalogue", () => {
    expect(isFieldOnlyPersona(["inspector", "planner"])).toBe(false);
    expect(businessHrefsFor(["inspector", "planner"])).toEqual(businessHrefs);
    expect(enabledHrefsFor(["inspector", "planner"])).toContain("/admin");
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

  test("desktop navigation collapses with the authorized business catalogue only", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    // exact: the M9 "Planning *" admin entries would otherwise substring-match.
    await expect(nav.getByRole("link", { name: "Planning", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Factory 360" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Review & Approval" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Compliance Library" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Administration" })).toBeVisible();
    await expect(nav.locator('[data-nav-state="disabled"]')).toHaveCount(0);

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
