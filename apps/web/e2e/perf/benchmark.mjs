#!/usr/bin/env node
// Phase-2 baseline performance harness (Kimi) — Inspection Platform.
// Measures cold + warm navigation timings for major routes against a RUNNING
// server (production build expected). Appends one JSON record per measured
// navigation to a JSONL file so runs can be chunked across shell invocations.
// Aggregation into baseline.json / CSV is a separate subcommand.
//
// Usage:
//   node e2e/perf/benchmark.mjs setup                          # login all personas, save storage states
//   node e2e/perf/benchmark.mjs login --cycles 20              # cold login-chain measurements (ops persona)
//   node e2e/perf/benchmark.mjs cold --route /dashboard --cycles 20
//   node e2e/perf/benchmark.mjs warm --route /dashboard --cycles 20
//   node e2e/perf/benchmark.mjs warm-detail --cycles 20        # visits list -> first detail link
//   node e2e/perf/benchmark.mjs aggregate                      # baseline.json + CSV + evidence pruning
//
// Env: BASE_URL (default http://127.0.0.1:3100), RESULTS_DIR (default docs/performance/results),
// RESULTS_LABEL (default baseline; use final for a remediation run without overwriting baseline evidence).

import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..", "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const RESULTS_DIR = process.env.RESULTS_DIR ?? join(REPO_ROOT, "docs", "performance", "results");
const RESULTS_LABEL = process.env.RESULTS_LABEL ?? "baseline";
const VIEWPORT_PROFILE = process.env.VIEWPORT_PROFILE ?? "desktop";
const NETWORK_PROFILE = process.env.NETWORK_PROFILE ?? "normal";
const VIEWPORTS = {
  desktop: { width: 1366, height: 900, isMobile: false, hasTouch: false },
  "ipad-portrait": { width: 810, height: 1080, isMobile: true, hasTouch: true },
  "ipad-landscape": { width: 1080, height: 810, isMobile: true, hasTouch: true },
};
const ACTIVE_VIEWPORT = VIEWPORTS[VIEWPORT_PROFILE] ?? VIEWPORTS.desktop;
const EVIDENCE_DIR = join(REPO_ROOT, "docs", "performance", "evidence");
const AUTH_DIR = join(__dirname, ".auth");
const RUNS_FILE = join(RESULTS_DIR, `runs-${RESULTS_LABEL}.jsonl`);

// ---- env-based, fail-closed personas (same pattern as e2e/personas.ts) ------

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

let fileCache = null;
function envValues() {
  if (fileCache) return fileCache;
  const explicit = process.env.E2E_ENV_FILE?.trim();
  const candidates = explicit
    ? [explicit]
    : [join(WEB_ROOT, ".env.local"), join(WEB_ROOT, ".env")];
  fileCache = candidates.reduce(
    (merged, path) => ({ ...merged, ...parseEnvFile(path) }),
    {},
  );
  return fileCache;
}

function requireSetting(envVar, persona, allowEmpty = false) {
  const files = envValues();
  const processHas = Object.prototype.hasOwnProperty.call(process.env, envVar);
  const fileHas = Object.prototype.hasOwnProperty.call(files, envVar);
  if (!processHas && !fileHas) {
    throw new Error(
      `Persona "${persona}" is missing ${envVar}. Set it in apps/web/.env.local, ` +
      `apps/web/.env, or E2E_ENV_FILE. Credentials are never committed to this repository.`,
    );
  }
  const value = processHas ? process.env[envVar] : files[envVar];
  if (!allowEmpty && !value.trim()) throw new Error(`Persona "${persona}" has an empty ${envVar}.`);
  return value;
}

const sharedPassword = (persona) => requireSetting("SAQEEL_TEST_PASSWORD", persona, true);
const personaEmail = (envVar, persona) => requireSetting(envVar, persona);

const PERSONAS = {
  planner: {
    get email() { return personaEmail("SAQEEL_TEST_PLANNER_EMAIL", "planner"); },
    home: "/planning",
    get password() { return sharedPassword("planner"); },
  },
  inspector: {
    get email() { return personaEmail("SAQEEL_TEST_INSPECTOR_EMAIL", "inspector"); },
    home: "/field",
    get password() { return sharedPassword("inspector"); },
  },
  reviewer: {
    get email() { return personaEmail("SAQEEL_TEST_REVIEWER_EMAIL", "reviewer"); },
    home: "/reviews",
    get password() { return sharedPassword("reviewer"); },
  },
  admin: {
    get email() { return personaEmail("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", "admin"); },
    home: "/admin",
    get password() { return sharedPassword("admin"); },
  },
  ops: {
    get email() { return personaEmail("SAQEEL_TEST_OPS_EMAIL", "ops"); },
    home: "/dashboard",
    get password() { return sharedPassword("ops"); },
  },
};

