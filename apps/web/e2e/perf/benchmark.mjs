#!/usr/bin/env node
// Phase-2 baseline performance harness (Kimi) — Inspection Platform.
// Measures cold + warm navigation timings for major routes against a RUNNING
// server (production build expected). Appends one JSON record per measured
// navigation to a JSONL file so runs can be chunked across shell invocations.
// Aggregation into baseline.json / CSV is a separate subcommand.
//
// Usage:
//   node e2e/perf/benchmark.mjs setup                          # login all personas, save storage states
//   node e2e/perf/benchmark.mjs login --cycles 5               # cold login-chain measurements (ops persona)
//   node e2e/perf/benchmark.mjs cold --route /dashboard --cycles 10
//   node e2e/perf/benchmark.mjs warm --route /dashboard --cycles 10
//   node e2e/perf/benchmark.mjs warm-detail --cycles 10        # visits list -> first detail link
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

// Seeded demo personas — same credentials as e2e/personas.ts (already in-repo).
const PERSONAS = {
  planner: { email: "planner@mim.gov.sa", password: "MimPlan!2026", home: "/planning" },
  inspector: { email: "inspector@mim.gov.sa", password: "MimField!2026", home: "/field" },
  reviewer: { email: "reviewer@mim.gov.sa", password: "MimRev!2026", home: "/reviews" },
  admin: { email: "admin@mim.gov.sa", password: "MimAdmin!2026", home: "/admin" },
  ops: { email: "ops@mim.gov.sa", password: "MimOps!2026", home: "/dashboard" },
};

// route -> owning persona (keeps warm nav inside that persona's shell nav)
const ROUTE_PERSONA = {
  "/dashboard": "ops",
  "/visits": "ops",
  "/factories": "ops",
  "/planning": "planner",
  "/field": "inspector",
};

const args = process.argv.slice(2);
const command = args[0];
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const CYCLES = Number(opt("cycles", "10"));
const ROUTE = opt("route", null);

mkdirSync(RESULTS_DIR, { recursive: true });
mkdirSync(EVIDENCE_DIR, { recursive: true });
mkdirSync(AUTH_DIR, { recursive: true });

// ---- instrumentation injected before any page script ----------------------
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
  // Mapbox telemetry/session beacons and realtime sockets are deliberately
  // long-lived. They do not gate useful route content and must not force every
  // navigation to consume the 30-second safety timeout.
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
  const blockers = [...state.inflight.values()].filter(blocksUsefulContent).map(({ url }) => url);
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
    for (const key of ["access_token", "apikey", "token", "signature"]) url.searchParams.delete(key);
    return `${url.pathname}${url.search}`.slice(0, 160);
  } catch {
    return raw.startsWith("blob:") ? "blob:[worker]" : "[unparseable-url]";
  }
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
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.locator("#email").fill(persona.email);
  await page.locator("#pw").fill(persona.password);
  await page.locator("form:has(#email) button.btn-primary.btn-lg").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login") && !u.pathname.startsWith("/launch"), { timeout: 45000 });
  await page.waitForLoadState("load");
}

// ---- subcommands ----------------------------------------------------------

