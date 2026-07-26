import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface PixelCredentials {
  email: string;
  password: string;
}

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

// The governed inspector persona under either naming. `inspector@mim.gov.sa` is
// the pre-existing Drive-sourced account; `inspector.test@mim.gov.sa` is the
// per-role QA account this repository's .env.local actually provisions.
const INSPECTOR_PERSONAS = new Set([
  "inspector@mim.gov.sa",
  "inspector.test@mim.gov.sa",
]);

export function loadPixelCredentials(webRoot: string): PixelCredentials {
  const explicit = process.env.PIXEL_ENV_FILE?.trim();
  const candidates = explicit
    ? [resolve(explicit)]
    : [join(webRoot, ".env.local"), join(webRoot, ".env")];
  const fileValues = candidates.reduce<Record<string, string>>(
    (merged, path) => ({ ...merged, ...parseEnvFile(path) }),
    {},
  );
  // PIXEL_* wins when supplied; otherwise fall back to the SAQEEL_TEST_*
  // convention that apps/web/.env.local actually carries, so the harness reads
  // the environment this repository provisions instead of a parallel one.
  const email =
    process.env.PIXEL_INSPECTOR_EMAIL?.trim() ||
    fileValues.PIXEL_INSPECTOR_EMAIL?.trim() ||
    process.env.SAQEEL_TEST_INSPECTOR_EMAIL?.trim() ||
    fileValues.SAQEEL_TEST_INSPECTOR_EMAIL?.trim();
  // The per-role QA accounts carry a genuinely EMPTY password, so "absent" and
  // "empty" are different states here: ?? preserves "" as a real, usable value
  // where || would discard it and fall through to a misleading "unavailable".
  const password =
    process.env.PIXEL_INSPECTOR_PASSWORD ??
    fileValues.PIXEL_INSPECTOR_PASSWORD ??
    process.env.SAQEEL_TEST_PASSWORD ??
    fileValues.SAQEEL_TEST_PASSWORD;
  if (!email || password === undefined) {
    throw new Error(
      "Pixel credentials unavailable. Define PIXEL_INSPECTOR_EMAIL and " +
      "PIXEL_INSPECTOR_PASSWORD, or SAQEEL_TEST_INSPECTOR_EMAIL and " +
      "SAQEEL_TEST_PASSWORD, in apps/web/.env.local, apps/web/.env, or PIXEL_ENV_FILE.",
    );
  }
  if (!INSPECTOR_PERSONAS.has(email.toLowerCase())) {
    throw new Error(
      `Pixel credentials must identify the governed inspector persona; got ${email}.`,
    );
  }
  return { email, password };
}
