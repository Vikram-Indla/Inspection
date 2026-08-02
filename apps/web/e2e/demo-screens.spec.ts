import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

// Temporary — visual demo capture only, not a regression test. Not part of
// the suite's real coverage (see verify-new-report-flows.spec.ts for that).
test.use({ storageState: storageStatePath("inspector") });

async function drawSignature(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("signature canvas not found");
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 60);
  await page.mouse.move(box.x + 140, box.y + 20);
  await page.mouse.up();
}

test("demo: Summons Notice", async ({ page }) => {
  await page.goto("/field/summons-notices");
  await page.fill("#sn-subject", "استدعاء لاستكمال نواقص الترخيص");
  await page.fill("#sn-reason", "نواقص في وثائق الترخيص الصناعي");
  await page.screenshot({ path: "demo-screens/1-summons-empty.png", fullPage: true });
  await page.click("text=Capture signature");
  await page.fill('input[placeholder="Full name"]', "عبدالرحمن الشهري");
  await drawSignature(page);
  await page.screenshot({ path: "demo-screens/2-summons-signature-modal.png", fullPage: true });
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.click('#new-summons-notice button.btn-primary');
  await expect(page.locator("text=Summons notice issued.")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "demo-screens/3-summons-success.png", fullPage: true });
});

test("demo: Sample Collection Report", async ({ page }) => {
  await page.goto("/field/sample-collection-reports");
  await page.fill("#scr-collector", "خالد بن سعود");
  await page.fill("#scr-lab", "مختبر هيئة المدن الصناعية");
  await page.click("text=Capture signature");
  await page.fill('input[placeholder="Full name"]', "خالد بن سعود");
  await drawSignature(page);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.screenshot({ path: "demo-screens/4-samples-filled.png", fullPage: true });
  await page.click('#new-sample-collection-report button.btn-primary');
  await expect(page.locator("text=Sample collection report logged.")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "demo-screens/5-samples-success.png", fullPage: true });
});

test("demo: Destruction Report", async ({ page }) => {
  await page.goto("/field/destruction-reports");
  await page.click('#new-destruction-report button.btn-primary');
  await page.screenshot({ path: "demo-screens/6-destruction-required-guard.png", fullPage: true });
  await page.fill("#dr-report-number", "DEMO-2026-0801");
  await page.click("text=Capture signature");
  await page.fill('input[placeholder="Full name"]', "منى العتيبي");
  await drawSignature(page);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.click('#new-destruction-report button.btn-primary');
  await expect(page.locator("text=Destruction report logged.")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "demo-screens/7-destruction-success.png", fullPage: true });
});

test("demo: Facility Report", async ({ page }) => {
  await page.goto("/field/facility-reports");
  await page.locator('label').filter({ has: page.locator('input[name="facility_action"][value="close"]') }).click();
  await page.fill("#fr-reason", "عدم استيفاء شروط السلامة");
  await page.screenshot({ path: "demo-screens/8-facility-filled.png", fullPage: true });
  await page.click("text=Capture signature");
  await page.fill('input[placeholder="Full name"]', "منى العتيبي");
  await drawSignature(page);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.click('#new-facility-report button.btn-primary');
  await expect(page.locator("text=Facility report logged.")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: "demo-screens/9-facility-success.png", fullPage: true });
});