async function cmdSetup(browser) {
  for (const [key, persona] of Object.entries(PERSONAS)) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(INIT_SCRIPT);
    try {
      await loginFlow(page, persona);
      await ctx.storageState({ path: join(AUTH_DIR, `${key}.json`) });
      console.log(`setup ok: ${key} -> landed ${page.url()}`);
    } catch (e) {
      console.error(`setup FAILED: ${key}: ${e.message}`);
    }
    await ctx.close();
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
      await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
      await page.locator("#email").fill(persona.email);
      await page.locator("#pw").fill(persona.password);
      const mark = { requests: net.done.length, bytes: net.bytes, longtasks: 0 };
      const t0 = Date.now();
      await page.locator("form:has(#email) button.btn-primary.btn-lg").click();
      await page.waitForURL((u) => !u.pathname.startsWith("/login") && !u.pathname.startsWith("/launch"), { timeout: 45000 });
      await page.waitForLoadState("load");
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "login-chain", route: `/login->${persona.home}`, cycle, landed: new URL(page.url()).pathname }));
      console.log(`login cycle ${cycle}: ${wall}ms landed=${new URL(page.url()).pathname}`);
    } catch (e) {
      appendRun({ ts: new Date().toISOString(), mode: "login-chain", route: "/login", cycle, error: e.message.split("\n")[0] });
      console.error(`login cycle ${cycle} FAILED: ${e.message.split("\n")[0]}`);
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
        // discover a real detail href from the visits list first
        await page.goto(`${BASE_URL}/visits`, { waitUntil: "load" });
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
      await page.goto(`${BASE_URL}${resolvedRoute}`, { waitUntil: "load" });
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "cold", route, resolved_route: resolvedRoute, persona: personaKey, cycle }));
      if (saveEvidence && cycle === 1) {
        const name = route.replace(/[^\w]+/g, "_");
        writeFileSync(join(EVIDENCE_DIR, `${name}-requests.json`), JSON.stringify(snap.requests.map((r) => ({
          url: evidenceUrl(r.url),
          ms: Math.round(r.ms), bytes: r.bytes, supabase: r.supabase, failed: r.failed,
        })), null, 1));
      }
      console.log(`cold ${route} cycle ${cycle}: ${wall}ms reqs=${snap.requests.length} supa=${snap.requests.filter((r) => r.supabase).length}`);
    } catch (e) {
      appendRun({ ts: new Date().toISOString(), mode: "cold", route, persona: personaKey, cycle, error: e.message.split("\n")[0] });
      console.error(`cold ${route} cycle ${cycle} FAILED: ${e.message.split("\n")[0]}`);
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
    // Intermediate "somewhere else" route between measured navs. Must differ
    // from the target (clicking a nav link to the CURRENT route measures a
    // same-route refetch, not a transition). /factories is readable by every
    // persona and relatively light.
    const OTHER = route === "/factories" ? persona.home : "/factories";
    await page.goto(`${BASE_URL}${OTHER}`, { waitUntil: "load" });
    await waitSettled(net);
    for (let cycle = 1; cycle <= CYCLES; cycle++) {
      // ensure we start somewhere else (unmeasured)
      if (new URL(page.url()).pathname === route || new URL(page.url()).pathname.startsWith(route + "/")) {
        await page.goto(`${BASE_URL}${OTHER}`, { waitUntil: "load" });
        await waitSettled(net);
      }
      const ltMark = await page.evaluate(() => (window.__perf ? window.__perf.longtasks.length : 0));
      const mark = { requests: net.done.length, bytes: net.bytes, longtasks: ltMark };
      const t0 = Date.now();
      let method = "link-click";
      const link = page.locator(`nav a[href="${route}"]`).first();
      if ((await link.count()) > 0) {
        if (ACTIVE_VIEWPORT.isMobile || !(await link.isVisible())) {
          method = "responsive-link-click";
          await link.evaluate((element) => element.click());
        } else {
          await link.click();
        }
      } else {
        method = "in-context-goto";
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "load" });
      }
      await page.waitForURL((u) => u.pathname === route || u.pathname.startsWith(route + "/"), { timeout: 20000 }).catch(() => {});
      await waitSettled(net);
      const wall = Date.now() - t0;
      const snap = await snapshot(page, net, mark);
      appendRun(summarize({}, snap, wall, { mode: "warm", route, persona: personaKey, cycle, method }));
      console.log(`warm ${route} cycle ${cycle}: ${wall}ms (${method}) reqs=${snap.requests.length}`);
    }
  } catch (e) {
    appendRun({ ts: new Date().toISOString(), mode: "warm", route, persona: personaKey, error: e.message.split("\n")[0] });
    console.error(`warm ${route} FAILED: ${process.env.BENCHMARK_DEBUG ? e.stack : e.message.split("\n")[0]}`);
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
    await page.goto(`${BASE_URL}/visits`, { waitUntil: "load" });
    await waitSettled(net);
    for (let cycle = 1; cycle <= CYCLES; cycle++) {
      if (!new URL(page.url()).pathname.startsWith("/visits")) {
        await page.goto(`${BASE_URL}/visits`, { waitUntil: "load" });
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
      appendRun(summarize({}, snap, wall, { mode: "warm", route: "/visits/[id]", resolved_route: href, persona: "ops", cycle, method: "link-click" }));
      console.log(`warm /visits/[id] cycle ${cycle}: ${wall}ms -> ${href}`);
      // go back to list (unmeasured)
      await page.goto(`${BASE_URL}/visits`, { waitUntil: "load" });
      await waitSettled(net);
    }
  } catch (e) {
    appendRun({ ts: new Date().toISOString(), mode: "warm", route: "/visits/[id]", persona: "ops", error: e.message.split("\n")[0] });
    console.error(`warm detail FAILED: ${e.message.split("\n")[0]}`);
  }
  await ctx.close();
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
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
  for (const [key, list] of Object.entries(groups)) {
    const [mode, route] = key.split("|");
    const entry = { n: list.length, errors: errs.filter((e) => e.mode === mode && e.route === route).length };
    for (const m of metricKeys) {
      const vals = list.map((r) => r[m]).filter((v) => typeof v === "number").sort((a, b) => a - b);
      if (vals.length) {
        entry[m] = { median: percentile(vals, 50), p75: percentile(vals, 75), p95: percentile(vals, 95) };
      }
    }
    (summary[route] ??= {})[mode] = entry;
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
  // CSV: one row per individual run
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
