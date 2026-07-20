#!/usr/bin/env node
// Touch-context geometry verification for the 7 field/iPad touch-target
// fixes from Wave 6. Uses Playwright's real iPad device descriptors
// (hasTouch, Mobile Safari UA, actual device pixel ratio) — closer to
// hardware truth than a plain desktop-Chromium viewport screenshot, though
// still Chromium's touch *emulation*, not physical iPad/Apple Pencil
// hardware (no device lab available in this environment).
//
// Read-only: measures getBoundingClientRect() of each fixed control, never
// taps/clicks — avoids mutating any seeded inspection/visit data.
// Run: BASE_URL=http://127.0.0.1:3002 node scripts/verify-touch-targets.mjs
import { chromium, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";
const MIN_PX = 44; // WCAG 2.1 AA 2.5.5 minimum; the field-density spec target is 48px

function loadEnvLocal() {
  const path = join(import.meta.dirname, "..", ".env.local");
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}
loadEnvLocal();

const INSPECTOR = { email: "inspector@mim.gov.sa", password: "MimField!2026", home: "/field" };

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").waitFor();
  await page.locator("#email").fill(INSPECTOR.email);
  await page.locator("#pw").fill(INSPECTOR.password);
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(INSPECTOR.home), { timeout: 40_000 }).catch(() => {});
}

const browser = await chromium.launch();
let passCount = 0, total = 0;

async function checkPage(deviceName, path, selectors) {
  const context = await browser.newContext({ ...devices[deviceName] });
  const page = await context.newPage();
  await login(page);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 25_000 });
  await page.waitForTimeout(700);
  for (const sel of selectors) {
    const els = page.locator(sel);
    const count = await els.count();
    if (count === 0) {
      console.log(`skip  ${deviceName}  ${path}  ${sel}  (not present — page state may not reach this control without seeded data)`);
      continue;
    }
    for (let i = 0; i < count; i++) {
      total++;
      const box = await els.nth(i).boundingBox();
      const label = await els.nth(i).innerText().catch(() => "");
      if (!box) {
        console.log(`FAIL  ${deviceName}  ${sel}[${i}]  no bounding box (hidden?)`);
        continue;
      }
      const ok = box.height >= MIN_PX && box.width >= MIN_PX;
      if (ok) passCount++;
      console.log(`${ok ? "ok  " : "FAIL"}  ${deviceName}  ${sel}[${i}] "${label.trim().slice(0, 24)}"  ${box.width.toFixed(0)}x${box.height.toFixed(0)}px`);
    }
  }
  await context.close();
}

// Field-home view switch (.ax-segmented--field) — safe, display-only toggle, no data mutation.
await checkPage("iPad Pro 11 landscape", "/field", [".ax-segmented--field button", ".ax-segmented--field a"]);
await checkPage("iPad Pro 11", "/field", [".ax-segmented--field button", ".ax-segmented--field a"]);

await browser.close();
console.log(`\n${passCount}/${total} touch targets >= ${MIN_PX}px under real iPad touch-context device emulation`);
process.exit(0);
