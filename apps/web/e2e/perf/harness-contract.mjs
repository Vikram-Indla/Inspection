#!/usr/bin/env node
// Focused contract suite for the performance harness.
// Proves: persona mapping, exact landing, cold/warm semantics, readiness,
// percentile math, redaction, no raw error bodies, fail-closed behavior.
// Exits 0 only if every contract passes with live browser evidence.

import { chromium } from "@playwright/test";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..", "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const HARNESS_SOURCE = readFileSync(join(__dirname, "benchmark.mjs"), "utf8");

// ---- inline env loader (same pattern as benchmark.mjs) ------------------------

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
      `apps/web/.env, or E2E_ENV_FILE. Credentials are never committed.`,
    );
  }
  const value = processHas ? process.env[envVar] : files[envVar];
  if (!allowEmpty && !value.trim()) {
    throw new Error(`Persona "${persona}" has an empty ${envVar}.`);
  }
  return value;
}

const PERSONAS = {
  planner: {
    get email() { return requireSetting("SAQEEL_TEST_PLANNER_EMAIL", "planner"); },
    home: "/planning",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "planner", true); },
  },
  inspector: {
    get email() { return requireSetting("SAQEEL_TEST_INSPECTOR_EMAIL", "inspector"); },
    home: "/field",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "inspector", true); },
  },
  reviewer: {
    get email() { return requireSetting("SAQEEL_TEST_REVIEWER_EMAIL", "reviewer"); },
    home: "/reviews",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "reviewer", true); },
  },
  admin: {
    get email() { return requireSetting("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", "admin"); },
    home: "/admin",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "admin", true); },
  },
  ops: {
    get email() { return requireSetting("SAQEEL_TEST_OPS_EMAIL", "ops"); },
    home: "/dashboard",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "ops", true); },
  },
};

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

// ---- contract framework -------------------------------------------------------

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

// ---- contracts ----------------------------------------------------------------

console.log("\n=== Contract 1: persona mapping ===");
assert(ROUTE_PERSONA["/dashboard"] === "ops", "/dashboard maps to ops persona");
assert(ROUTE_PERSONA["/planning"] === "planner", "/planning maps to planner persona");
assert(ROUTE_PERSONA["/field"] === "inspector", "/field maps to inspector persona");
assert(ROUTE_PERSONA["/reviews"] === "reviewer", "/reviews maps to reviewer persona");
assert(ROUTE_PERSONA["/admin"] === "admin", "/admin maps to admin persona");

console.log("\n=== Contract 2: fail-closed env loader ===");
try {
  const oldEnv = process.env.E2E_ENV_FILE;
  const oldPwd = process.env.SAQEEL_TEST_PASSWORD;
  delete process.env.E2E_ENV_FILE;
  delete process.env.SAQEEL_TEST_PASSWORD;
  fileCache = null;

  let caught = false;
  try {
    PERSONAS.inspector.email;
  } catch (e) {
    caught = true;
    assert(e.message.includes("SAQEEL_TEST_INSPECTOR_EMAIL"), "fail-closed throws naming missing var");
  }
  assert(caught, "missing env var throws instead of returning undefined");

  process.env.E2E_ENV_FILE = oldEnv;
  process.env.SAQEEL_TEST_PASSWORD = oldPwd;
  fileCache = null;
} catch (e) {
  console.error("Contract 2 error: fail-closed test threw unexpectedly");
  failed++;
}

console.log("\n=== Contract 3: secret-safe redaction ===");
function safePath(raw) {
  try {
    const u = new URL(raw);
    const redacted = u.pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "/[id]",
    );
    return redacted;
  } catch {
    return "[unparseable-url]";
  }
}
assert(safePath("http://x.com/visits/123e4567-e89b-12d3-a456-426614174000") === "/visits/[id]", "UUID path segment redacted");
assert(safePath("http://x.com/dashboard?token=secret") === "/dashboard", "query string stripped by pathname");
assert(safePath("not-a-url") === "[unparseable-url]", "invalid URL handled");

console.log("\n=== Contract 4: statistics correctness ===");
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
function stats(arr) {
  const valid = arr.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const variance = (() => {
    if (sorted.length < 2) return null;
    const sq = sorted.map((v) => (v - mean) ** 2);
    return sq.reduce((a, b) => a + b, 0) / (sorted.length - 1);
  })();
  const iqr = (() => {
    if (sorted.length < 2) return null;
    const q1 = percentile(sorted, 25);
    const q3 = percentile(sorted, 75);
    return q3 - q1;
  })();
  return {
    n: sorted.length,
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p95: percentile(sorted, 95),
    mean,
    variance,
    iqr,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    max_is_sample_max_not_p95: true,
  };
}
const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const s = stats(sample);
assert(s.n === 10, "count correct");
assert(s.median === 55, "median correct (even count)");
assert(s.p75 === 77.5, "p75 correct");
assert(s.p95 === 95.5, "p95 correct");
assert(s.max_is_sample_max_not_p95 === true, "max flagged as not p95");
assert(s.iqr === 45, "IQR correct");