// route -> owning persona (keeps warm nav inside that persona's shell nav)
const ROUTE_PERSONA = {
  "/dashboard": "ops",
  "/operations": "ops",
  "/factories": "ops",
  "/planning": "planner",
  "/execution": "inspector",
  "/reviews": "reviewer",
  "/admin": "admin",
  "/field": "inspector",
};

const MIN_AGGREGATE_SAMPLES = 20;
const args = process.argv.slice(2);
const command = args[0];
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const CYCLES_RAW = opt("cycles", "20");
const CYCLES = Number(CYCLES_RAW);
if (!Number.isInteger(CYCLES) || CYCLES < 20) {
  console.error(`CYCLES must be an integer >= 20, got: ${CYCLES_RAW}`);
  process.exit(1);
}
const ROUTE = opt("route", null);

mkdirSync(RESULTS_DIR, { recursive: true });
mkdirSync(EVIDENCE_DIR, { recursive: true });
mkdirSync(AUTH_DIR, { recursive: true });

// ---- instrumentation injected before any page script ----------------------
const USEFUL_CONTENT_SELECTOR = ".sq-content";

async function waitForReady(page) {
  await page.waitForSelector(USEFUL_CONTENT_SELECTOR, { state: "visible", timeout: 15000 });
  // bounded settle: no long tasks for 200ms
  const settleT0 = Date.now();
  while (Date.now() - settleT0 < 200) {
    const hadLongTask = await page.evaluate(() => {
      if (!window.__perf || !window.__perf.longtasks) return false;
      const recent = window.__perf.longtasks.filter((t) => t.start > performance.now() - 250);
      return recent.some((t) => t.dur > 50);
    });
    if (hadLongTask) {
      await new Promise((r) => setTimeout(r, 50));
    } else {
      break;
    }
  }
}

const INIT_SCRIPT = `
  window.__perf = { longtasks: [], lcp: [], paints: [] };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.longtasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ entryTypes: ["longtask"] });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.lcp.push(e.startTime);
    }).observe({ entryTypes: ["largest-contentful-paint"] });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.paints.push({ name: e.name, start: e.startTime });
    }).observe({ entryTypes: ["paint"] });
  } catch (e) { /* observer unsupported */ }
`;

// Network tracker over CDP: counts requests, bytes, and per-request durations.
async function attachNetwork(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  if (NETWORK_PROFILE === "slow-4g") {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: "cellular4g",
    });
  }
  const state = { inflight: new Map(), done: [], bytes: 0 };
  cdp.on("Network.requestWillBeSent", (ev) => {
    state.inflight.set(ev.requestId, { url: ev.request.url, ts: ev.timestamp, wall: ev.wallTime });
  });
  const finish = (ev, failed) => {
    const req = state.inflight.get(ev.requestId);
    if (!req) return;
    state.inflight.delete(ev.requestId);
    const bytes = ev.encodedDataLength ?? 0;
    state.bytes += bytes;
    state.done.push({
      url: req.url,
      ms: Math.max(0, (ev.timestamp - req.ts) * 1000),
      bytes,
      failed: Boolean(failed),
      supabase: /supabase\.(co|in)/.test(req.url),
    });
  };
  cdp.on("Network.loadingFinished", (ev) => finish(ev, false));
  cdp.on("Network.loadingFailed", (ev) => finish(ev, true));
  return state;
}

