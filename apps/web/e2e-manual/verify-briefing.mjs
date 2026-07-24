import { chromium } from "@playwright/test";

const OUT = "/Users/vikramindla/Saqeel - Mobile/fix-verification";
const BASE = "http://127.0.0.1:3000";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 834, height: 1194 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
page.on("console", (msg) => { if (msg.type() === "error") console.log("[console error]", msg.text()); });

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log("saved", name);
}

console.log("--- login ---");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "inspector@mim.gov.sa");
await page.fill("#pw", "MimField!2026");
await Promise.all([
  page.waitForURL(/\/field/, { timeout: 20000 }),
  page.click("button[type=submit]"),
]);
console.log("logged in, url=", page.url());

await page.goto(`${BASE}/field`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

console.log("--- check briefing panel present without click ---");
const panel = page.locator('[data-testid="inspector-daily-briefing-panel"]');
await panel.waitFor({ state: "visible", timeout: 15000 });
const bodyText = await panel.innerText();
console.log("briefing panel text (daily):\n", bodyText);

await shot("13-briefing-auto-daily-fullpage.png");
await panel.scrollIntoViewIfNeeded();
await panel.screenshot({ path: `${OUT}/13-briefing-auto-daily.png` });
console.log("saved zoomed daily briefing card");

console.log("--- toggle to weekly ---");
const weeklyBtn = page.locator('.ax-segmented button', { hasText: /weekly/i }).first();
await weeklyBtn.click();
await page.waitForTimeout(800);
const weeklyText = await panel.innerText();
console.log("briefing panel text (weekly):\n", weeklyText);
await shot("14-briefing-weekly-toggle-fullpage.png");
await panel.screenshot({ path: `${OUT}/14-briefing-weekly-toggle.png` });

// KPI strip screenshot in weekly mode
const kpiStrip = page.locator('div').filter({ hasText: "This week's visits" }).first();
await shot("15-kpi-weekly-fullpage.png");

console.log("--- toggle back to daily ---");
const dailyBtn = page.locator('.ax-segmented button', { hasText: /daily/i }).first();
await dailyBtn.click();
await page.waitForTimeout(800);
const backToDaily = await panel.innerText();
console.log("briefing panel text (back to daily):\n", backToDaily);

console.log("--- reload, check cache (no regeneration) ---");
const before = await panel.innerText();
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const panel2 = page.locator('[data-testid="inspector-daily-briefing-panel"]');
await panel2.waitFor({ state: "visible", timeout: 15000 });
const after = await panel2.innerText();
console.log("MATCH after reload:", before.trim() === after.trim());
console.log("before:\n", before);
console.log("after:\n", after);

await browser.close();