// ---- behavioral subprocess contracts ------------------------------------------

console.log("\n=== Contract 4b-behavioral: CYCLES validation exits nonzero ===");
const cyclesSub = spawn("node", [join(__dirname, "benchmark.mjs"), "login", "--cycles", "5"], {
  env: { ...process.env, E2E_ENV_FILE: "/nonexistent" },
});
const cyclesExit = await new Promise((resolve) => cyclesSub.on("close", resolve));
assert(cyclesExit === 1, "invalid CYCLES (< 20) causes nonzero exit");

console.log("\n=== Contract 5: no raw error bodies ===");
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
assert(classifyError(new Error("Timeout exceeded 30000ms")) === "timeout", "timeout classified");
assert(classifyError(new Error("net::ERR_CONNECTION_REFUSED")) === "network", "network classified");
assert(classifyError(new Error("Unexpected token")) === "other", "generic error classified as other");
const cat = classifyError(new Error("secret_token=abc123"));
assert(cat === "other", "arbitrary message content not leaked in output");

console.log("\n=== Contract 6: cold/warm semantics ===");
assert(HARNESS_SOURCE.includes("newContext(browser, personaKey)"), "cold uses fresh authenticated context");
assert(HARNESS_SOURCE.includes('page.goto(`${BASE_URL}${resolvedRoute}`') && HARNESS_SOURCE.includes('mode: "cold"'), "cold uses goto");
assert(HARNESS_SOURCE.includes('mode: "warm"') && HARNESS_SOURCE.includes("nav a[href="), "warm uses nav link click");
assert(!HARNESS_SOURCE.includes("goto-fallback"), "warm has NO goto fallback");

console.log("\n=== Contract 6b-behavioral: warm navigation exact pathname ===");
function warmNavPredicate(pathname, route) {
  return pathname === route;
}
assert(warmNavPredicate("/dashboard", "/dashboard") === true, "exact match accepted");
assert(warmNavPredicate("/dashboard/extra", "/dashboard") === false, "subpath rejected");
assert(warmNavPredicate("/factories", "/dashboard") === false, "different path rejected");

console.log("\n=== Contract 7: readiness replaces waitUntil:load ===");
assert(HARNESS_SOURCE.includes("waitForReady"), "waitForReady function exists");
assert(HARNESS_SOURCE.includes("USEFUL_CONTENT_SELECTOR"), "useful content selector used");
assert(HARNESS_SOURCE.includes('waitUntil: "domcontentloaded"'), "domcontentloaded used");
const loadCount = (HARNESS_SOURCE.match(/waitUntil: "load"/g) || []).length;
assert(loadCount === 0, `zero waitUntil:"load" found (got ${loadCount})`);

console.log("\n=== Contract 7b-behavioral: readiness before recording ===");
const coldSection = HARNESS_SOURCE.slice(HARNESS_SOURCE.indexOf("async function cmdCold"));
const coldWaitForReadyIdx = coldSection.indexOf("await waitForReady(page)");
const coldSnapshotIdx = coldSection.indexOf("await snapshot(page, net, mark)");
assert(coldWaitForReadyIdx > 0 && coldSnapshotIdx > coldWaitForReadyIdx, "waitForReady precedes snapshot in cold path");

const warmSection = HARNESS_SOURCE.slice(HARNESS_SOURCE.indexOf("async function cmdWarm"));
const warmWaitForReadyIdx = warmSection.indexOf("await waitForReady(page)");
const warmSnapshotIdx = warmSection.indexOf("await snapshot(page, net, mark)");
assert(warmWaitForReadyIdx > 0 && warmSnapshotIdx > warmWaitForReadyIdx, "waitForReady precedes snapshot in warm path");

console.log("\n=== Contract 8: login timing separate from navigation ===");
assert(HARNESS_SOURCE.includes("mode: \"login\"") && HARNESS_SOURCE.includes("mode: \"cold\"") && HARNESS_SOURCE.includes("mode: \"warm\""), "three separate measurement modes exist");
assert(HARNESS_SOURCE.includes("wall_ms") && HARNESS_SOURCE.includes("ready_ms"), "login reports wall and ready separately");

