#!/usr/bin/env node
// DEC-028 follow-up: produce a real many-violations + long-note print fixture
// through the ACTUAL canonical submit path — not a raw insert into
// submission_versions. Two phases:
//   1. Seed a new namespaced, idempotent in_progress inspection (same
//      RLS-respecting, anon-key + real-persona pattern as
//      scripts/seed-dashboard-kpis.mjs — never a service key, never invents
//      a violation code/package/legal value).
//   2. Drive apps/web/src/app/field/inspection/[id]/Workspace.tsx's real UI
//      via Playwright as the inspector persona: answer 2 items non_compliant
//      (real violation codes V-FS-09/V-FS-01, both already in the seeded
//      catalogue), attach the mandatory evidence photo + blocking
//      corrective-action form each requires, add a long note, sign, submit.
//      The snapshot/violations/version-number are computed by the app's own
//      client code (Workspace.tsx), not guessed by this script — this IS
//      the canonical transition, just automated instead of tapped by hand.
// Run: BASE_URL=http://127.0.0.1:3002 node scripts/seed-and-submit-print-fixture.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";

function loadEnvLocal() {
  const path = join(import.meta.dirname, "..", ".env.local");
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const env = loadEnvLocal();
const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const INSPECTOR = { email: "inspector@mim.gov.sa", password: "MimField!2026" };
const PLANNER = { email: "planner@mim.gov.sa", password: "MimPlan!2026" };

async function login(actor) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify(actor),
  });
  if (!res.ok) throw new Error(`auth failed for ${actor.email}: ${res.status}`);
  const j = await res.json();
  return { jwt: j.access_token, userId: j.user.id };
}

