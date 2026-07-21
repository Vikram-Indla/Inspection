#!/usr/bin/env node
// One-off authenticated axe-core accessibility audit for Saqeel V5.1 evidence.
// Not a test — a standalone script against a real running dev server, using
// the seeded e2e personas (e2e/personas.ts). @axe-core/playwright is an
// existing devDependency; this is the first time it's run against these
// specific routes with real authenticated data.
// Run: BASE_URL=http://127.0.0.1:3002 node scripts/audit-v5-a11y.mjs
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3002";

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
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
  await page.waitForURL(url => url.pathname.startsWith(persona.home), { timeout: 40_000 }).catch(() => {});
}

const ROUTES = [
  ["admin", "/admin"],
  ["admin", "/admin/violations"],
  ["admin", "/admin/regulations"],
  ["ops", "/dashboard"],
  ["ops", "/operations"],
  ["ops", "/visits/workload"],
  ["planner", "/planning"],
  ["planner", "/planning/bulk"],
  ["reviewer", "/reviews"],
  ["inspector", "/field"],
];

const browser = await chromium.launch();
let totalViolations = 0;
const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
const details = [];

for (const [personaKey, path] of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await login(page, PERSONAS[personaKey]);
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 20_000 });
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      // WCAG 2.1 AA — the scope this platform targets per its own accessibility posture.
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violations = results.violations;
    totalViolations += violations.length;
    for (const v of violations) {
      byImpact[v.impact ?? "minor"] = (byImpact[v.impact ?? "minor"] ?? 0) + 1;
      details.push({ path, id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map(n => n.target.join(" ")) });
    }
    console.log(`${violations.length === 0 ? "ok  " : "FAIL"} ${path} (${personaKey})  ${violations.length} violation(s)`);
  } catch (e) {
    console.log(`ERR  ${path} (${personaKey})  ${e.message.split("\n")[0]}`);
  } finally {
    await context.close();
  }
}
await browser.close();

console.log(`\n${totalViolations} total violation(s) across ${ROUTES.length} routes`);
console.log(`by impact: critical=${byImpact.critical} serious=${byImpact.serious} moderate=${byImpact.moderate} minor=${byImpact.minor}\n`);
for (const d of details) {
  console.log(`[${d.impact}] ${d.path}  ${d.id} (${d.help})  ${d.nodes} node(s)`);
  for (const t of d.targets) console.log(`    ${t}`);
}
process.exit(0);
