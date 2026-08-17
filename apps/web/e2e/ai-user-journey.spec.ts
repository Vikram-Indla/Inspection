import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Browser-level journey proof: these are the actual user entry points, not
// source-only assertions. Generation is deliberately not clicked here because
// it creates an append-only advisory record in the shared authenticated store.
test.describe("contextual AI user journeys", () => {
  test.describe("inspector: assignment briefing to an actionable visit", () => {
    test.use({ storageState: storageStatePath("inspector") });
    test("opens the daily briefing inside My assignments", async ({ page }) => {
      await page.goto("/field");
      await expect(page.getByRole("region", { name: "AI Daily Brief" })).toBeVisible();
      await expect(page.getByText("AI Daily Brief")).toBeVisible();
      await expect(page.getByText("Advisory only", { exact: true })).toBeVisible();
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

  test.describe("planner: operational view to governed visit summary", () => {
    test.use({ storageState: storageStatePath("planner") });
    test("opens the summary inside Visit Management", async ({ page }) => {
      await page.goto("/visits");
      await expect(page.getByTestId("visit_management_summary-panel")).toBeVisible();
      await expect(page.getByRole("button", { name: /generate summary/i })).toBeVisible();
      await expect(page.getByText(/can't change a visit, assignment, state, or campaign/i)).toBeVisible();
      await expect(page.getByRole("group", { name: /visit management views/i })).toBeVisible();
    });
  });
});
