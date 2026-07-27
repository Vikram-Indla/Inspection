import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// CODEX 03 — live smoke for the new /field SAQEEL composition against the real
// staging DB (inspector RLS scope). Proves the page renders end-to-end: metric
// strip with corrected semantics and unified-shell actions — no runtime crash
// and no fabricated compliance label.
test.use({ storageState: storageStatePath("inspector") });

test.describe("field dashboard (live render)", () => {
  test("renders the SAQEEL field composition with corrected KPI semantics", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/field");
    await expect(page).toHaveURL(/\/field/);

    // Metric strip labels (corrected semantics).
    await expect(page.getByText("Today's visits").first()).toBeVisible();
    await expect(page.getByText("Daily progress").first()).toBeVisible();
    // Weekly completion exposes its exact submitted/assigned definition and
    // explicitly keeps approval outside that calculation.
    await page.getByRole("button", { name: "Weekly" }).click();
    await expect(page.getByText("Completion rate").first()).toBeVisible();
    await expect(page.getByText(/not approval/i).first()).toBeVisible();

    // The old mislabel must be gone.
    await expect(page.getByText("Compliance rate", { exact: true })).toHaveCount(0);

    // Execution actions remain reachable inside the canonical AppShell.
    await expect(page.getByText("My visits").first()).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();

    expect(errors, `page errors: ${errors.join("\n")}`).toEqual([]);
  });
});
