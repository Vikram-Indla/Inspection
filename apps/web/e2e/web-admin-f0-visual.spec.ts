import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-ADMIN-PHASE1-PLAN-001-F0 · WA-F0-AC-003..004 · WA-F0-EV-003
const evidenceDir = process.env.F0_EVIDENCE_DIR;
const designBaseUrl = process.env.F0_DESIGN_BASE_URL;

test("captures the supplied F0 references at their declared viewports", async ({ page }) => {
  test.skip(!evidenceDir || !designBaseUrl, "External F0 evidence paths are required");
  fs.mkdirSync(evidenceDir!, { recursive: true });
  for (const reference of [
    { file: "SAQEEL Design System.dc.html", marker: "Inspection Design System", viewport: { width: 1440, height: 900 }, output: "reference-design-system-1440x900.png" },
    { file: "SAQEEL States System.dc.html", marker: "States & localization system", viewport: { width: 1200, height: 820 }, output: "reference-states-system-1200x820.png" },
  ]) {
    await page.setViewportSize(reference.viewport);
    const response = await page.goto(`${designBaseUrl}/${encodeURIComponent(reference.file)}`);
    expect(response?.ok(), `${reference.file} must load from the external evidence server`).toBeTruthy();
    await page.waitForLoadState("load");
    await expect(page.getByText(reference.marker, { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: path.join(evidenceDir!, reference.output), fullPage: false });
  }
});

test("captures the guarded implementation matrix without overflow", async ({ page }) => {
  test.skip(!evidenceDir, "External F0 evidence path is required");
  fs.mkdirSync(evidenceDir!, { recursive: true });
  const matrix = [
    { width: 1440, height: 900, theme: "Light", dir: "EN · LTR", state: "empty", output: "implementation-en-light-1440x900.png" },
    { width: 1200, height: 820, theme: "Dark", dir: "AR · RTL", state: "error", output: "implementation-ar-dark-1200x820.png" },
    { width: 1024, height: 768, theme: "Dark", dir: "EN · LTR", state: "provider-unavailable", output: "implementation-en-dark-1024x768.png" },
    { width: 412, height: 915, theme: "Light", dir: "AR · RTL", state: "rls-denied", output: "implementation-ar-light-412x915.png" },
    { width: 390, height: 844, theme: "Dark", dir: "AR · RTL", state: "not-yet", output: "implementation-ar-dark-390x844.png" },
    { width: 320, height: 800, theme: "Light", dir: "EN · LTR", state: "conflict", output: "implementation-en-light-320x800.png" },
  ] as const;
  for (const item of matrix) {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto("/reference/web-admin/f0");
    await page.getByRole("button", { name: item.theme }).click();
    await page.getByRole("button", { name: item.dir }).click();
    await page.getByLabel("State", { exact: true }).selectOption(item.state);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${item.width}px must not overflow`).toBeLessThanOrEqual(0);
    await page.screenshot({ path: path.join(evidenceDir!, item.output), fullPage: false });
  }
});
