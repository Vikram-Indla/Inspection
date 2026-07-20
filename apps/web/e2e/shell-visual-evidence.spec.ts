import { test, expect } from "@playwright/test";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

const evidenceDir = evidenceDirectory("task-web-compliance-shared-shell-001");

test.describe("TASK-WEB-COMPLIANCE-SHARED-SHELL-001 visual evidence", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("captures matching light/dark desktop and collapsed navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
    });
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expect(page.locator('[data-nav-state="disabled"]')).toHaveCount(7);
    await page.screenshot({ path: `${evidenceDir}/planner-desktop-en-light.png`, fullPage: false });

    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.screenshot({ path: `${evidenceDir}/planner-desktop-en-dark.png`, fullPage: false });

    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-collapsed/);
    await page.waitForTimeout(300); // evidence frame after the 200ms grid transition settles
    await page.screenshot({ path: `${evidenceDir}/planner-desktop-en-collapsed.png`, fullPage: false });
  });

  test("captures the Arabic light mobile drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-drawer-open/);
    await expect(page.locator('[data-nav-state="disabled"]')).toHaveCount(7);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
    await page.waitForTimeout(300); // evidence frame after the 200ms drawer transition settles
    await page.screenshot({ path: `${evidenceDir}/planner-mobile-ar-light-drawer.png`, fullPage: false });
  });
});