// Wait until network is quiet (no inflight for `quietMs`) or timeout.
async function waitSettled(state, quietMs = 500, timeoutMs = 30000) {
  const t0 = Date.now();
  const blocksUsefulContent = ({ url }) => !(
    url.startsWith("blob:")
    || /\/events\/v2(?:\?|$)/.test(url)
    || /\/map-sessions\/v1(?:\?|$)/.test(url)
    || /\/realtime\/v1\/websocket/.test(url)
  );
  const blockingCount = () => [...state.inflight.values()].filter(blocksUsefulContent).length;
  let quietSince = blockingCount() === 0 ? Date.now() : null;
  while (Date.now() - t0 < timeoutMs) {
    if (blockingCount() === 0) {
      if (quietSince === null) quietSince = Date.now();
      if (Date.now() - quietSince >= quietMs) return true;
    } else {
      quietSince = null;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  const blockers = [...state.inflight.values()].filter(blocksUsefulContent).map(({ url }) => evidenceUrl(url));
  console.error(`network settle timeout; blocking URLs: ${JSON.stringify(blockers)}`);
  return false;
}

async function snapshot(page, state, markIndex) {
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    const mem = performance.memory ? performance.memory.usedJSHeapSize : null;
    return {
      ttfb: n ? n.responseStart : null,
      dcl: n ? n.domContentLoadedEventEnd : null,
      load: n ? n.loadEventEnd : null,
      heap: mem,
      paints: window.__perf ? window.__perf.paints.map((p) => ({ ...p })) : [],
      lcp: window.__perf ? [...window.__perf.lcp] : [],
      longtasks: window.__perf ? window.__perf.longtasks.map((t) => ({ ...t })) : [],
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    };
  });
  return {
    ttfb_ms: nav.ttfb,
    dcl_ms: nav.dcl,
    load_ms: nav.load,
    fp_ms: (nav.paints.find((p) => p.name === "first-paint") || {}).start ?? null,
    fcp_ms: (nav.paints.find((p) => p.name === "first-contentful-paint") || {}).start ?? null,
    lcp_ms: nav.lcp.length ? Math.max(...nav.lcp) : null,
    longtasks: nav.longtasks.slice(markIndex.longtasks),
    heap_mb: nav.heap ? +(nav.heap / 1048576).toFixed(1) : null,
    horizontal_overflow_px: nav.overflow,
    requests: state.done.slice(markIndex.requests),
    bytes: state.bytes - markIndex.bytes,
  };
}

function summarize(record, snap, wallMs, extra) {
  const supa = snap.requests.filter((r) => r.supabase);
  return {
    ts: new Date().toISOString(),
    ...extra,
    viewport_profile: VIEWPORT_PROFILE,
    network_profile: NETWORK_PROFILE,
    nav_ms: Math.round(wallMs),
    ttfb_ms: snap.ttfb_ms != null ? Math.round(snap.ttfb_ms) : null,
    dcl_ms: snap.dcl_ms != null ? Math.round(snap.dcl_ms) : null,
    load_ms: snap.load_ms != null ? Math.round(snap.load_ms) : null,
    fp_ms: snap.fp_ms != null ? Math.round(snap.fp_ms) : null,
    fcp_ms: snap.fcp_ms != null ? Math.round(snap.fcp_ms) : null,
    lcp_ms: snap.lcp_ms != null ? Math.round(snap.lcp_ms) : null,
    longtask_count: snap.longtasks.length,
    longtask_ms: Math.round(snap.longtasks.reduce((a, t) => a + t.dur, 0)),
    request_count: snap.requests.length,
    bytes: snap.bytes,
    heap_mb: snap.heap_mb,
    horizontal_overflow_px: snap.horizontal_overflow_px,
    supabase_calls: supa.length,
    supabase_ms_total: Math.round(supa.reduce((a, r) => a + r.ms, 0)),
    supabase_ms_max: supa.length ? Math.round(Math.max(...supa.map((r) => r.ms))) : null,
  };
}

function appendRun(record) {
  appendFileSync(RUNS_FILE, JSON.stringify(record) + "\n");
}

function evidenceUrl(raw) {
  try {
    const url = new URL(raw);
    return url.pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "/[id]",
    ).slice(0, 160);
  } catch {
    return raw.startsWith("blob:") ? "blob:[worker]" : "[unparseable-url]";
  }
}

function classifyError(err) {
  const text = (err?.message ?? String(err) ?? "").toLowerCase();
  if (/timeout|timed out/i.test(text)) return "timeout";
  if (/network|fetch|connection|offline/i.test(text)) return "network";
  if (/abort/i.test(text)) return "aborted";
  if (/security|csp|mixed content|blocked/i.test(text)) return "security";
  if (/not found|404|enoent/i.test(text)) return "not-found";
  if (/auth|unauthorized|forbidden|401|403/i.test(text)) return "auth";
  return "other";
}

async function newContext(browser, personaKey) {
  return browser.newContext({
    storageState: join(AUTH_DIR, `${personaKey}.json`),
    viewport: { width: ACTIVE_VIEWPORT.width, height: ACTIVE_VIEWPORT.height },
    isMobile: ACTIVE_VIEWPORT.isMobile,
    hasTouch: ACTIVE_VIEWPORT.hasTouch,
    locale: "en-US",
  });
}

