#!/usr/bin/env node
// One-off authenticated screenshot capture for Saqeel V5.1 evidence
// (docs/design-system-v5/*). Not a test — a standalone script using the
// seeded e2e personas (e2e/personas.ts) against a real running dev server.
// Run: BASE_URL=http://127.0.0.1:3002 node scripts/capture-v5-evidence.mjs
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";
const OUT_DIR = join(import.meta.dirname, "..", "..", "..", "docs", "design-system-v5", "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

// Standalone script — not run through Next's env loader — so read .env.local directly.
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

const PERSONAS = {
  admin: { email: "admin@mim.gov.sa", password: "MimAdmin!2026", home: "/admin" },
  ops: { email: "ops@mim.gov.sa", password: "MimOps!2026", home: "/dashboard" },
  planner: { email: "planner@mim.gov.sa", password: "MimPlan!2026", home: "/planning" },
  inspector: { email: "inspector@mim.gov.sa", password: "MimField!2026", home: "/field" },
  reviewer: { email: "reviewer@mim.gov.sa", password: "MimRev!2026", home: "/reviews" },
};

async function login(page, persona) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").waitFor();
  await page.locator("#email").fill(persona.email);
  await page.locator("#pw").fill(persona.password);
  await page.locator("form:has(#email) button.sq-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(persona.home), { timeout: 40_000 }).catch(() => {});
}

async function shot(page, name, path, opts = {}) {
  try {
    // "networkidle" never resolves on pages with live polling (e.g.
    // /operations auto-refreshing monitoring) — "load" is enough since we
    // add an explicit settle delay after.
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 25_000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: opts.fullPage ?? true });
    console.log(`ok   ${name}  (${path})`);
    return true;
  } catch (e) {
    console.log(`FAIL ${name}  (${path})  ${e.message.split("\n")[0]}`);
    return false;
  }
}

const browser = await chromium.launch();
let okCount = 0, total = 0;

async function run(persona, jobs, viewport, extraSetup) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (extraSetup) await extraSetup(page);
  await login(page, PERSONAS[persona]);
  for (const [name, path, opts] of jobs) {
    total++;
    if (await shot(page, name, path, opts)) okCount++;
  }
  await context.close();
}

// Desktop, light mode, English
await run("admin", [
  ["01-shell-desktop-admin-light", "/admin"],
  ["02-admin-violations", "/admin/violations"],
  ["03-admin-regulations", "/admin/regulations"],
  ["04-admin-packages", "/admin/packages"],
], { width: 1440, height: 900 });

await run("ops", [
  ["05-dashboard-light", "/dashboard"],
  ["06-operations", "/operations"],
  ["07-visits-workload", "/visits/workload"],
], { width: 1440, height: 900 });

await run("planner", [
  ["08-planning-home", "/planning"],
  ["09-planning-bulk", "/planning/bulk"],
], { width: 1440, height: 900 });

await run("reviewer", [
  ["10-reviews-queue", "/reviews"],
], { width: 1440, height: 900 });

// iPad viewport (landscape + portrait), inspector persona
await run("inspector", [
  ["11-field-home-ipad-landscape", "/field"],
], { width: 1194, height: 834 });
await run("inspector", [
  ["12-field-home-ipad-portrait", "/field"],
], { width: 834, height: 1194 });

// Dark mode — the app reads localStorage("saqeel-theme"), not a cookie
// (see components/ThemeScript.tsx) — set it via an init script so it's
// present before the theme-init script runs on first paint.
await run("ops", [
  ["13-dashboard-dark", "/dashboard"],
], { width: 1440, height: 900 }, async page => {
  await page.addInitScript(() => { try { localStorage.setItem("saqeel-theme", "dark"); } catch { /* noop */ } });
});

// Arabic / RTL — toggle via locale cookie the app already reads
await run("ops", [
  ["14-dashboard-arabic-rtl", "/dashboard"],
], { width: 1440, height: 900 }, async page => {
  await page.context().addCookies([{ name: "locale", value: "ar", url: BASE_URL }]);
});

// 400% zoom equivalent (320 CSS px)
await run("ops", [
  ["15-dashboard-320px", "/dashboard"],
], { width: 320, height: 900 });

// Intermediate desktop breakpoints (the master prompt's minimum list names
// 1440/1280/1024/tablet/mobile — 1440 and 320 were already covered above).
await run("ops", [
  ["17-dashboard-1280", "/dashboard"],
], { width: 1280, height: 900 });
await run("ops", [
  ["18-dashboard-1024-tablet", "/dashboard"],
], { width: 1024, height: 900 });

// Print preview — find a real submitted inspection directly via Supabase
// (RLS-scoped as the ops role, which the seeded data grants broad read
// access to) rather than relying on the reviewer's own /reviews queue,
// which only lists inspections still awaiting THAT reviewer's decision.
{
  let reportId = null;
  try {
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error: authErr } = await sb.auth.signInWithPassword({ email: PERSONAS.ops.email, password: PERSONAS.ops.password });
    if (authErr) throw authErr;
    const { data, error } = await sb.from("submission_versions").select("inspection_id").limit(1).order("submitted_at", { ascending: false });
    if (error) throw error;
    reportId = data?.[0]?.inspection_id ?? null;
  } catch (e) {
    console.log(`(print-preview lookup failed: ${e.message ?? e})`);
  }
  if (reportId) {
    const context = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
    const page = await context.newPage();
    await login(page, PERSONAS.ops);
    await page.emulateMedia({ media: "print" });
    total++;
    if (await shot(page, "16-report-print-preview", `/reports/inspection/${reportId}`)) okCount++;
    await context.close();
  } else {
    console.log("skip 16-report-print-preview  (no submitted inspection found in submission_versions)");
  }
}

await browser.close();
console.log(`\n${okCount}/${total} screenshots captured to ${OUT_DIR}`);
process.exit(okCount === total ? 0 : 1);