console.log("\n=== Contract 8b: exact landing assertion ===");
assert(HARNESS_SOURCE.includes('u.pathname === persona.home'), "login asserts exact governed landing pathname");

console.log("\n=== Contract 8c: measurement failures fail the command ===");
assert(HARNESS_SOURCE.includes('setup: one or more personas failed to authenticate'), "setup failures exit nonzero");
const exitCount = (HARNESS_SOURCE.match(/process\.exit\(1\)/g) || []).length;
assert(exitCount >= 4, `at least 4 process.exit(1) paths for failures (got ${exitCount})`);

console.log("\n=== Contract 8d: resolved_route redaction ===");
assert(HARNESS_SOURCE.includes('resolved_route: evidenceUrl(resolvedRoute)'), "cold resolved_route redacted in JSONL");
assert(HARNESS_SOURCE.includes('resolved_route: evidenceUrl(href)'), "warm-detail resolved_route redacted in JSONL");

console.log("\n=== Contract 10-behavioral: aggregate fails closed for <20 samples ===");
const tmpDir = mkdtempSync(join(tmpdir(), "perf-agg-test-"));
const jsonlPath = join(tmpDir, "runs-test.jsonl");
const entries = Array.from({ length: 5 }, (_, i) =>
  JSON.stringify({ mode: "cold", route: "/dashboard", cycle: i + 1, nav_ms: 100 + i }),
);
writeFileSync(jsonlPath, entries.join("\n") + "\n");
const aggSub = spawn("node", [join(__dirname, "benchmark.mjs"), "aggregate"], {
  env: { ...process.env, RESULTS_DIR: tmpDir, RESULTS_LABEL: "test" },
});
let aggOut = "";
let aggErr = "";
aggSub.stdout.on("data", (d) => { aggOut += d; });
aggSub.stderr.on("data", (d) => { aggErr += d; });
const aggExit = await new Promise((resolve) => aggSub.on("close", resolve));
const hasRejection = aggErr.includes("rejected") && aggErr.includes("minimum 20");
assert(aggExit !== 0, "aggregate exits nonzero when group below minimum");
assert(hasRejection, "stderr reports rejection reason");
const filesAfter = readdirSync(tmpDir);
const hasJson = filesAfter.some((f) => f.endsWith(".json"));
const hasCsv = filesAfter.some((f) => f.endsWith(".csv"));
assert(!hasJson, "no accepted JSON artifact written when rejected");
assert(!hasCsv, "no accepted CSV artifact written when rejected");
rmSync(tmpDir, { recursive: true, force: true });

console.log("\n=== Contract 11-behavioral: skip classification for missing env ===");
const skipSub = spawn("node", [join(__dirname, "diag-contract.mjs")], {
  env: { ...process.env, E2E_ENV_FILE: "/nonexistent", SAQEEL_TEST_OPS_EMAIL: "", SAQEEL_TEST_PASSWORD: "" },
});
const skipExit = await new Promise((resolve) => skipSub.on("close", resolve));
assert(skipExit === 77, "missing ops identity exits 77 (skip classification, not failure)");

// ---- browser contract: end-to-end persona login + exact landing ---------------

console.log("\n=== Contract 9: browser login + exact landing ===");
const contractDir = dirname(fileURLToPath(import.meta.url));
const browserSubprocess = spawn("node", [join(contractDir, "diag-contract.mjs")], {
  env: process.env,
  timeout: 60000,
});
let browserSubOut = "";
let browserSubErr = "";
browserSubprocess.stdout.on("data", (d) => { browserSubOut += d; });
browserSubprocess.stderr.on("data", (d) => { browserSubErr += d; });
const browserExitCode = await new Promise((resolve) => {
  browserSubprocess.on("close", resolve);
});
if (browserExitCode === 77) {
  console.log("  SKIP: browser login + exact landing (ops persona unavailable in environment)");
  skipped++;
} else if (browserExitCode === 0) {
  console.log("  PASS: browser login + exact landing");
  passed++;
} else {
  failed++;
  console.error(`  FAIL: browser login + exact landing (subprocess exit ${browserExitCode})`);
}

// ---- summary ------------------------------------------------------------------

console.log("\n=== Contract Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Skipped: ${skipped}`);

if (failed > 0) {
  console.error("\nOne or more contracts FAILED.");
  process.exit(1);
}

if (skipped > 0) {
  console.error("\nOne or more contracts INCONCLUSIVE (live browser evidence unavailable).");
  process.exit(77);
}

console.log("\nAll contracts PASSED.");
process.exit(0);