async function loginFlow(page, persona) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("form.fl-form input.fl-in").first().fill(persona.email);
  await page.locator("form.fl-form input.fl-pw-in").fill(persona.password);
  await page.locator("form.fl-form button.fl-submit").click();
  await page.waitForURL((u) => u.pathname === persona.home, { timeout: 45000 });
  await waitForReady(page);
}

// ---- subcommands ----------------------------------------------------------

async function cmdSetup(browser) {
  let anyFailed = false;
  for (const [key, persona] of Object.entries(PERSONAS)) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(INIT_SCRIPT);
    try {
      await loginFlow(page, persona);
      await ctx.storageState({ path: join(AUTH_DIR, `${key}.json`) });
      console.log(`setup ok: ${key} -> landed ${new URL(page.url()).pathname}`);
    } catch (e) {
      anyFailed = true;
      console.error(`setup FAILED: ${key}: ${classifyError(e)}`);
    }
    await ctx.close();
  }
  if (anyFailed) {
    console.error("setup: one or more personas failed to authenticate");
    process.exit(1);
  }
}

async function cmdLogin(browser) {
  const persona = PERSONAS.ops;
  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(INIT_SCRIPT);
    const net = await attachNetwork(page);
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.locator("form.fl-form input.fl-in").first().fill(persona.email);
      await page.locator("form.fl-form input.fl-pw-in").fill(persona.password);
      const mark = { requests: net.done.length, bytes: net.bytes, longtasks: 0 };
      const t0 = Date.now();
      await page.locator("form.fl-form button.fl-submit").click();
      await page.waitForURL((u) => !u.pathname.startsWith("/login") && !u.pathname.startsWith("/launch"), { timeout: 45000 });
      const wall = Date.now() - t0;
      await waitForReady(page);
      const ready = Date.now() - t0;
      await waitSettled(net);
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "login", route: `/login->${persona.home}`, cycle, landed: new URL(page.url()).pathname, wall_ms: wall, ready_ms: ready }));
      console.log(`login cycle ${cycle}: wall=${wall}ms ready=${ready}ms landed=${new URL(page.url()).pathname}`);
    } catch (e) {
      appendRun({ ts: new Date().toISOString(), mode: "login", route: "/login", cycle, error: classifyError(e) });
      console.error(`login cycle ${cycle} FAILED: ${classifyError(e)}`);
      await ctx.close();
      process.exit(1);
    }
    await ctx.close();
  }
}

async function cmdCold(browser, route, { saveEvidence = false } = {}) {
  const personaKey = ROUTE_PERSONA[route] ?? "ops";
  let resolvedRoute = route;
  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    const ctx = await newContext(browser, personaKey);
    const page = await ctx.newPage();
    await page.addInitScript(INIT_SCRIPT);
    const net = await attachNetwork(page);
    try {
      if (route === "__VISIT_DETAIL__") {
        await page.goto(`${BASE_URL}/visits`, { waitUntil: "domcontentloaded" });
        await waitForReady(page);
        await waitSettled(net);
        const href = await page.evaluate(() => {
          const a = document.querySelector('a[href^="/visits/"][class*="sq-link"], table a[href^="/visits/"]');
          return a ? a.getAttribute("href") : null;
        });
        if (!href || !/^\/visits\/[0-9a-f-]{36}/.test(href)) throw new Error(`no /visits/[id] link found on list page (got ${href})`);
        resolvedRoute = href;
      }
      const mark = { requests: 0, bytes: 0, longtasks: 0 };
      const t0 = Date.now();
      await page.goto(`${BASE_URL}${resolvedRoute}`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "cold", route, resolved_route: evidenceUrl(resolvedRoute), persona: personaKey, cycle }));
      if (saveEvidence && cycle === 1) {
        const name = route.replace(/[^\w]+/g, "_");
        writeFileSync(join(EVIDENCE_DIR, `${name}-requests.json`), JSON.stringify(snap.requests.map((r) => ({
          url: evidenceUrl(r.url),
          ms: Math.round(r.ms), bytes: r.bytes, supabase: r.supabase, failed: r.failed,
        })), null, 1));
      }
      console.log(`cold ${route} cycle ${cycle}: ${wall}ms reqs=${snap.requests.length} supa=${snap.requests.filter((r) => r.supabase).length}`);
    } catch (e) {
      appendRun({ ts: new Date().toISOString(), mode: "cold", route, persona: personaKey, cycle, error: classifyError(e) });
      console.error(`cold ${route} cycle ${cycle} FAILED: ${classifyError(e)}`);
      await ctx.close();
      process.exit(1);
    }
    await ctx.close();
  }
}

