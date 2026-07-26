import { createHash } from "node:crypto";
import { buildAccountPlan, CANONICAL_ROLES } from "./accounts.mjs";
import { DRIVE_PACKAGE } from "./preflight.mjs";
import { redact } from "./redact.mjs";

export function buildManifest({ seedBatchId, anchorDate, runnerCommitSha, targetProjectRef }) {
  const accounts = buildAccountPlan(seedBatchId);
  const manifest = {
    schema_version: "1.0",
    seed_batch_id: seedBatchId,
    anchor_date: anchorDate,
    profile: "demo",
    runner_commit_sha: runnerCommitSha,
    target_project_ref: targetProjectRef,
    drive_package: DRIVE_PACKAGE,
    account_contract: {
      expected_total: 39,
      expected_per_role: 3,
      canonical_roles: CANONICAL_ROLES,
      accounts,
    },
    write_scope: {
      auth_admin: "planned",
      profiles: "blocked_until_canonical_bootstrap_proven",
      role_grants: "blocked_until_security_admin_rpc_session",
      domain_rows: "not_implemented",
    },
    secret_references: {
      auth_admin: "operator-supplied via SEED_CREDENTIALS_FD",
    },
  };
  const canonical = JSON.stringify(redact(manifest));
  return {
    ...manifest,
    manifest_sha256: createHash("sha256").update(canonical).digest("hex"),
  };
}
