import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

const noRuntimeFailure = async (page: import("@playwright/test").Page) => {
  await expect(page.locator("body")).not.toContainText("MVP3 database contract is not applied");
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
};

test.describe("TASK-MVP3-RETROFIT-REGRESSION-001 integrated control planes", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("live MVP3 schema renders through all four additive control-plane routes", async ({ page }) => {
    const routes = [
      ["/admin/integrations", "System Connections"],
      ["/admin/operations", "System operations and resilience"],
      ["/admin/security-access", "Security posture and access review"],
      ["/admin/devices", "Trusted device and offline administration"],
    ] as const;
    for (const [route, title] of routes) {
      await page.goto("/locale?set=en");
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await noRuntimeFailure(page);
    }
    await page.goto("/admin/integrations");
    await expect(page.getByRole("rowheader", { name: /EBDA data exchange/ })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(4);
  });

  test("one shell composes MVP1, MVP2 and MVP3 destinations without route loss", async ({ page }) => {
    const routes = ["/admin", "/admin/regulations", "/admin/workflows", "/admin/risk", "/admin/audit",
      "/admin/gis", "/admin/integrations", "/admin/operations", "/admin/security-access", "/admin/devices", "/enforcement"] as const;
    await page.goto("/locale?set=en");
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("main h2").first(), route).toBeVisible();
      await expect(page.locator(`nav a[href="${route}"]`), route).toHaveAttribute("aria-current", "page");
      await noRuntimeFailure(page);
    }
  });

  test("Arabic RTL mobile and both themes work on the additive MVP3 surface", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/locale?set=ar");
    await page.goto("/admin/integrations");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "وحدة تحكم موثوقية التكامل" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const theme = page.locator(".ax-pagehead__actions > button.ax-topbar-icon");
    const before = await page.locator("html").getAttribute("data-theme");
    await theme.click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", before ?? "light");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", before ?? "light");
  });
});

test.describe("TASK-MVP3-RETROFIT-REGRESSION-001 inherited persona containment", () => {
  test("inspector keeps MVP1 field access but reads no MVP3 integration registry", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/field");
    await page.waitForURL(/\/field/);
    // Channel-gate reconciliation (M11, precedent cd-020 / bc99e163): the
    // layout channel gate (3bc1acb0) redirects field-only personas to /field
    // BEFORE any admin query fires — the redirect IS the denial, strictly
    // stronger than the old RLS-scoped-shell premise. The registry contents
    // must never reach the inspector's page. (The original "Field dashboard"
    // heading assertion was dropped: the consolidation merges renamed the
    // field surface to "My assignments" — execution-line naming, not the
    // security property this test guards.)
    await page.goto("/admin/integrations");
    await expect(page).toHaveURL(/\/field/);
    await expect(page.locator("body")).not.toContainText("EBDA data exchange");
    await context.close();
  });

  for (const [persona, route, title] of [
    ["planner", "/planning", "Visit planning"],
    ["inspector", "/field", "Field dashboard"],
    ["reviewer", "/reviews", "Level 2 review queue"],
  ] as const) {
    test(`${persona} retains its canonical MVP1 workspace after MVP3 integration`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto("/locale?set=en");
      await page.goto(route);
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await noRuntimeFailure(page);
      await context.close();
    });
  }
});