async function cmdWarm(browser, route) {
  const personaKey = ROUTE_PERSONA[route] ?? "ops";
  const persona = PERSONAS[personaKey];
  const ctx = await newContext(browser, personaKey);
  const page = await ctx.newPage();
  await page.addInitScript(INIT_SCRIPT);
  const net = await attachNetwork(page);
  page.setDefaultTimeout(20000);
  try {
    const OTHER = route === "/factories" ? persona.home : "/factories";
    await page.goto(`${BASE_URL}${OTHER}`, { waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await waitSettled(net);
    for (let cycle = 1; cycle <= CYCLES; cycle++) {
      if (new URL(page.url()).pathname === route) {
        await page.goto(`${BASE_URL}${OTHER}`, { waitUntil: "domcontentloaded" });
        await waitForReady(page);
        await waitSettled(net);
      }
      const ltMark = await page.evaluate(() => (window.__perf ? window.__perf.longtasks.length : 0));
      const mark = { requests: net.done.length, bytes: net.bytes, longtasks: ltMark };
      const t0 = Date.now();
      const link = page.locator(`nav a[href="${route}"]`).first();
      if ((await link.count()) === 0) {
        throw new Error(`warm nav link not found for route ${route}`);
      }
      if (ACTIVE_VIEWPORT.isMobile || !(await link.isVisible())) {
        await link.evaluate((element) => element.click());
      } else {
        await link.click();
      }
      await page.waitForURL((u) => u.pathname === route, { timeout: 20000 });
      await waitForReady(page);
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "warm", route, persona: personaKey, cycle, method: "link-click" }));
      console.log(`warm ${route} cycle ${cycle}: ${wall}ms reqs=${snap.requests.length}`);
    }
  } catch (e) {
    appendRun({ ts: new Date().toISOString(), mode: "warm", route, persona: personaKey, error: classifyError(e) });
    console.error(`warm ${route} FAILED: ${classifyError(e)}`);
    await ctx.close();
    process.exit(1);
  }
  await ctx.close();
}

