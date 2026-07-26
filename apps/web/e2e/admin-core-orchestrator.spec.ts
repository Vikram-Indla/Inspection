import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { PERSONAS } from "./personas";

const ADMIN_ROUTES = [
  "/admin",
  "/admin/access",
  "/admin/audit",
  "/admin/bulk-violations",
  "/admin/compliance-approvals",
  "/admin/devices",
  "/admin/enforcement-recommendations",
  "/admin/execution",
  "/admin/gis",
  "/admin/integrations",
  "/admin/items",
  "/admin/localization",
  "/admin/notifications",
  "/admin/operations",
  "/admin/packages",
  "/admin/planning/expiry",
  "/admin/planning/lookups",
  "/admin/planning/status",
  "/admin/regulations",
  "/admin/risk",
  "/admin/security-access",
  "/admin/violations",
  "/admin/workflows",
] as const;

const CROSS_CARD_ROUTES = [
  "/ai/suggestions",
  "/admin/dashboard-config",
  "/admin/compliance-requests",
  "/enforcement",
] as const;

const suppliedAdminState = process.env.SAQEEL_TEST_ADMIN_STORAGE_STATE;
test.use({
  storageState: suppliedAdminState && fs.existsSync(suppliedAdminState)
    ? suppliedAdminState
    : { cookies: [], origins: [] },
});

