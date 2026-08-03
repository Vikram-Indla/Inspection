import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-VIRTUAL-VISIT-E2E-JOURNEY-DA8EC4 — source-contract proof for the
// confirmed live drift reconciliation migration. No browser, no live
// backend: this proves the candidate migration is byte-identical in scope
// to the already-accepted 20260802090000_shared_dashboard_four_roles.sql
// (idempotent re-land, not a new grant) before Final Repair Integration
// applies it to the allowlisted non-production project.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

const ACCEPTED = "supabase/migrations/20260802090000_shared_dashboard_four_roles.sql";
const CANDIDATE = "supabase/migrations/20260804010000_virtual_visit_dashboard_read_drift_reconciliation.sql";

// Every `using (...)` predicate body from the accepted migration, keyed by
// policy name — extracted once and compared verbatim against the candidate.
function extractPredicates(sql: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /create policy (\w+) on public\.(\w+) for select\s*\nusing \(([\s\S]*?)\);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) out[m[1]] = m[3].trim();
  return out;
}

test.describe("TASK-VIRTUAL-VISIT-E2E-JOURNEY-DA8EC4 dashboard-read drift reconciliation", () => {
  test("accepted migration exists and defines exactly the six canonical-dashboard read policies", () => {
    expect(exists(ACCEPTED)).toBe(true);
    const sql = read(ACCEPTED);
    const predicates = extractPredicates(sql);
    expect(Object.keys(predicates).sort()).toEqual([
      "audit_read_canonical_dashboard",
      "checklist_responses_read_canonical_dashboard",
      "geo_read_canonical_dashboard",
      "inspections_read_canonical_dashboard",
      "reviews_read_canonical_dashboard",
      "visits_read_canonical_dashboard",
    ]);
  });

  test("candidate migration is additive-only (no drop table/column/policy-weakening statement)", () => {
    expect(exists(CANDIDATE)).toBe(true);
    const sql = read(CANDIDATE).toLowerCase();
    // Only "drop policy if exists" is allowed (the idempotency guard); no
    // other destructive DDL may appear.
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/drop function/);
    expect(sql).not.toMatch(/disable row level security/);
    expect(sql).not.toMatch(/revoke/);
    const dropPolicyLines = sql.match(/drop policy/g) ?? [];
    const createPolicyLines = sql.match(/create policy/g) ?? [];
    expect(dropPolicyLines.length).toBe(6);
    expect(createPolicyLines.length).toBe(6);
    // Every drop is immediately paired with "if exists" (never an unguarded drop).
    expect((sql.match(/drop policy if exists/g) ?? []).length).toBe(6);
  });

  test("candidate migration's predicates are byte-identical to the accepted migration's — no scope change", () => {
    const accepted = extractPredicates(read(ACCEPTED));
    const candidate = extractPredicates(read(CANDIDATE));
    expect(Object.keys(candidate).sort()).toEqual(Object.keys(accepted).sort());
    for (const policy of Object.keys(accepted)) {
      expect(candidate[policy], `${policy} predicate must match the accepted migration verbatim`).toBe(accepted[policy]);
    }
  });

  test("candidate migration touches only the six named policies — no unrelated table/grant", () => {
    const sql = read(CANDIDATE);
    const targets = new Set(
      [...sql.matchAll(/on public\.(\w+)/g)].map(m => m[1]),
    );
    expect([...targets].sort()).toEqual([
      "audit_events",
      "checklist_responses",
      "geo_events",
      "inspections",
      "reviews",
      "visits",
    ]);
  });
});
