#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./lib/manifest.mjs";
import { APPROVED_TARGET_REF, runPreflight } from "./lib/preflight.mjs";
import { safeJson } from "./lib/redact.mjs";

const command = process.argv[2] ?? "preflight";
const preflight = await runPreflight();
if (!preflight.ok) {
  process.stderr.write(safeJson(preflight));
  process.exitCode = 2;
} else if (command === "preflight") {
  process.stdout.write(safeJson(preflight));
} else if (command === "plan") {
  const manifest = buildManifest({
    seedBatchId: process.env.SEED_BATCH_ID,
    anchorDate: process.env.SEED_ANCHOR_DATE,
    runnerCommitSha: process.env.SEED_RUNNER_COMMIT_SHA ?? "UNCOMMITTED",
    targetProjectRef: APPROVED_TARGET_REF,
  });
  if (!process.env.SEED_MANIFEST_PATH) {
    throw new Error("SEED_MANIFEST_PATH is required; manifests must use an authorized evidence path");
  }
  const output = resolve(process.env.SEED_MANIFEST_PATH);
  await writeFile(output, safeJson(manifest), { flag: "wx", mode: 0o600 });
  process.stdout.write(safeJson({
    mode: "plan",
    manifest_path: output,
    manifest_sha256: manifest.manifest_sha256,
    account_count: manifest.account_contract.accounts.length,
    remote_writes: 0,
  }));
} else if (command === "auth-dry-run") {
  execFileSync(process.execPath, [
    fileURLToPath(new URL("./modules/02-auth-admin.mjs", import.meta.url)),
  ], { stdio: "inherit", env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: "" } });
} else {
  throw new Error(`Unknown command: ${command}. Supported: preflight, plan, auth-dry-run`);
}
