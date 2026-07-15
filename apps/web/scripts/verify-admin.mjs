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
    // Wait for the server action + revalidate to actually settle, not a fixed
    // timeout: prefer the row's "saved" success lozenge, fall back to networkidle.
    await Promise.race([
      r.locator('.ax-lozenge--success').first().waitFor({ timeout: 9000 }).catch(() => {}),
      page.waitForLoadState("networkidle").catch(() => {}),
    ]);
    await page.waitForTimeout(1200);
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

// Workflow maker-checker (RBAC-002) negative path: admin proposes a draft
// (proposeWorkflowDraft write) then is BLOCKED from approving its own draft.
// Publish is irreversible so this exercises the write + the CD-012 SoD guard
// without publishing. NOTE: leaves one identifiable DRAFT row (no delete action).
async function workflowSoDRoundTrip(page, label) {
  const goWf = async () => {
    await page.goto(`${BASE}/admin/workflows`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".ax-pagehead", { timeout: 20000 });
    await page.waitForTimeout(600);
  };
  await goWf();

  const proposeForm = page.locator('form:has(input[name="version_label"])').first();
  if (await proposeForm.count() === 0) {
    return { ran: false, reason: "no published workflow version with a propose-draft form" };
  }
  await proposeForm.locator('input[name="version_label"]').fill(label);
  await proposeForm.locator("button").first().click();
  await page.waitForTimeout(2500);
  const proposeError = (await proposeForm.locator('[role="alert"]').first().innerText().catch(() => "")).trim();

  await goWf();
  const card = page.locator(`.ax-surface:has(.ax-version:text-is(${JSON.stringify(label)}))`).first();
  const proposed = await card.count() > 0;
  let statusText = "", sodGuardShown = false, approveButtonPresent = null;
  if (proposed) {
    statusText = (await card.locator(".ax-lozenge").first().innerText().catch(() => "")).trim();
    const bodyText = await card.innerText().catch(() => "");
    sodGuardShown = /distinct checker must approve/i.test(bodyText);
    approveButtonPresent = await card.locator('button:has-text("Approve & publish")').count() > 0;
  }
  return {
    ran: true, label, proposeError: proposeError || null,
    proposed,
    statusIsDraft: /draft/i.test(statusText),
    sodGuardShown,
    selfApproveBlocked: sodGuardShown && approveButtonPresent === false,
  };
}

// Risk-weights save round-trip (reversible): perturb two factor weights keeping
// Σ = 1.00 → saveRiskSettings → engine_settings write → reload confirms persisted
// → restore the exact original weights. If RLS denies the write (the admin role
// may lack risk_owner scope), that surfaced error is itself a valid outcome and
// proves the CD-014 result-surfacing fix — reported as rlsDenied, no restore needed.
async function riskWeightsRoundTrip(page) {
  const APPROX = (a, b) => Math.abs(parseFloat(a) - parseFloat(b)) <= 0.001;
  const go = async () => {
    await page.goto(`${BASE}/admin/risk`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".rk-driver", { timeout: 20000 });
    await page.waitForTimeout(600);
  };
  const readWeights = async () => {
    const inputs = page.locator('.rk-driver input[type="number"]');
    const n = await inputs.count();
    const out = [];
    for (let i = 0; i < n; i++) out.push(await inputs.nth(i).inputValue());
    return out;
  };
  const saveAndSettle = async () => {
    const btn = page.locator('button:has-text("Save configuration")').first();
    await btn.click();
    const res = await Promise.race([
      page.locator(".ax-lozenge--success").first().waitFor({ timeout: 9000 }).then(() => "ok").catch(() => null),
      page.locator('[role="alert"]').first().waitFor({ timeout: 9000 }).then(() => "err").catch(() => null),
    ]);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
    const errText = (await page.locator('p[role="alert"]').first().innerText().catch(() => "")).trim();
    return { res, errText };
  };

  await go();
  const inputs = page.locator('.rk-driver input[type="number"]');
  const original = await readWeights();
  if (original.length < 2) return { ran: false, reason: "fewer than 2 factors" };
  const donor = original.findIndex(v => parseFloat(v) >= 0.05);
  const recv = original.findIndex((_, i) => i !== donor);
  if (donor < 0) return { ran: false, reason: "no factor >= 0.05 to move" };

  const donorNew = (parseFloat(original[donor]) - 0.05).toFixed(2);
  const recvNew = (parseFloat(original[recv]) + 0.05).toFixed(2);
  await inputs.nth(donor).fill(donorNew);
  await inputs.nth(recv).fill(recvNew);
  const save1 = await saveAndSettle();

  if (save1.res === "err" || /RLS|risk_owner|rejected/i.test(save1.errText)) {
    return { ran: true, rlsDenied: true, errorSurfaced: save1.errText || "(error lozenge shown)", original };
  }

  // Confirm persistence, then restore originals.
  await go();
  const afterSave = await readWeights();
  const savedOk = APPROX(afterSave[donor], donorNew) && APPROX(afterSave[recv], recvNew);

  for (let i = 0; i < original.length; i++) await inputs.nth(i).fill(original[i]);
  await saveAndSettle();
  await go();
  const afterRestore = await readWeights();
  const restoredOk = original.every((v, i) => APPROX(afterRestore[i], v));

  return { ran: true, rlsDenied: false, savedOk, restoredOk, original, afterSave, afterRestore };
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
  const riskRoundTrip = process.env.VERIFY_ROUNDTRIP ? await riskWeightsRoundTrip(page) : { ran: false, reason: "skipped (set VERIFY_ROUNDTRIP=1)" };
  const workflowSoD = process.env.VERIFY_WF_SOD
    ? await workflowSoDRoundTrip(page, `RT-SOD-${new Date().toISOString().replace(/[:.]/g, "-")}`)
    : { ran: false, reason: "skipped (set VERIFY_WF_SOD=1 — creates a draft row)" };
  console.log(JSON.stringify({ landed, results, roundTrip, riskRoundTrip, workflowSoD }, null, 2));
} finally {
  await browser.close();
}
