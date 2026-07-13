import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

const evidenceDir = "../../product-contract/evidence/screens/shell-v1";

test.describe("TASK-WEB-SHELL-001 visual evidence", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("captures desktop, collapse, mobile drawer and Arabic light", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await page.screenshot({ path: `${evidenceDir}/planner-desktop-en-dark.png`, fullPage: false });

    await page.getByRole("button", { name: "Collapse navigation" }).click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-collapsed/);
    await page.waitForTimeout(300); // evidence frame after the 200ms grid transition settles
    await page.screenshot({ path: `${evidenceDir}/planner-desktop-en-collapsed.png`, fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    const theme = page.locator("button.ax-topbar-icon").filter({ has: page.locator("svg") }).first();
    if ((await theme.getAttribute("aria-label"))?.includes("الفاتح")) await theme.click();
    await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
    await expect(page.locator(".ax-shell")).toHaveClass(/is-drawer-open/);
    await page.waitForTimeout(300); // evidence frame after the 200ms drawer transition settles
    await page.screenshot({ path: `${evidenceDir}/planner-mobile-ar-light-drawer.png`, fullPage: false });
  });
});
