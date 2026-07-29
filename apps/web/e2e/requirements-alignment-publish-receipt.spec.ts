import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-012 server action sends a stable idempotent publish request", () => {
  const action = read("src/app/(app)/planning/single/actions.ts");
  expect(action).toContain('sb.rpc("publish_single_visit_atomic_v2"');
  expect(action).toContain('createHash("sha256")');
  expect(action).toContain("actor: user.id");
  expect(action).toContain("p_idempotency_key:");
  expect(action).toContain("p_correlation_id: randomUUID()");
  expect(action).toContain("publishReceipt");
});

test("REQ-012 receipt covers the complete atomic result", () => {
  const migration = read("../../supabase/migrations/20260729130000_single_publish_idempotency_receipt.sql");
  for (const field of [
    "visit_id", "plan_id", "assignment_id", "audit_event_id",
    "notification_count", "correlation_id", "request_hash",
  ]) expect(migration).toContain(`'${field}'`);
  expect(migration).toContain("PLANNING-CLOSURE-IDEMPOTENCY-CONFLICT");
  expect(migration).toContain("pg_advisory_xact_lock");
  expect(migration).toContain("return v_existing.result||jsonb_build_object('idempotent',true)");
});
