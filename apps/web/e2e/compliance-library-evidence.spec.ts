import { test, expect } from "@playwright/test";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

const evidenceDir = evidenceDirectory("task-web-compliance-library-003");

test.describe("TASK-WEB-COMPLIANCE-LIBRARY-003 read-only runtime evidence", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("captures the library and exact published Inspector Runtime Preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/locale?set=en");
    await page.goto("/admin/items");
    await expect(page.getByRole("navigation", { name: "Compliance Library" })).toBeVisible();
    await expect(page.getByText("Legacy compatibility authoring.")).toBeVisible();
    await page.screenshot({ path: `${evidenceDir}/compliance-library-items-en-light.png`, fullPage: true });

    const previewLink = page.getByRole("link", { name: "Inspector Runtime Preview" }).first();
    await expect(previewLink).toBeVisible();
    await previewLink.click();
    await expect(page.getByRole("heading", { name: "Published execution configuration" })).toBeVisible();
    await expect(page.getByText("Control-plane preview only.")).toBeVisible();
    await page.screenshot({ path: `${evidenceDir}/inspector-runtime-preview-en-light.png`, fullPage: true });
  });
});
