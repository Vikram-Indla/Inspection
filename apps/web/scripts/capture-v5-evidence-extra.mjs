#!/usr/bin/env node
// Additional authenticated screenshots to satisfy CURRENT_SLICE.SAQEEL-V5-IMPLEMENTATION.yaml's
// required_evidence: "At least 25 implementation screenshots" (21 existed before this run).
// Same approach as capture-v5-evidence.mjs: real running dev server, real seeded personas.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";
const OUT_DIR = join(import.meta.dirname, "..", "..", "..", "docs", "design-system-v5", "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const PERSONAS = {
  ops: { email: "ops@mim.gov.sa", password: "MimOps!2026", home: "/dashboard" },
  planner: { email: "planner@mim.gov.sa", password: "MimPlan!2026", home: "/planning" },
};

async function login(page, persona) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").waitFor();
  await page.locator("#email").fill(persona.email);
  await page.locator("#pw").fill(persona.password);
  await page.locator("form:has(#email) button.sq-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(persona.home), { timeout: 40_000 }).catch(() => {});
}

async function shot(page, name, path) {
  try {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 25_000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: true });
    console.log(`ok   ${name}  (${path})`);
    return true;
  } catch (e) {
    console.log(`FAIL ${name}  (${path})  ${e.message.split("\n")[0]}`);
    return false;
  }
}

const browser = await chromium.launch();
let ok = 0, total = 0;

async function run(personaKey, jobs) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await login(page, PERSONAS[personaKey]);
  for (const [name, path] of jobs) {
    total++;
    if (await shot(page, name, path)) ok++;
  }
  await context.close();
}

await run("ops", [
  ["21-factories-list", "/factories"],
  ["22-visits-list", "/visits"],
  ["23-tasks", "/tasks"],
  ["24-cases", "/cases"],
]);
await run("planner", [
  ["25-visits-calendar", "/visits/calendar"],
]);

await browser.close();
console.log(`\n${ok}/${total} additional screenshots captured to ${OUT_DIR}`);
process.exit(ok === total ? 0 : 1);
