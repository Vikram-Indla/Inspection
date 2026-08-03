// Seeded demo personas (supabase/migrations/0011_factory360_gis_ksa_seed.sql;
// exercised by product-contract/evidence/b10_golden_journey.py).
// Domain renamed @mim.example → @mim.gov.sa 2026-07-12 (DEC-011 / SAQEEL-10),
// applied live via Auth Admin.
//
// PASSWORDS ARE NO LONGER COMMITTED. This file previously carried five
// plaintext credentials, so every clone of the repository — and every push to
// GitHub — shipped working logins for the planner, inspector, reviewer, admin
// and ops accounts. The old comment ("G11 will rotate these") conceded the
// point: a rotation would have had to chase values already in git history.
//
// The public shape is unchanged — PERSONAS.inspector.password still works, so
// none of the 51 specs that import this file needed editing. `password` is now
// a getter that resolves from the environment at access time and throws when
// it is absent, using the same env-first, fail-closed approach as
// e2e/pixel/credentials.ts so the harness has one pattern, not two.
//
// To run persona specs, set SAQEEL_TEST_PASSWORD and the matching
// SAQEEL_TEST_<ROLE>_EMAIL values in apps/web/.env.local (gitignored),
// apps/web/.env, or the process environment. The governed local test project
// intentionally uses an empty password, so presence and value are distinct:
// `SAQEEL_TEST_PASSWORD=` is valid; an absent assignment is not.
// Override the file location with E2E_ENV_FILE.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Minimal .env reader — same shape as e2e/pixel/credentials.ts. */
function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

let fileCache: Record<string, string> | null = null;
function envValues(): Record<string, string> {
  if (fileCache) return fileCache;
  const explicit = process.env.E2E_ENV_FILE?.trim();
  // e2e/ sits directly under apps/web, so the web root is one level up.
  const webRoot = resolve(__dirname, "..");
  const candidates = explicit
    ? [resolve(explicit)]
    : [join(webRoot, ".env.local"), join(webRoot, ".env")];
  fileCache = candidates.reduce<Record<string, string>>(
    (merged, path) => ({ ...merged, ...parseEnvFile(path) }),
    {},
  );
  return fileCache;
}

/**
 * Resolve one persona password, or throw naming the variable that is missing.
 * Failing closed is deliberate: a spec that cannot authenticate must say so
 * rather than fall back to a default or a committed value.
 */
function requireSetting(envVar: string, persona: string, allowEmpty = false): string {
  const files = envValues();
  const processHas = Object.prototype.hasOwnProperty.call(process.env, envVar);
  const fileHas = Object.prototype.hasOwnProperty.call(files, envVar);
  if (!processHas && !fileHas) {
    throw new Error(
      `Persona "${persona}" is missing ${envVar}. Set it in apps/web/.env.local, ` +
      `apps/web/.env, or E2E_ENV_FILE. Credentials are never committed to this repository.`,
    );
  }
  const value = processHas ? process.env[envVar]! : files[envVar];
  if (!allowEmpty && !value.trim()) throw new Error(`Persona "${persona}" has an empty ${envVar}.`);
  return value;
}

const sharedPassword = (persona: string) => requireSetting("SAQEEL_TEST_PASSWORD", persona, true);
const primaryCohortPassword = (persona: string) => requireSetting("SAQEEL_CROSS_ROLE_PASSWORD", persona);
const personaEmail = (envVar: string, persona: string) => requireSetting(envVar, persona);

export const PERSONAS = {
  planner: {
    get email(): string { return personaEmail("SAQEEL_TEST_PLANNER_EMAIL", "planner"); },
    home: "/planning",
    get password(): string { return primaryCohortPassword("planner"); },
  },
  supervisor: {
    get email(): string { return personaEmail("SAQEEL_TEST_SUPERVISOR_EMAIL", "supervisor"); },
    home: "/dashboard",
    get password(): string { return primaryCohortPassword("supervisor"); },
  },
  inspector: {
    get email(): string { return personaEmail("SAQEEL_TEST_INSPECTOR_EMAIL", "inspector"); },
    // Governed 2026-08-03: every role lands on /dashboard after login; /field
    // is reached via navigation, not as the login home. Observed live during
    // this session's auth setup (redirected to /dashboard, not /field).
    home: "/dashboard",
    get password(): string { return sharedPassword("inspector"); },
  },
  reviewer: {
    get email(): string { return personaEmail("SAQEEL_TEST_REVIEWER_EMAIL", "reviewer"); },
    home: "/reviews",
    get password(): string { return primaryCohortPassword("reviewer"); },
  },
  admin: {
    get email(): string { return personaEmail("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", "admin"); },
    home: "/admin",
    get password(): string { return sharedPassword("admin"); },
  },
  ops: {
    get email(): string { return personaEmail("SAQEEL_TEST_OPS_EMAIL", "ops"); },
    home: "/dashboard",
    get password(): string { return sharedPassword("ops"); },
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

// Keep reusable authentication outside Playwright's outputDir. Playwright may
// clear test-results while recovering from a failed worker; storing state
// there makes every later persona test fail with ENOENT instead of reporting
// the original failure.
export const storageStatePath = (key: PersonaKey) => `playwright/.auth/${key}.json`;