async function signIn(page: Page) {
  await page.goto("/locale?set=en");
  await page.goto("/admin");
  if (new URL(page.url()).pathname === "/admin") return;
  await page.goto("/login");
  await page.getByRole("textbox", {
    name: "National ID / Staff number",
    exact: true,
  }).fill(PERSONAS.admin.email);
  await page.getByRole("textbox", {
    name: "Password Show password",
    exact: true,
  }).fill(PERSONAS.admin.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(url => url.pathname === "/admin", { timeout: 20_000 });
}

test("admin-core routes load under the real admin persona without console failures", async ({ page }) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  const routesOutsideShell: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await signIn(page);

  for (const route of ADMIN_ROUTES) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
    if (await page.locator("main").count() === 0) routesOutsideShell.push(route);
  }

  expect(routesOutsideShell, "admin routes outside the authenticated shell").toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("admin-core gateway reports the seeded persona's enabled families truthfully", async ({ page }) => {
  await signIn(page);
  const scope = page.getByRole("region", { name: /Your scope/i });
  const controlPanel = page.locator('[data-saqeel-design="WA-DES-020"]');
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  const hrefs = await nav.locator("a[href]").evaluateAll(links =>
    links.map(link => (link as HTMLAnchorElement).getAttribute("href")),
  );

  await expect(controlPanel.locator(".admin-hub-summary")).toHaveCount(7);
  await expect(nav.locator("[data-nav-group^='admin-']")).toHaveCount(7);
  for (const forbidden of ["/dashboard", "/operations", "/factories", "/planning", "/field", "/reviews"]) {
    expect(hrefs, `${forbidden} must not be disclosed to an admin-only persona`).not.toContain(forbidden);
  }
  await expect(page.getByRole("combobox", { name: "Search factories, visits, inspections…" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Date scope:/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Region scope" })).toHaveCount(0);
  await expect(scope).toContainText("Users");
  await expect(scope).toContainText("Inspection Forms");
  await expect(scope).toContainText("Workflow Settings");
  await expect(scope).toContainText("Risk Settings");
  await expect(scope).toContainText("Map Settings");
  await expect(scope).toContainText("Security & Access Review");
  await expect(scope).not.toContainText("You can act in none");
});

test("Control Panel keeps all authorized tools discoverable with honest local personalization", async ({ page }) => {
  await signIn(page);
  const controlPanel = page.locator('[data-saqeel-design="WA-DES-020"]');
  await expect(controlPanel.getByRole("heading", { name: "Favorites" })).toBeVisible();
  await expect(controlPanel).toContainText("No favorites have been saved on this device.");
  await expect(controlPanel.getByRole("heading", { name: "Recent areas" })).toBeVisible();
  await expect(controlPanel).toContainText("No tools have been opened from this page on this device.");

  const reveal = controlPanel.getByRole("button", { name: "View all authorized tools" });
  await reveal.click();
  const allTools = page.locator("#admin-authorized-tools");
  await expect(allTools).toBeVisible();
  const authorizedToolCount = await allTools.locator("li").count();
  expect(authorizedToolCount).toBeGreaterThan(0);

  const firstFavorite = allTools.getByRole("button", { name: /Add to favorites:/ }).first();
  const favoriteName = (await firstFavorite.getAttribute("aria-label"))?.replace(/^Add to favorites:\s*/, "");
  expect(favoriteName).toBeTruthy();
  await firstFavorite.click();
  await expect(controlPanel.getByRole("heading", { name: "Favorites" }).locator("..")).toContainText(favoriteName!);
  await page.reload();
  await expect(controlPanel.getByRole("heading", { name: "Favorites" }).locator("..")).toContainText(favoriteName!);
});

test("authorized admin discovery is identical in the rail and command palette", async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  const authorizedHrefs = await nav.locator("[data-nav-group^='admin-'] a[href]").evaluateAll(links =>
    [...new Set(links.map(link => (link as HTMLAnchorElement).getAttribute("href")).filter(Boolean))].sort(),
  );
  expect(authorizedHrefs.length).toBeGreaterThan(0);

  const trigger = page.getByRole("button", { name: /Open admin tools/i });
  await trigger.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Go to an admin tool" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search authorized admin tools" })).toBeFocused();
  const paletteHrefs = await dialog.getByRole("option").evaluateAll(links =>
    [...new Set(links.map(link => (link as HTMLAnchorElement).getAttribute("href")).filter(Boolean))].sort(),
  );
  expect(paletteHrefs).toEqual(authorizedHrefs);

  const search = page.getByRole("searchbox", { name: "Search authorized admin tools" });
  await search.fill("Dashboard");
  await expect(dialog.getByRole("option")).toHaveCount(0);
  await expect(dialog).toContainText("No matching tools");

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("every authorized admin discovery destination remains reachable", async ({ page }) => {
  test.setTimeout(120_000);
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  const authorizedHrefs = await nav.locator("[data-nav-group^='admin-'] a[href]").evaluateAll(links =>
    [...new Set(links.map(link => (link as HTMLAnchorElement).getAttribute("href")).filter((href): href is string => Boolean(href)))],
  );

  for (const href of authorizedHrefs) {
    const response = await page.goto(href);
    expect(response?.status(), `${href} response`).toBeLessThan(400);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});

test("the four cross-card Control Panel destinations remain reachable inside the shell", async ({ page }) => {
  await signIn(page);

  for (const route of CROSS_CARD_ROUTES) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});

for (const { width, height } of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 412, height: 915 },
  { width: 390, height: 844 },
  { width: 320, height: 800 },
] as const) {
  test(`admin gateway and operations reflow at ${width}x${height} in EN/LTR and AR/RTL`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await signIn(page);

    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      for (const route of ["/admin", "/admin/operations"] as const) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("main")).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} ${locale} at ${width}`).toBeLessThanOrEqual(1);
      }
    }
  });
}

test("mobile admin drawer closes with Escape and restores focus to its trigger in EN and AR", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);

  for (const locale of ["en", "ar"] as const) {
    await page.goto(`/locale?set=${locale}`);
    await page.goto("/admin");
    const menu = page.getByRole("button", { name: locale === "ar" ? "فتح القائمة" : "Open menu" });
    await menu.click();
    const nav = page.getByRole("navigation", {
      name: locale === "ar" ? "التنقل الرئيسي" : "Primary navigation",
    });
    await expect(nav).toBeVisible();
    const hubs = nav.locator(`[aria-label="${locale === "ar" ? "مجموعات الإدارة" : "Admin hubs"}"]`);
    await expect(hubs).toBeVisible();
    await hubs.getByRole("button").first().click();
    const back = nav.getByRole("button", {
      name: locale === "ar" ? "العودة إلى مجموعات الإدارة" : "Back to admin hubs",
    });
    await expect(back).toBeVisible();
    await back.click();
    await expect(hubs).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(page.locator(".ax-shell")).not.toHaveClass(/is-drawer-open/);
  }
});

test("anonymous users cannot read the admin gateway", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/locale?set=en");
  const response = await page.goto("/admin");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});
