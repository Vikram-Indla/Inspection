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
      ["/admin/integrations", "System connections"],
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
    // The registry read is live: either the seeded MVP3 endpoints render
    // (EBDA among them) or the governed no-endpoints state states itself —
    // never a blank or broken table.
    const ebda = page.getByRole("rowheader", { name: /EBDA data exchange/ });
    const emptyState = page.getByText(/No endpoints are registered/i);
    await expect(ebda.or(emptyState).first()).toBeVisible();
    if (await ebda.count()) {
      await expect(page.locator("tbody tr")).toHaveCount(4);
    }
  });

  test("one shell composes MVP1, MVP2 and MVP3 destinations without route loss", async ({ page }) => {
    // The shell rail localizes every href (/en/...) and reaches the admin hub
    // and enforcement through their own entries (palette / /admin/violations),
    // so nav-current is asserted only for the routes the rail lists directly.
    const navRoutes = ["/admin/workflows", "/admin/risk", "/admin/audit",
      "/admin/gis", "/admin/integrations", "/admin/operations", "/admin/security-access", "/admin/devices"] as const;
    const hubRoutes = ["/admin", "/admin/regulations", "/enforcement"] as const;
    await page.goto("/locale?set=en");
    for (const route of [...hubRoutes, ...navRoutes]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("main h2").first(), route).toBeVisible();
      await noRuntimeFailure(page);
    }
    for (const route of navRoutes) {
      await page.goto(route);
      await expect(page.locator(`nav a[href="/en${route}"]`).first(), route).toHaveAttribute("aria-current", "page");
    }
  });

  test("Arabic RTL mobile and both themes work on the additive MVP3 surface", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/locale?set=ar");
    await page.goto("/admin/integrations");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "اتصالات النظام" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    // The shell theme control cycles system → light → dark; pin each explicit
    // mode through its persisted keys and prove the surface renders in both.
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate(mode => {
        localStorage.setItem("saqeel-theme", mode);
      }, theme);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { name: "اتصالات النظام" })).toBeVisible();
    }
  });
});

test.describe("TASK-MVP3-RETROFIT-REGRESSION-001 inherited persona containment", () => {
  test("inspector keeps MVP1 field access but reads no MVP3 integration registry", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("inspector") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/field");
    await page.waitForURL(/\/field/);
    // Access reconciliation: the admin destination now denies the inspector
    // in place (the earlier channel redirect retired with the shared access
    // model). The security property is unchanged — the registry contents
    // must never reach the inspector's page.
    await page.goto("/admin/integrations");
    await expect(page.getByRole("heading", { name: /You do not have access to this destination/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("EBDA data exchange");
    await expect(page.getByRole("rowheader")).toHaveCount(0);
    await context.close();
  });

  for (const [persona, route, title] of [
    ["planner", "/planning", "Planning"],
    ["inspector", "/field", "Quick actions"],
    ["reviewer", "/reviews", "Inspection review queue"],
  ] as const) {
    test(`${persona} retains its canonical MVP1 workspace after MVP3 integration`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: storageStatePath(persona) });
      const page = await context.newPage();
      await page.goto("/locale?set=en");
      await page.goto(route);
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
      await noRuntimeFailure(page);
      await context.close();
    });
  }
});
