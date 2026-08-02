import { test } from "@playwright/test";
import { storageStatePath } from "../e2e/personas";
test.use({ storageState: storageStatePath("inspector") });
test("reviews list", async ({ page }) => {
  await page.goto("/reviews");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "demo-screens/reviews-list.png", fullPage: true });
});
