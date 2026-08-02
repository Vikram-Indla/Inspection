import { test } from "@playwright/test";
import { storageStatePath } from "./personas";

// Temporary — visual tour capture only, not a regression test.
test.use({ storageState: storageStatePath("inspector") });

const PAGES: [string, string][] = [
  ["/field/establishments/unregistered", "5-unregistered-establishment"],
];

for (const [path, file] of PAGES) {
  test(`tour: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("button", { name: /Create visit/i }).waitFor({ timeout: 20_000 });
    await page.waitForTimeout(1500); // let map tiles paint without waiting for full network idle
    await page.screenshot({ path: `demo-screens/tour-${file}.png`, fullPage: true });
  });
}
