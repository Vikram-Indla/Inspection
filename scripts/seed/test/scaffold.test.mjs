import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildAccountPlan, CANONICAL_ROLES } from "../lib/accounts.mjs";
import { buildManifest } from "../lib/manifest.mjs";
import { DRIVE_PACKAGE, projectRefFromUrl, runPreflight } from "../lib/preflight.mjs";
import { redact, safeJson } from "../lib/redact.mjs";

test("account plan is deterministic and exactly 3 x 13", () => {
  const first = buildAccountPlan("demo-batch-001");
  const second = buildAccountPlan("demo-batch-001");
  assert.deepEqual(first, second);
  assert.equal(first.length, 39);
  assert.equal(new Set(first.map(row => row.id)).size, 39);
  assert.equal(new Set(first.map(row => row.email)).size, 39);
  for (const role of CANONICAL_ROLES) {
    assert.equal(first.filter(row => row.role_key === role).length, 3);
  }
  assert.ok(first.every(row => row.email.endsWith("@mim-inspection.test")));
});
test("manifest contains no credentials and preserves exact account contract", () => {
  const manifest = buildManifest({
    seedBatchId: "demo-batch-001",
    anchorDate: "2026-07-26",
    runnerCommitSha: "abc123",
    targetProjectRef: "iiozvqntawxfwbgffzqu",
  });
  assert.equal(manifest.account_contract.accounts.length, 39);
  assert.equal(manifest.write_scope.profiles, "blocked_until_canonical_bootstrap_proven");
  assert.doesNotMatch(safeJson(manifest), /MimAdmin|Bearer eyJ/);
});

test("redaction removes nested secrets and JWT-shaped strings", () => {
  const value = redact({
    password: "do-not-print",
    nested: { serviceRoleKey: "do-not-print", ok: "visible" },
    jwt: "eyJaaaaaaaa.eyJbbbbbbbb.cccccccccc",
  });
  assert.equal(value.password, "[REDACTED]");
  assert.equal(value.nested.serviceRoleKey, "[REDACTED]");
  assert.equal(value.nested.ok, "visible");
  assert.equal(value.jwt, "[REDACTED]");
});

test("project ref extraction rejects unrelated hosts", () => {
  assert.equal(
    projectRefFromUrl("https://iiozvqntawxfwbgffzqu.supabase.co"),
    "iiozvqntawxfwbgffzqu",
  );
  assert.equal(projectRefFromUrl("https://example.com"), null);
});

test("preflight fails closed on a package hash mismatch", async () => {
  const directory = await mkdtemp(join(tmpdir(), "seed-preflight-"));
  const packagePath = join(directory, "handoff.zip");
  await writeFile(packagePath, "wrong bytes");
  const result = await runPreflight({
    NODE_ENV: "test",
    NEXT_PUBLIC_SUPABASE_URL: "https://iiozvqntawxfwbgffzqu.supabase.co",
    SEED_ALLOWED_PROJECT_REF: "iiozvqntawxfwbgffzqu",
    SEED_BATCH_ID: "demo-batch-001",
    SEED_ANCHOR_DATE: "2026-07-26",
    SEED_DRIVE_PACKAGE_PATH: packagePath,
  });
  assert.equal(result.ok, false);
  assert.equal(result.refusal_token, "SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN");
  assert.ok(result.failures.includes("Drive package size or SHA-256 mismatch"));
  assert.notEqual(DRIVE_PACKAGE.sha256, "");
});