async function cmdWarmDetail(browser) {
  const ctx = await newContext(browser, "ops");
  const page = await ctx.newPage();
  await page.addInitScript(INIT_SCRIPT);
  const net = await attachNetwork(page);
  page.setDefaultTimeout(20000);
  try {
    await page.goto(`${BASE_URL}/visits`, { waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await waitSettled(net);
    for (let cycle = 1; cycle <= CYCLES; cycle++) {
      if (!new URL(page.url()).pathname.startsWith("/visits")) {
        await page.goto(`${BASE_URL}/visits`, { waitUntil: "domcontentloaded" });
        await waitForReady(page);
        await waitSettled(net);
      }
      const href = await page.evaluate(() => {
        const a = document.querySelector('a[href^="/visits/"][class*="sq-link"], table a[href^="/visits/"]');
        return a ? a.getAttribute("href") : null;
      });
      if (!href || !/^\/visits\/[0-9a-f-]{36}/.test(href)) throw new Error(`no detail link on /visits (got ${href})`);
      const ltMark = await page.evaluate(() => (window.__perf ? window.__perf.longtasks.length : 0));
      const mark = { requests: net.done.length, bytes: net.bytes, longtasks: ltMark };
      const t0 = Date.now();
      await page.locator(`a[href="${href}"]`).first().click();
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "warm", route: "/visits/[id]", resolved_route: evidenceUrl(href), persona: "ops", cycle, method: "link-click" }));
      console.log(`warm /visits/[id] cycle ${cycle}: ${wall}ms -> ${evidenceUrl(href)}`);
      await page.goto(`${BASE_URL}/visits`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await waitSettled(net);
    }
  } catch (e) {
    appendRun({ ts: new Date().toISOString(), mode: "warm", route: "/visits/[id]", persona: "ops", error: classifyError(e) });
    console.error(`warm detail FAILED: ${classifyError(e)}`);
    await ctx.close();
    process.exit(1);
  }
  await ctx.close();
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const n = sorted.length;
  const idx = (p / 100) * (n - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  if (upper >= n) return sorted[n - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function cmdAggregate() {
  if (!existsSync(RUNS_FILE)) { console.error("no runs file"); process.exit(1); }
  const runs = readFileSync(RUNS_FILE, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const ok = runs.filter((r) => !r.error);
  const errs = runs.filter((r) => r.error);
  const groups = {};
  for (const r of ok) {
    const key = `${r.mode}|${r.route}`;
    (groups[key] ??= []).push(r);
  }
  const summary = {};
  const metricKeys = ["nav_ms", "ttfb_ms", "dcl_ms", "load_ms", "fcp_ms", "lcp_ms", "longtask_count", "longtask_ms", "request_count", "bytes", "heap_mb", "horizontal_overflow_px", "supabase_calls", "supabase_ms_total", "supabase_ms_max"];
  const rejected = [];
  for (const [key, list] of Object.entries(groups)) {
    const [mode, route] = key.split("|");
    if (list.length < MIN_AGGREGATE_SAMPLES) {
      console.error(`aggregate rejected: ${route} [${mode}] has ${list.length} valid samples (minimum ${MIN_AGGREGATE_SAMPLES})`);
      rejected.push({ route, mode, n: list.length });
      continue;
    }
    const entry = { n: list.length, errors: errs.filter((e) => e.mode === mode && e.route === route).length };
    for (const m of metricKeys) {
      const vals = list.map((r) => r[m]).filter((v) => typeof v === "number").sort((a, b) => a - b);
      if (vals.length) {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.length < 2 ? null : vals.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / (vals.length - 1);
        const iqr = vals.length < 2 ? null : percentile(vals, 75) - percentile(vals, 25);
        entry[m] = { n: vals.length, median: percentile(vals, 50), p75: percentile(vals, 75), p95: percentile(vals, 95), mean, variance, iqr, min: vals[0], max: vals[vals.length - 1], max_is_sample_max_not_p95: true };
      }
    }
    (summary[route] ??= {})[mode] = entry;
  }
  // FAIL CLOSED: if any group was rejected for insufficient samples, do not
  // produce accepted JSON/CSV results and exit nonzero.
  if (rejected.length > 0) {
    console.error(`aggregate FAILED: ${rejected.length} group(s) below minimum ${MIN_AGGREGATE_SAMPLES} samples`);
    process.exit(1);
  }
  const out = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    build: "production (next build && next start)",
    viewport_profile: VIEWPORT_PROFILE,
    network_profile: NETWORK_PROFILE,
    runs_file: RUNS_FILE,
    total_runs: runs.length,
    failed_runs: errs.length,
    failures: errs.map((e) => ({ mode: e.mode, route: e.route, cycle: e.cycle, error: e.error })),
    routes: summary,
  };
  writeFileSync(join(RESULTS_DIR, `${RESULTS_LABEL}.json`), JSON.stringify(out, null, 2));
  const header = ["mode", "route", "cycle", "persona", "method", "viewport_profile", "network_profile", "nav_ms", "ttfb_ms", "dcl_ms", "load_ms", "fp_ms", "fcp_ms", "lcp_ms", "longtask_count", "longtask_ms", "request_count", "bytes", "heap_mb", "horizontal_overflow_px", "supabase_calls", "supabase_ms_total", "supabase_ms_max", "error"];
  const lines = [header.join(",")];
  for (const r of runs) {
    lines.push(header.map((h) => (r[h] ?? "")).join(","));
  }
  const routeResultsName = RESULTS_LABEL === "final" ? "route-results.csv" : `route-results-${RESULTS_LABEL}.csv`;
  writeFileSync(join(RESULTS_DIR, routeResultsName), lines.join("\n"));
  console.log(`aggregated ${runs.length} runs (${errs.length} failed) -> ${RESULTS_LABEL}.json + ${routeResultsName}`);
  for (const [route, modes] of Object.entries(summary)) {
    for (const [mode, e] of Object.entries(modes)) {
      console.log(`  ${route} [${mode}] n=${e.n} nav median=${e.nav_ms?.median} p75=${e.nav_ms?.p75} p95=${e.nav_ms?.p95}`);
    }
  }
}

const browser = command === "aggregate" ? null : await chromium.launch({ channel: "chromium", headless: true });
try {
  if (command === "setup") await cmdSetup(browser);
  else if (command === "login") await cmdLogin(browser);
  else if (command === "cold") await cmdCold(browser, ROUTE, { saveEvidence: opt("evidence", "0") === "1" });
  else if (command === "warm") await cmdWarm(browser, ROUTE);
  else if (command === "warm-detail") await cmdWarmDetail(browser);
  else if (command === "aggregate") cmdAggregate();
  else { console.error(`unknown command: ${command}`); process.exit(1); }
} finally {
  if (browser) await browser.close();
}
