import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { PERSONAS } from "./personas";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";

const outputDir = resolve(process.env.PERF_EVIDENCE_DIR ?? "test-results/performance-evidence");

test("PERF-G11-002 captures responsive and theme evidence", async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(outputDir, { recursive: true });
  const ops = PERSONAS.ops;
  if (process.env.PERF_AUTH_STATE) {
    await page.goto(ops.home);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 40_000 });
  } else {
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(ops.email);
    await passwordField(page).fill(ops.password);
    await submitCredentials(page);
    await page.waitForURL(
      url => url.pathname.replace(/^\/(en|ar)(?=\/|$)/, "").startsWith(ops.home),
      { timeout: 40_000 },
    );
  }
  await page.goto("/locale?set=en");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.setItem("saqeel-theme", "dark"));
  await page.goto("/dashboard");
  await expect(page.locator("h2#dashboard-role-summary")).toBeVisible({ timeout: 40_000 });
  await page.screenshot({ path: resolve(outputDir, "after-dashboard-dark-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 1180, height: 820 });
  await page.evaluate(() => localStorage.setItem("saqeel-theme", "light"));
  await page.goto("/factories");
  await expect(page.getByRole("heading", { name: "Factory snapshot" })).toBeVisible({ timeout: 40_000 });
  await page.screenshot({ path: resolve(outputDir, "after-factories-light-ipad-landscape.png"), fullPage: true });

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/reviews");
  await expect(page.getByRole("heading", { name: "Inspection review queue" }).first()).toBeVisible({ timeout: 40_000 });
  await page.screenshot({ path: resolve(outputDir, "after-reviews-light-ipad-portrait.png"), fullPage: true });

});
