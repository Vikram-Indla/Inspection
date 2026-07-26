import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const APPROVED_TARGET_REF = "iiozvqntawxfwbgffzqu";
export const DRIVE_PACKAGE = Object.freeze({
  id: "1yKyVhgCWoUyX_fjDtwz1OwxHi7C1YYxK",
  size_bytes: 183726,
  sha256: "350fb8f7443692173dae6c8c2fc1ffb71aaf79eb481663834db90b86cae64f3a",
});
export const REFUSAL = "SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN";

export function projectRefFromUrl(url) {
  const parsed = new URL(url);
  const match = parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
  return match?.[1] ?? null;
}
export async function sha256File(path) {
  const bytes = await readFile(path);
  return {
    size_bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function runPreflight(env = process.env) {
  const failures = [];
  if (env.NODE_ENV === "production") failures.push("NODE_ENV is production");
  if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    failures.push("service-role credential must never use a NEXT_PUBLIC_* name");
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  let resolvedProjectRef = null;
  try {
    resolvedProjectRef = projectRefFromUrl(url);
  } catch {
    failures.push("Supabase URL is absent or invalid");
  }
  if (resolvedProjectRef !== APPROVED_TARGET_REF) {
    failures.push("resolved project ref does not equal the approved target");
  }
  if (env.SEED_ALLOWED_PROJECT_REF !== APPROVED_TARGET_REF) {
    failures.push("SEED_ALLOWED_PROJECT_REF does not equal the approved target");
  }

  const packagePath = env.SEED_DRIVE_PACKAGE_PATH;
  let packageEvidence = null;
  if (!packagePath) {
    failures.push("SEED_DRIVE_PACKAGE_PATH is required for byte-level provenance");
  } else {
    try {
      packageEvidence = await sha256File(packagePath);
      if (
        packageEvidence.size_bytes !== DRIVE_PACKAGE.size_bytes ||
        packageEvidence.sha256 !== DRIVE_PACKAGE.sha256
      ) {
        failures.push("Drive package size or SHA-256 mismatch");
      }
    } catch {
      failures.push("Drive package cannot be read");
    }
  }

  for (const name of ["SEED_BATCH_ID", "SEED_ANCHOR_DATE"]) {
    if (!env[name]?.trim()) failures.push(`${name} is required`);
  }

  return {
    ok: failures.length === 0,
    refusal_token: failures.length ? REFUSAL : null,
    failures,
    target_project_ref: resolvedProjectRef,
    drive_package: {
      id: DRIVE_PACKAGE.id,
      ...packageEvidence,
    },
  };
}
