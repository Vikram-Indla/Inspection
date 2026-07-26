import { expect, test, type Page } from "@playwright/test";

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

const email = process.env.SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL;
const password = process.env.SAQEEL_TEST_COMPLIANCE_ADMIN_PASSWORD;

test.use({ storageState: { cookies: [], origins: [] } });

async function signIn(page: Page) {
  if (!email || !password) {
    throw new Error(
      "Set SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL and " +
      "SAQEEL_TEST_COMPLIANCE_ADMIN_PASSWORD for the seeded admin persona.",
    );
  }

  await page.goto("/locale?set=en");
  await page.goto("/login");
  await page.getByRole("textbox", {
    name: "National ID / Staff number",
    exact: true,
  }).fill(email);
  await page.getByRole("textbox", {
    name: "Password Show password",
    exact: true,
  }).fill(password);
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

  await expect(controlPanel.locator("[data-control-card]")).toHaveCount(24);
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

test("anonymous users cannot read the admin gateway", async ({ page }) => {
  await page.goto("/locale?set=en");
  const response = await page.goto("/admin");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});
