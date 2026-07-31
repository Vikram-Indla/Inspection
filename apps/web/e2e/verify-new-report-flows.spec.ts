import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

// Jira INSP-558/573/578/583 — real functional verification, not just
// TypeScript/static assertions. Logs in as the inspector persona, submits
// each new report form, and asserts the success state actually renders
// (tests.md: "A screenshot alone is not functional evidence").
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

async function confirmSignature(page: import("@playwright/test").Page) {
  await page.fill('input[placeholder="Full name"]', "E2E Verifier");
  await drawSignature(page);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
}

test.describe("INSP-558 Summons Notice — real submit", () => {
  test("form renders, signature captures, submit succeeds", async ({ page }) => {
    await page.goto("/field/summons-notices");
    await expect(page.locator("#new-summons-notice")).toBeVisible();
    await page.fill("#sn-subject", "E2E verification subject");
    await page.fill("#sn-reason", "E2E verification reason");
    await page.click("text=Capture signature");
    await confirmSignature(page);
    await expect(page.locator("text=Signed")).toBeVisible();
    await page.click('#new-summons-notice button[type="submit"], #new-summons-notice button.btn-primary');
    await expect(page.locator("text=Summons notice issued.")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("INSP-573 Sample Collection Report — real submit", () => {
  test("form renders, signature captures, submit succeeds", async ({ page }) => {
    await page.goto("/field/sample-collection-reports");
    await expect(page.locator("#new-sample-collection-report")).toBeVisible();
    await page.fill("#scr-collector", "E2E Collector");
    await page.fill("#scr-lab", "E2E Lab");
    await page.click("text=Capture signature");
    await confirmSignature(page);
    await expect(page.locator("text=Signed")).toBeVisible();
    await page.click('#new-sample-collection-report button.btn-primary');
    await expect(page.locator("text=Sample collection report logged.")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("INSP-578 Non-Compliant Destruction Report — real submit", () => {
  test("required report number enforced, then submit succeeds", async ({ page }) => {
    await page.goto("/field/destruction-reports");
    await expect(page.locator("#new-destruction-report")).toBeVisible();
    // required-field guard: submitting empty must not silently succeed
    await page.click('#new-destruction-report button.btn-primary');
    await expect(page.locator("text=Destruction report logged.")).not.toBeVisible();
    await page.fill("#dr-report-number", "E2E-DESTRUCTION-001");
    await page.click("text=Capture signature");
    await confirmSignature(page);
    await page.click('#new-destruction-report button.btn-primary');
    await expect(page.locator("text=Destruction report logged.")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("INSP-583 Facility Report — real submit", () => {
  test("facility action radio + signature, submit succeeds", async ({ page }) => {
    await page.goto("/field/facility-reports");
    await expect(page.locator("#new-facility-report")).toBeVisible();
    await page.locator('label').filter({ has: page.locator('input[name="facility_action"][value="close"]') }).click();
    await page.fill("#fr-reason", "E2E verification reason");
    await page.click("text=Capture signature");
    await confirmSignature(page);
    await page.click('#new-facility-report button.btn-primary');
    await expect(page.locator("text=Facility report logged.")).toBeVisible({ timeout: 10_000 });
  });
});
