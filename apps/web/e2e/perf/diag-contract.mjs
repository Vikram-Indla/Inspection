import { chromium } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..", "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3100";

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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
  ops: {
    get email() { return requireSetting("SAQEEL_TEST_OPS_EMAIL", "ops"); },
    home: "/dashboard",
    get password() { return requireSetting("SAQEEL_TEST_PASSWORD", "ops", true); },
  },
};

function classifyError(err, step) {
  const text = (err?.message ?? String(err) ?? "").toLowerCase();
  if (/timeout|timed out/i.test(text)) return `${step}:timeout`;
  if (/network|fetch|connection|offline/i.test(text)) return `${step}:network`;
  if (/abort/i.test(text)) return `${step}:aborted`;
  if (/security|csp|mixed content|blocked/i.test(text)) return `${step}:security`;
  if (/not found|404|enoent/i.test(text)) return `${step}:not-found`;
  if (/auth|unauthorized|forbidden|401|403/i.test(text)) return `${step}:auth`;
  if (/selector|could not find|unable to locate/i.test(text)) return `${step}:selector-not-found`;
  return `${step}:other`;
}

let exitCode = 0;

function safePathname(url) {
  try { return new URL(url).pathname; } catch { return "[invalid]"; }
}

// Fail-closed: if ops persona is not configured, exit 77 (skip) so the
// contract suite can distinguish "environment missing" from "harness broken".
let opsEmail, opsPassword;
try {
  opsEmail = PERSONAS.ops.email;
  opsPassword = PERSONAS.ops.password;
} catch (e) {
  console.error("Browser contract SKIPPED: ops persona unavailable");
  process.exit(77);
}

const browser = await chromium.launch({ channel: "chromium", headless: true });

try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const loginPath = safePathname(page.url());
  if (loginPath !== "/login") {
    console.error(`Browser contract FAILED: expected /login, got ${loginPath}`);
    exitCode = 1;
  }

  const emailInput = page.locator("form.fl-form input.fl-in").first();
  const pwInput = page.locator("form.fl-form input.fl-pw-in");
  const submitBtn = page.locator("form.fl-form button.fl-submit");

  if ((await emailInput.count()) === 0) {
    console.error("Browser contract FAILED: email selector not found");
    exitCode = 1;
  }
  if ((await pwInput.count()) === 0) {
    console.error("Browser contract FAILED: password selector not found");
    exitCode = 1;
  }
  if ((await submitBtn.count()) === 0) {
    console.error("Browser contract FAILED: submit selector not found");
    exitCode = 1;
  }

  if (exitCode !== 0) {
    await ctx.close();
    await browser.close();
    process.exit(exitCode);
  }

  await emailInput.fill(opsEmail);
  await pwInput.fill(opsPassword);
  await submitBtn.click();

  await page.waitForURL((u) => u.pathname === "/dashboard", { timeout: 45000 });
  const landed = safePathname(page.url());
  if (landed !== "/dashboard") {
    console.error(`Browser contract FAILED: landed on ${landed} instead of /dashboard`);
    exitCode = 1;
  }

  const contentVisible = await page.locator(".sq-content").first().isVisible().catch(() => false);
  if (!contentVisible) {
    console.error("Browser contract FAILED: .sq-content not visible");
    exitCode = 1;
  }

  await ctx.close();
} catch (e) {
  console.error("Browser contract FAILED:", classifyError(e, "catch"));
  exitCode = 1;
}

await browser.close();
process.exit(exitCode);
