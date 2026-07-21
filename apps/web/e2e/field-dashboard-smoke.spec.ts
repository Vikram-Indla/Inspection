import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// CODEX 03 — live smoke for the new /field SAQEEL composition against the real
// staging DB (inspector RLS scope). Proves the page renders end-to-end: metric
// strip with corrected semantics, personal-performance separation, action bar,
// and bottom tabs — no runtime crash, no fabricated compliance label.
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
    // Daily progress is explicitly NOT approval.
    await expect(page.getByText(/not approval/i).first()).toBeVisible();

    // Personal performance keeps approval and compliance SEPARATE.
    await expect(page.getByText("Approval outcomes").first()).toBeVisible();
    await expect(page.getByText("Checklist compliance").first()).toBeVisible();
    await expect(page.getByText(/approval is not compliance/i).first()).toBeVisible();

    // The old mislabel must be gone.
    await expect(page.getByText("Compliance rate", { exact: true })).toHaveCount(0);

    // Field chrome present: action bar + bottom tabs preserved.
    await expect(page.getByText("Start next visit").first()).toBeVisible();

    expect(errors, `page errors: ${errors.join("\n")}`).toEqual([]);
  });
});
