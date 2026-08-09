import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

test.describe("planner tour (web channel)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("lands on the shared dashboard; all three planning methods reachable", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/launch");
    await page.waitForURL(/\/dashboard/);
    await page.goto("/planning");
    for (const href of ["/planning/single", "/planning/bulk", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
    }
  });

  test("single-planning wizard opens on identity search and withholds publish until an identity is confirmed", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/planning/single");
    await expect(page.getByPlaceholder(/CR number|Industrial License/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /publish visit/i })).toHaveCount(0);
  });

  test("visits and factories registries render", async ({ page }) => {
    await page.goto("/locale?set=en");
    for (const route of ["/visits", "/factories"]) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));
      await expect(page.locator("nav").first()).toBeVisible();
    }
  });
});

test.describe("inspector tour", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("lands on the shared dashboard scoped to the inspector persona; execution home renders", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/launch");
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Inspector", exact: true })).toBeVisible();
    await page.goto("/field");
    await expect(page.getByText("Daily brief").first()).toBeVisible();
    await expect(page.getByText(/Today's Schedule/i).first()).toBeVisible();
  });

  test("an admin destination renders the governed denial, not admin data", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /You do not have access to this destination/i })).toBeVisible();
    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.getByText(/Users & roles/).first()).toBeAttached();
  });
});

test.describe("reviewer tour (web channel)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("dashboard landing; review queue renders with the immutability contract visible", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/launch");
    await page.waitForURL(/\/dashboard/);
    await page.goto("/reviews");
    await expect(page.locator(".sq-table, .sq-state").first()).toBeVisible();
    await expect(page.locator(".sq-banner--immutable")).toBeVisible();
  });
});
