#!/usr/bin/env node
// Print-fixture evidence using REAL, already-seeded edge cases — no new
// data is written. Found by querying submission_versions directly:
// a missing-signature acknowledgement and a multi-version inspection both
// already exist in the seeded dataset, so no synthetic fixture is needed
// for those two cases. (See PRINT-RESULTS.md for why the remaining fixture
// types — many-violations, long-notes, 1/20/100/300-item packages — are
// not synthesized: it would require either a raw insert into the immutable
// submission_versions table, which CLAUDE.md's "never mutate workflow
// status directly" / "never edit an immutable submitted version" rules
// forbid, or a new governed checklist-package catalogue entry, outside
// this change control's design-system scope.)
import { chromium } from "@playwright/test";
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

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").waitFor();
  await page.locator("#email").fill(OPS.email);
  await page.locator("#pw").fill(OPS.password);
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(OPS.home), { timeout: 40_000 }).catch(() => {});
}

async function findFixtures() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error } = await sb.auth.signInWithPassword({ email: OPS.email, password: OPS.password });
  if (error) throw error;

  const { data: subs, error: e1 } = await sb.from("submission_versions").select("inspection_id, version_number, acknowledgement").limit(500);
  if (e1) throw e1;
  const noSig = subs.find(s => !s.acknowledgement?.signature_data_url);

  const counts = {};
  for (const s of subs) counts[s.inspection_id] = (counts[s.inspection_id] ?? 0) + 1;
  const multiId = Object.entries(counts).find(([, n]) => n >= 2)?.[0];

  return { missingSignatureId: noSig?.inspection_id ?? null, multiVersionId: multiId ?? null };
}

const { missingSignatureId, multiVersionId } = await findFixtures();
console.log("missing-signature inspection:", missingSignatureId);
console.log("multiple-versions inspection:", multiVersionId);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
const page = await context.newPage();
await login(page);
await page.emulateMedia({ media: "print" });

async function shot(id, name) {
  if (!id) { console.log(`skip ${name} — no matching real inspection found`); return; }
  await page.goto(`${BASE_URL}/reports/inspection/${id}`, { waitUntil: "load", timeout: 25_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: true });
  console.log(`ok   ${name}  (${id})`);
}

await shot(missingSignatureId, "19-report-print-missing-signature");
await shot(multiVersionId, "20-report-print-multiple-versions");

await context.close();
await browser.close();
