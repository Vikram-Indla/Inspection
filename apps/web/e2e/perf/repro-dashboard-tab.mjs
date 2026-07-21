import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = "http://127.0.0.1:3100";
const state = JSON.parse(readFileSync("playwright/.auth/ops.json", "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ storageState: state });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));
page.on("requestfailed", (r) => console.log("[requestfailed]", r.url().slice(0, 140), r.failure()?.errorText));
page.on("response", (r) => { if (r.url().includes("_rsc") || r.url().includes("view=operational")) console.log("[response]", r.status(), r.url().slice(0, 160)); });

await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor({ timeout: 30000 });
console.log("loaded:", page.url());

const tab = page.getByRole("tab", { name: "Operational View" });
console.log("tab href:", await tab.getAttribute("href"));
await tab.click();
await page.waitForTimeout(8000);
console.log("after click:", page.url());
await browser.close();