async function rest(method, path, jwt, body, prefer = "return=representation") {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${raw.slice(0, 300)}`);
  return raw ? JSON.parse(raw) : null;
}

async function insertMissing(table, rows, jwt) {
  const ids = rows.map(r => r.id);
  const existing = await rest("GET", `${table}?select=id&id=in.(${ids.join(",")})`, jwt);
  const found = new Set(existing.map(r => r.id));
  const missing = rows.filter(r => !found.has(r.id));
  if (missing.length) await rest("POST", table, jwt, missing);
  return missing.length;
}

const PKG_VERSION_ID = "4fc1f6ef-851b-420b-a240-9121753a2ffa"; // real, existing PKG-FS v2026.09 (8 items, richest real package)
const INSPECTION_ID = "d9000000-0000-4000-8000-000000000001";

const inspector = await login(INSPECTOR);
const now = Date.now();
const iso = off => new Date(now + off).toISOString();

// Reuse a real, already-assigned, currently inspection-less visit instead of
// creating a new visit/assignment — a first attempt hit a real DB guard
// ("inspector window is no longer available", a uniqueness constraint on
// assignment time windows), confirming that guard works correctly. Rather
// than hunt for a truly empty window across 1000+ existing fixture
// assignments spanning centuries, this reuses real assigned capacity.
const assignments = await rest(
  "GET",
  `assignments?select=visit_id&inspector_id=eq.${inspector.userId}&limit=1000`,
  inspector.jwt,
);
const existingInspections = await rest("GET", "inspections?select=visit_id", inspector.jwt);
const withInspection = new Set(existingInspections.map(i => i.visit_id));
const freeVisitId = assignments.map(a => a.visit_id).find(id => !withInspection.has(id));
if (!freeVisitId) throw new Error("no free (inspection-less) assigned visit found for inspector");
console.log("reusing real visit:", freeVisitId);

const insertedInsp = await insertMissing("inspections", [{
  id: INSPECTION_ID, visit_id: freeVisitId, status: "in_progress",
  package_version_id: PKG_VERSION_ID, started_at: iso(-1800_000), submitted_at: null,
}], inspector.jwt);

console.log(`fixture ready — inspection ${INSPECTION_ID} (newly inserted: ${insertedInsp > 0})`);

// Phase 2: drive the real Workspace UI to submit it.
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1194, height: 834 } });
const page = await context.newPage();
page.on("console", msg => { if (msg.type() === "error" || msg.type() === "warning") console.log("[browser]", msg.type(), msg.text()); });
page.on("pageerror", err => console.log("[browser pageerror]", err.message));
page.on("requestfailed", req => console.log("[browser requestfailed]", req.url(), req.failure()?.errorText));
page.on("response", async res => {
  if (res.status() >= 400 && res.url().includes("supabase.co")) {
    const body = await res.text().catch(() => "<unreadable>");
    console.log("[browser response]", res.status(), res.url().split("?")[0], body.slice(0, 300));
  }
});

await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
await page.locator("#email").waitFor();
await page.locator("#email").fill(INSPECTOR.email);
await page.locator("#pw").fill(INSPECTOR.password);
await page.locator("form:has(#email) button.ax-btn--prominent").click();
await page.waitForURL(url => url.pathname.startsWith("/field"), { timeout: 40_000 }).catch(() => {});

await page.goto(`${BASE_URL}/field/inspection/${INSPECTION_ID}`, { waitUntil: "load", timeout: 60_000 });
await page.waitForTimeout(1000);

const LONG_NOTE = ("Extinguisher service tags were found expired across three storage bays; " +
  "corrective service was scheduled but not yet completed at the time of this visit. ").repeat(6);

// A tiny valid 1x1 PNG for the mandatory evidence-photo upload.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const tmpPng = join(import.meta.dirname, "..", ".tmp-fixture-evidence.png");
writeFileSync(tmpPng, PNG_1PX);

async function markNonCompliant(code, { note } = {}) {
  // The app's default locale is Arabic (per e2e/auth.setup.ts), so response
  // labels render as "غير مطابق" not "non-compliant" — match by response
  // order (responses: ["compliant","non_compliant","na"]) instead of text.
  const card = page.locator(".ipad-q", { hasText: code }).first();
  await card.scrollIntoViewIfNeeded();
  await card.locator("button.ax-btn--field").nth(1).click();
  await page.waitForTimeout(400); // let the answer/form/evidence-leg state settle before querying for them

  // .first() — a prior partial run may have already attached evidence,
  // which adds a second "replace" file input alongside the "add" one.
  const fileInput = card.locator('input[type="file"]').first();
  if (await fileInput.count()) {
    await fileInput.setInputFiles(tmpPng);
    // Uploading opens the ImageAnnotator modal (Wave 2's Modal component) —
    // confirm it (no drawing required to become "ready") before continuing.
    const modalConfirm = page.locator(".ax-modal-backdrop button.ax-btn--prominent").last();
    await modalConfirm.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if (await modalConfirm.count()) {
      await page.waitForTimeout(600); // let the annotator canvas finish loading the image before confirm becomes enabled
      await modalConfirm.click({ timeout: 10_000 }).catch(async () => {
        await page.keyboard.press("Escape").catch(() => {});
      });
    }
  }
  await page.waitForTimeout(300);
  if (note) {
    const noteBox = card.locator("textarea.ax-textarea").first();
    await noteBox.fill(note);
    await noteBox.blur();
    await page.waitForTimeout(150);
  }
  // Blocking corrective-action form fields, if the answer required one —
  // fill by field type (date input vs text input vs the required_correction
  // textarea) rather than by position, so DOM-order assumptions can't
  // silently skip a field.
  const form = card.locator(".ax-panel");
  if (await form.count()) {
    await form.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    const textInputs = form.locator('input.ax-input:not([type="date"])');
    const dateInputs = form.locator('input.ax-input[type="date"]');
    const corrections = form.locator("textarea.ax-textarea");
    for (let i = 0; i < await textInputs.count(); i++) {
      await textInputs.nth(i).fill("DEC-028 Fixture Owner");
      await textInputs.nth(i).blur();
    }
    for (let i = 0; i < await dateInputs.count(); i++) {
      await dateInputs.nth(i).fill(new Date(now + 7 * 86_400_000).toISOString().slice(0, 10));
      await dateInputs.nth(i).blur();
    }
    for (let i = 0; i < await corrections.count(); i++) {
      await corrections.nth(i).fill("Service and re-tag all fire extinguishers; verify with photo evidence.");
      await corrections.nth(i).blur();
    }
    await page.waitForTimeout(300);
  }
}

// Answer every visible item "compliant" first (button index 0) so no item
// is left unanswered — a real inspector completes the whole checklist, and
// this also avoids any stray blocking form/unanswered-item state on items
// this fixture doesn't care about (e.g. the F360 runtime-verification
// section). Date-only items (no response buttons) are left alone.
const allCards = page.locator(".ipad-q");
const cardCount = await allCards.count();
console.log(`answering ${cardCount} visible items compliant by default`);
for (let i = 0; i < cardCount; i++) {
  const c = allCards.nth(i);
  const buttons = c.locator("button.ax-btn--field");
  if (await buttons.count() > 0) {
    await c.scrollIntoViewIfNeeded();
    await buttons.first().click();
    await page.waitForTimeout(100);
  }
}
await page.waitForTimeout(300);

await markNonCompliant("FS-101", { note: LONG_NOTE });
await markNonCompliant("EG-201");

// FS-102 has no violation mapping and no mandatory evidence — a safe third
// non_compliant answer to diversify the fixture without extra requirements.
const fs102 = page.locator(".ipad-q", { hasText: "FS-102" }).first();
await fs102.scrollIntoViewIfNeeded();
await fs102.locator("button.ax-btn--field").nth(1).click();
await page.waitForTimeout(300);

// Debug: dump every ax-panel's field values before submitting.
const panels = page.locator(".ax-panel");
const panelCount = await panels.count();
console.log(`.ax-panel count: ${panelCount}`);
for (let p = 0; p < panelCount; p++) {
  const panel = panels.nth(p);
  const title = await panel.locator("strong").first().innerText().catch(() => "?");
  const fields = panel.locator("input.ax-input, textarea.ax-textarea");
  const fc = await fields.count();
  const vals = [];
  for (let i = 0; i < fc; i++) vals.push(await fields.nth(i).inputValue().catch(() => "<err>"));
  console.log(`panel[${p}] "${title}":`, JSON.stringify(vals));
  if (fc === 0) console.log(`  panel[${p}] outerHTML:`, (await panel.innerHTML()).slice(0, 400));
}

await page.waitForTimeout(500);

// Submit button: `.ax-btn--prominent.ax-btn--field` (unique combo; the
// signature-confirm button below is --prominent but not --field). It stays
// clickable while aria-disabled (per the code's own comment: "submit stays
// clickable so refusal + grouped blockers surface on tap") — Playwright
// treats aria-disabled as non-actionable, so force the click to match real
// tap behavior, then read back what's still blocking if anything is.
const submitBtn = page.locator("button.ax-btn--prominent.ax-btn--field").last();
await submitBtn.scrollIntoViewIfNeeded();
await submitBtn.click({ force: true });
await page.waitForTimeout(800);
const validationPanel = page.locator(".ax-validation");
if (await validationPanel.count()) {
  console.log("VALIDATION BLOCKED:", (await validationPanel.innerText()).replace(/\n+/g, " | "));
} else {
  console.log("no .ax-validation panel present — submit was not blocked by readiness check");
}

// Signature pad: type a name, draw a stroke, confirm.
const nameInput = page.locator('input.ax-input[placeholder]').last();
if (await nameInput.count()) {
  await nameInput.waitFor({ state: "visible", timeout: 10_000 });
  await nameInput.fill("DEC-028 Fixture Inspector");
  const canvas = page.locator(".ax-modal-backdrop canvas").last();
  await canvas.waitFor({ state: "visible", timeout: 10_000 });
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 60);
    await page.mouse.move(box.x + 200, box.y + 20);
    await page.mouse.up();
  }
  await page.waitForTimeout(300);
  console.log("clicking signature confirm...");
  await page.locator(".ax-modal-backdrop button.ax-btn--prominent:not(.ax-btn--field)").last().click({ force: true });
  console.log("signature confirm clicked");
} else {
  console.log("signature name input not found — submit may have been blocked (readiness/blockers)");
}

await page.waitForTimeout(4000);
const bodyText = await page.locator("body").innerText();
console.log("post-submit page contains 'submitted'/'immutable':", /submitted|immutable/i.test(bodyText));

await context.close();
await browser.close();

// Verify against the DB directly.
const check = await rest("GET", `submission_versions?select=id,version_number,snapshot&inspection_id=eq.${INSPECTION_ID}`, inspector.jwt);
console.log(`submission_versions for ${INSPECTION_ID}:`, check.length);
for (const s of check) {
  console.log(`  v${s.version_number}: violations=${s.snapshot?.violations?.length ?? 0} notes=${Object.keys(s.snapshot?.notes ?? {}).length}`);
}
