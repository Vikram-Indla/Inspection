/** TEMPORARY BS-1 anchor dump. Records which links each candidate seed page
 * actually renders, so route discovery is mapped from observation. */
import { test } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "../login-helper";
import { loadPixelCredentials } from "./credentials";

const WEB_ROOT = resolve(__dirname, "../..");
const OUT = process.env.PIXEL_ANCHORS_OUT ?? "/tmp/bs1-anchors.json";

test.setTimeout(30 * 60_000);

test("BS-1 anchor dump", async ({ browser }) => {
  const credentials = loadPixelCredentials(WEB_ROOT);
  const context = await browser.newContext({ viewport: { width: 834, height: 1024 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await waitForCredentialsForm(page);
  await identifierField(page).fill(credentials.email);
  await passwordField(page).fill(credentials.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.startsWith("/field"), { timeout: 90_000, waitUntil: "commit" });

  const seeds = ["/field/drafts", "/field/notifications", "/field/reports", "/field/virtual", "/field/my-tasks", "/field/establishments"];
  const out: Record<string, { anchors: string[]; text: string }> = {};
  for (const seed of seeds) {
    try {
      await page.goto(seed, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);
      const anchors = await page.locator("a[href]").evaluateAll(list =>
        [...new Set(list.map(a => a.getAttribute("href")).filter((h): h is string => Boolean(h)))]);
      const text = await page.locator("body").innerText().catch(() => "");
      out[seed] = { anchors, text: text.replace(/\s+/g, " ").slice(0, 400) };
    } catch (error) {
      out[seed] = { anchors: [], text: `ERROR ${error instanceof Error ? error.message.split("\n")[0] : String(error)}` };
    }
    console.log(`SEED ${seed}: ${out[seed].anchors.length} anchors`);
  }

  // Follow the first visit link to see what the visit page offers.
  const visit = (out["/field/my-tasks"]?.anchors ?? [])
    .map(h => { try { return new URL(h, "http://127.0.0.1:3000").pathname; } catch { return ""; } })
    .find(p => /^\/field\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(p));
  if (visit) {
    await page.goto(visit, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const anchors = await page.locator("a[href]").evaluateAll(list =>
      [...new Set(list.map(a => a.getAttribute("href")).filter((h): h is string => Boolean(h)))]);
    const text = await page.locator("body").innerText().catch(() => "");
    out[visit] = { anchors, text: text.replace(/\s+/g, " ").slice(0, 400) };
    console.log(`SEED ${visit}: ${anchors.length} anchors`);

    // And whether the documented travel suffix renders.
    const travel = `${visit}/travel`;
    try {
      const response = await page.goto(travel, { waitUntil: "domcontentloaded" });
      const text2 = await page.locator("body").innerText().catch(() => "");
      out[travel] = { anchors: [`status=${response?.status()}`, `final=${new URL(page.url()).pathname}`], text: text2.replace(/\s+/g, " ").slice(0, 300) };
    } catch (error) {
      out[travel] = { anchors: [], text: `ERROR ${error instanceof Error ? error.message.split("\n")[0] : String(error)}` };
    }
  }
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  await context.close();
});
