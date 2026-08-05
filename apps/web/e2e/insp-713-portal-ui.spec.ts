import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

test.use({ storageState: storageStatePath("admin"), trace: "on" });

const journeys = [
  ["INSP-246", "/portal?tab=establishments", "Establishments and eligible services"],
  ["INSP-248", "/portal?tab=requests&type=visit", "Visit request internal intake"],
  ["INSP-249", "/portal?tab=requests&type=correction", "Correction request internal intake"],
  ["INSP-250", "/portal?tab=requests&type=objection", "Objection request internal intake"],
  ["INSP-251", "/portal?tab=self-assessment", "Self-assessment"],
  ["INSP-252", "/portal?tab=requests&type=visit&view=review", "Visit request review"],
  ["INSP-253", "/portal?tab=self-assessment&view=review", "Self-assessment review"],
  ["INSP-254", "/portal?tab=requests&type=correction&view=review", "Correction request review"],
  ["INSP-255", "/portal?tab=requests&type=objection&view=review", "Objection request review"],
] as const;

for (const [story, url, heading] of journeys) {
  test(`${story} renders its bounded portal journey`, async ({ page }, testInfo) => {
    await page.goto(url);
    await expect(page).toHaveURL(url);
    await expect(page.getByText("Internal compliance view", { exact: true })).toBeVisible();
    await expect(page.locator("h2.panel-title").filter({ hasText: heading })).toBeVisible();
    await expect(page.getByText("Not available yet", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`${story}.png`), fullPage: true });
  });
}
