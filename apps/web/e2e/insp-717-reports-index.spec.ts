import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { storageStatePath } from "./personas";

test.use({ storageState: storageStatePath("supervisor"), trace: "on" });

test("INSP-717 Dashboard report drill resolves to governed inspection records", async ({ page }, testInfo) => {
  const dashboard = readFileSync(resolve(process.cwd(), "src/app/(app)/dashboard/DashboardView.tsx"), "utf8");
  expect(dashboard).toContain('href="/reports"');
  expect(dashboard).toContain('"Open records"');

  await page.goto("/reports");

  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
  await expect(page.getByText(/Source (available|degraded)/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("404");

  const rows = page.locator("table.sq-table tbody tr");
  if (await rows.count()) {
    const detail = rows.first().getByRole("link", { name: "Open report" });
    await expect(detail).toHaveAttribute("href", /^\/reports\/inspection\/[0-9a-f-]+$/);
    await detail.click();
    await expect(page).toHaveURL(/\/reports\/inspection\/[0-9a-f-]+$/);
    await expect(page.locator("body")).not.toContainText("Report not available");
  } else {
    await expect(page.getByText("No inspection reports are visible in your scope.")).toBeVisible();
  }

  await page.screenshot({ path: testInfo.outputPath("insp-717-reports-rerun.png"), fullPage: true });
});
