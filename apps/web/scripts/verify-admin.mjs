// Standalone runtime verification for CD-012→019 R3 admin surfaces.
// Logs in as the admin seed account (provided for verification) through the real
// /login UI, drives each admin route, asserts the R2/R3 markers this branch adds,
// and screenshots each screen. Not part of the e2e project graph — run directly.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.VERIFY_BASE ?? "http://127.0.0.1:3300";
const OUT = process.env.VERIFY_OUT ?? "/tmp/cd12-verify";
const ADMIN = { email: "admin@mim.gov.sa", password: "MimAdmin!2026" };
mkdirSync(OUT, { recursive: true });

const CHECKS = [
  { route: "/admin/localization", name: "cd018-localization", markers: [".lz-row", 'input[name="ar"]'] },
  { route: "/admin/risk", name: "cd014-risk", markers: [".rk-driver", ".rk-sum", ".rk-band"] },
  { route: "/admin/workflows", name: "cd012-013-workflows", markers: [".ax-pagehead"] },
  { route: "/admin/audit", name: "cd019-audit", markers: [".nya"] },
  { route: "/admin/access", name: "cd017-access", markers: [".nya", ".ax-table"] },
  { route: "/admin/gis", name: "cd015-gis", markers: [".ax-pagehead"] },
];

// Non-destructive localization save round-trip: edit a row's Arabic through the
// real UI → saveTranslation server action → DB write (RLS) → reload and confirm
// persistence + status flip to draft → restore the original value. Proves the
// mutation path end-to-end without leaving the store changed.
async function localizationRoundTrip(page) {
  const goList = async () => {
    await page.goto(`${BASE}/admin/localization`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".lz-list", { timeout: 20000 });
    await page.waitForTimeout(600);
  };
  const rowFor = key => page.locator(`.lz-row:has(.lz-key:text-is(${JSON.stringify(key)}))`).first();
  const arOf = async key => rowFor(key).locator('input[name="ar"]').inputValue();
  const saveRow = async (key, value) => {
    const r = rowFor(key);
    const inp = r.locator('input[name="ar"]');
    await inp.fill(value);
    await r.locator('form:has(input[name="ar"]) button').first().click();
    // saveTranslation revalidates the path; give the action + re-render time.
    await page.waitForTimeout(2500);
  };

  await goList();
  // Choose the first row that already has non-empty Arabic (avoids empty/missing edge).
  const count = await page.locator(".lz-row").count();
  let key = null, original = null;
  for (let i = 0; i < Math.min(count, 20); i++) {
    const r = page.locator(".lz-row").nth(i);
    const v = await r.locator('input[name="ar"]').inputValue();
    if (v && v.trim() !== "") { key = (await r.locator(".lz-key").first().innerText()).trim(); original = v; break; }
  }
  if (!key) return { ran: false, reason: "no row with existing Arabic found" };

  const testVal = original + " ✎rt";
  await saveRow(key, testVal);
  await goList();
  const persisted = await arOf(key);
  const statusText = (await rowFor(key).locator(".ax-lozenge").first().innerText().catch(() => "")).trim();

  // Restore original — leaves the store as it was.
  await saveRow(key, original);
  await goList();
  const restored = await arOf(key);

  return {
    ran: true, key,
    savedOk: persisted === testVal,
    statusAfterSave: statusText,
    restoredOk: restored === original,
    original, testVal, persisted, restored,
  };
}

const results = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

try {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").waitFor({ timeout: 15000 });
  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#pw").fill(ADMIN.password);
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
  await page.waitForURL(u => !u.pathname.startsWith("/login"), { timeout: 25000 });
  // English cookie for stable English assertions, then continue.
  const origin = new URL(page.url()).origin;
  await ctx.addCookies([{ name: "locale", value: "en", url: origin }, { name: "login_locale", value: "en", url: origin }]);
  const landed = new URL(page.url()).pathname;

  for (const c of CHECKS) {
    const before = errors.length;
    let status = 0, markerHits = {}, bodyErr = false;
    try {
      const resp = await page.goto(`${BASE}${c.route}`, { waitUntil: "networkidle", timeout: 25000 });
      status = resp?.status() ?? 0;
      const body = await page.locator("body").innerText().catch(() => "");
      bodyErr = /ERR-AUTH|Application error|Internal Server Error|Unhandled Runtime/i.test(body);
      for (const sel of c.markers) markerHits[sel] = await page.locator(sel).count();
      await page.screenshot({ path: `${OUT}/${c.name}.png`, fullPage: true });
    } catch (e) {
      bodyErr = true; markerHits.__error = String(e.message).slice(0, 120);
    }
    const newErrors = errors.slice(before);
    const allMarkersPresent = c.markers.every(s => (markerHits[s] ?? 0) > 0);
    results.push({ route: c.route, status, allMarkersPresent, markerHits, bodyErr, jsErrors: newErrors });
  }
  const roundTrip = process.env.VERIFY_ROUNDTRIP ? await localizationRoundTrip(page) : { ran: false, reason: "skipped (set VERIFY_ROUNDTRIP=1)" };
  console.log(JSON.stringify({ landed, results, roundTrip }, null, 2));
} finally {
  await browser.close();
}
