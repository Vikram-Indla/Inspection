import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Browser-level journey proof: these are the actual user entry points, not
// source-only assertions. Generation is deliberately not clicked here because
// it creates an append-only advisory record in the shared authenticated store.
test.describe("contextual AI user journeys", () => {
  test.describe("planner: planning facts to a governed advisory", () => {
    test.use({ storageState: storageStatePath("planner") });
    test("opens the planning summary in the bulk-review workflow", async ({ page }) => {
      await page.goto("/planning/bulk");
      await expect(page.getByTestId("planning_summary-panel")).toBeVisible();
      await expect(page.getByRole("button", { name: /generate planning summary/i })).toBeVisible();
      await expect(page.getByText(/never selects, ranks or publishes anything/i)).toBeVisible();
    });
  });

  test.describe("inspector: assignment briefing to an actionable visit", () => {
    test.use({ storageState: storageStatePath("inspector") });
    test("opens the daily briefing inside My assignments", async ({ page }) => {
      await page.goto("/field");
      await expect(page.getByTestId("inspector_daily_briefing-panel")).toBeVisible();
      await expect(page.getByRole("button", { name: /generate my briefing/i })).toBeVisible();
      await expect(page.getByText(/does not create a route, alter a visit/i)).toBeVisible();
      await expect(page.getByText("My visits")).toBeVisible();
    });
  });

  test.describe("factory user: score explanation stays beside the score", () => {
    test.use({ storageState: storageStatePath("planner") });
    test("opens Factory 360 and finds the governed explanation at risk history", async ({ page }) => {
      await page.goto("/factories");
      const factory = page.locator('a[href^="/factories/"]').first();
      await expect(factory).toBeVisible();
      await factory.click();
      await expect(page).toHaveURL(/\/factories\//);
      await expect(page.getByTestId("factory_risk_explanation-panel")).toBeVisible();
      await expect(page.getByRole("button", { name: /explain recorded drivers/i })).toBeVisible();
    });
  });
});
