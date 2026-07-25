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
// To run persona specs, set these in apps/web/.env.local (gitignored),
// apps/web/.env, or the process environment:
//   E2E_PLANNER_PASSWORD   E2E_INSPECTOR_PASSWORD   E2E_REVIEWER_PASSWORD
//   E2E_ADMIN_PASSWORD     E2E_OPS_PASSWORD
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
function requirePassword(envVar: string, persona: string): string {
  const value = process.env[envVar] || envValues()[envVar];
  if (!value) {
    throw new Error(
      `Persona "${persona}" has no password. Set ${envVar} in apps/web/.env.local, ` +
      `apps/web/.env, or E2E_ENV_FILE. Credentials are no longer committed to this repository.`,
    );
  }
  return value;
}

export const PERSONAS = {
  planner: {
    email: "planner@mim.gov.sa",
    home: "/planning",
    get password(): string { return requirePassword("E2E_PLANNER_PASSWORD", "planner"); },
  },
  inspector: {
    email: "inspector@mim.gov.sa",
    home: "/field",
    get password(): string { return requirePassword("E2E_INSPECTOR_PASSWORD", "inspector"); },
  },
  reviewer: {
    email: "reviewer@mim.gov.sa",
    home: "/reviews",
    get password(): string { return requirePassword("E2E_REVIEWER_PASSWORD", "reviewer"); },
  },
  admin: {
    email: "admin@mim.gov.sa",
    home: "/admin",
    get password(): string { return requirePassword("E2E_ADMIN_PASSWORD", "admin"); },
  },
  ops: {
    email: "ops@mim.gov.sa",
    home: "/dashboard",
    get password(): string { return requirePassword("E2E_OPS_PASSWORD", "ops"); },
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

// Keep reusable authentication outside Playwright's outputDir. Playwright may
// clear test-results while recovering from a failed worker; storing state
// there makes every later persona test fail with ENOENT instead of reporting
// the original failure.
export const storageStatePath = (key: PersonaKey) => `playwright/.auth/${key}.json`;
