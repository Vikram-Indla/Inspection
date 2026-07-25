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

export function loadPixelCredentials(webRoot: string): PixelCredentials {
  const explicit = process.env.PIXEL_ENV_FILE?.trim();
  const candidates = explicit
    ? [resolve(explicit)]
    : [join(webRoot, ".env.local"), join(webRoot, ".env")];
  const fileValues = candidates.reduce<Record<string, string>>(
    (merged, path) => ({ ...merged, ...parseEnvFile(path) }),
    {},
  );
  const email =
    process.env.PIXEL_INSPECTOR_EMAIL?.trim() ||
    fileValues.PIXEL_INSPECTOR_EMAIL?.trim();
  const password =
    process.env.PIXEL_INSPECTOR_PASSWORD ||
    fileValues.PIXEL_INSPECTOR_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Pixel credentials unavailable. Define PIXEL_INSPECTOR_EMAIL and " +
      "PIXEL_INSPECTOR_PASSWORD in apps/web/.env.local, apps/web/.env, or PIXEL_ENV_FILE.",
    );
  }
  if (email.toLowerCase() !== "inspector@mim.gov.sa") {
    throw new Error("PIXEL_INSPECTOR_EMAIL must identify the governed inspector persona.");
  }
  return { email, password };
}
