import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = "/Users/vikramindla/Saqeel - Mobile";
const BASE = "http://127.0.0.1:3000";
const EMAIL = "inspector@mim.gov.sa";
const PASSWORD = "MimField!2026";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);

  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(500);
  const inputs = page.locator('input[type="email"], input[type="text"], input[type="password"]');
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASSWORD);
  await page.locator("button").filter({ hasText: /sign in|تسجيل الدخول/i }).first().click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE}/field/incident-reports`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "10-field-incident-reports.png") });
  console.log("saved 10-field-incident-reports.png");

  await page.goto(`${BASE}/field/settings`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "11-field-settings.png") });
  console.log("saved 11-field-settings.png");

  // Bonus: dark theme dashboard for the reconciliation set
  await page.goto(`${BASE}/field`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, "12-field-dashboard-check.png") });
  console.log("saved 12-field-dashboard-check.png");

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
