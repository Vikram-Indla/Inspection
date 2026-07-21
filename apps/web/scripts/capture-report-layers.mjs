#!/usr/bin/env node
// Standalone re-capture of the official report's print preview after the
// 5-layer content-model grouping (Wave 8 follow-up). Reuses the same
// login/lookup approach as capture-v5-evidence.mjs's screenshot 16.
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";
const OUT_DIR = join(import.meta.dirname, "..", "..", "..", "docs", "design-system-v5", "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

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

const OPS = { email: "ops@mim.gov.sa", password: "MimOps!2026", home: "/dashboard" };

async function login(page, persona) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").waitFor();
  await page.locator("#email").fill(persona.email);
  await page.locator("#pw").fill(persona.password);
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(persona.home), { timeout: 40_000 }).catch(() => {});
}

const browser = await chromium.launch();
let reportId = null;
try {
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error: authErr } = await sb.auth.signInWithPassword({ email: OPS.email, password: OPS.password });
  if (authErr) throw authErr;
  const { data, error } = await sb.from("submission_versions").select("inspection_id").limit(1).order("submitted_at", { ascending: false });
  if (error) throw error;
  reportId = data?.[0]?.inspection_id ?? null;
} catch (e) {
  console.log(`(lookup failed: ${e.message ?? e})`);
}

if (!reportId) {
  console.log("no submitted inspection found — cannot capture");
  await browser.close();
  process.exit(1);
}

const context = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
const page = await context.newPage();
await login(page, OPS);

// Screen (light) view first — shows the 5 layer headings on-screen.
await page.goto(`${BASE_URL}/reports/inspection/${reportId}`, { waitUntil: "load", timeout: 25_000 });
await page.waitForTimeout(700);
await page.screenshot({ path: join(OUT_DIR, "16a-report-screen-layers.png"), fullPage: true });
console.log("ok   16a-report-screen-layers");

// Print-media emulated — the official PDF path.
await page.emulateMedia({ media: "print" });
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT_DIR, "16-report-print-preview.png"), fullPage: true });
console.log("ok   16-report-print-preview (re-captured)");

await context.close();
await browser.close();
