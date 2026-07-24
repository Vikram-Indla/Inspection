// Manual QA screenshot walk — NOT part of the test suite. Walks the field
// channel golden path at real iPad viewport, saving numbered screenshots for
// business/Figma reconciliation. Run with: node e2e-manual/ipad-screenshot-walk.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = "/Users/vikramindla/Saqeel - Mobile";
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:3000";
const EMAIL = "inspector@mim.gov.sa";
const PASSWORD = "MimField!2026";

let n = 0;
async function shot(page, name) {
  n += 1;
  const file = path.join(OUT, `${String(n).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function main() {
  const browser = await chromium.launch();
  // iPad Air / Pro 11" portrait, real device scale factor + touch, so CSS
  // media queries and hover/touch behavior match a real iPad, not a resized
  // desktop window.
  const context = await browser.newContext({
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  // 1. Login (default locale = Arabic, per the app's real default state)
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(800);
  await shot(page, "login-ar");

  // 1b. English variant
  await page.goto(`${BASE}/login?lang=en`).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, "login-en");

  // 2. Forgot password -> OTP request (locale/text-independent selectors)
  const emailInput = page.locator('input[type="email"], input[type="text"]').first();
  const forgotLink = page.locator("a, button").filter({ hasText: /forgot|نسيت/i }).first();
  await forgotLink.click();
  await page.waitForTimeout(400);
  await shot(page, "login-forgot-password");
  await emailInput.fill(EMAIL).catch(() => {});
  const sendCodeBtn = page.locator("button").filter({ hasText: /send|إرسال/i }).first();
  await sendCodeBtn.click();
  await page.waitForTimeout(800);
  await shot(page, "login-otp-entry");

  // 3. Real sign-in
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(500);
  const inputs = page.locator('input[type="email"], input[type="text"], input[type="password"]');
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASSWORD);
  const signInBtn = page.locator("button").filter({ hasText: /sign in|تسجيل الدخول/i }).first();
  await signInBtn.click();
  await page.waitForTimeout(2000);
  await shot(page, "post-login-landing");

  // 4. Field dashboard
  await page.goto(`${BASE}/field`);
  await page.waitForTimeout(1200);
  await shot(page, "field-dashboard");

  // 5. Field search (top-bar icon, item 1)
  const searchIcon = page.locator('[aria-label*="earch" i], [aria-label*="بحث" i]').first();
  if (await searchIcon.count().catch(() => 0)) {
    await searchIcon.click().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, "global-search-open");
  }

  // 6. Notifications (item 2)
  await page.goto(`${BASE}/field`);
  await page.waitForTimeout(800);
  const bell = page.locator('[aria-label*="otif" i], [aria-label*="إشعار" i]').first();
  if (await bell.count().catch(() => 0)) {
    await bell.click().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, "notifications-bell");
  }

  // 7. Field establishments (item 7)
  await page.goto(`${BASE}/field/establishments`);
  await page.waitForTimeout(1000);
  await shot(page, "field-establishments");

  // 8. Field incident reports (item 7)
  await page.goto(`${BASE}/field/incident-reports`);
  await page.waitForTimeout(1000);
  await shot(page, "field-incident-reports");

  // 9. Field settings + trusted devices (item 3)
  await page.goto(`${BASE}/field/settings`);
  await page.waitForTimeout(1000);
  await shot(page, "field-settings");

  await browser.close();
  console.log(`Done. ${n} screenshots saved to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
