import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { login, rest } from "./live-rest";
import { PERSONAS } from "./personas";

// CD-006 / SCR-ADM-011 · M09-001 — publishRegulation provenance + honest no-op.
// ---------------------------------------------------------------------------
// Source-level contract (the repo has no compliance_admin/form_admin persona, so
// the positive publish path cannot be driven end-to-end here — same constraint as
// cd-041-virtual-backend.spec.ts). Paired with a live RLS negative that proves a
// non-admin cannot publish, which is the branch WA-02's no-op error path guards.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.describe("CD-006 regulation publish — provenance + honest no-op", () => {
  test("publishRegulation records approval provenance and reports honestly on no-op (WA-01/WA-02)", () => {
    // Obsolete-test fix (Cycle 2 completion pass): publishRegulation() moved
    // from a direct client-side .update() to a maker-checker RPC
    // (publish_regulation, supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql)
    // — a strictly stronger implementation of the same WA-01/WA-02 contract
    // (atomic, DB-enforced distinct-approver check, raises rather than
    // silently no-opping). Assertions updated to the current layer instead
    // of the superseded client-side pattern.
    const actions = SRC("src/app/(app)/admin/regulations/actions.ts");
    const rpc = SRC("../../supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql");
    // WA-01 — provenance columns are written on publish, now inside the RPC.
    expect(rpc).toMatch(/approved_by\s*=\s*auth\.uid\(\)/);
    expect(rpc).toMatch(/published_at\s*=\s*now\(\)/);
    // Maker-checker: the creator cannot approve their own draft.
    expect(rpc).toMatch(/created_by\s*=\s*auth\.uid\(\)\s*then\s*raise exception/);
    // WA-02 — a non-draft/missing regulation raises, it does not silently no-op.
    expect(rpc).toMatch(/not found or v_new\.status\s*<>\s*'draft'\s*then\s*raise exception/);
    // The server action calls the RPC and surfaces its error, never a false ok.
    expect(actions).toMatch(/sb\.rpc\("publish_regulation"/);
    expect(actions).toMatch(/if\s*\(error\)\s*\{/);
  });

  test("a non-admin (planner) cannot publish a regulation — RLS is the write authority (WA-02 path is reachable)", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    // regulations_admin RLS = has_any_role(['compliance_admin','form_admin']); a
    // planner update returns no representation. This is exactly the state the
    // action now surfaces as an error instead of a false { ok: true }.
    const res = await rest(
      "PATCH",
      "regulations?status=eq.draft&limit=1",
      planner.jwt,
      { status: "published" },
      "return=representation",
    );
    // Either RLS denies (error) or the update matches/affects no visible row (empty array).
    const empty = Array.isArray(res.data) && res.data.length === 0;
    expect(res.error !== null || empty).toBeTruthy();
  });
});
