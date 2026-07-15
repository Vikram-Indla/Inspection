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
    const actions = SRC("src/app/admin/regulations/actions.ts");
    // WA-01 — provenance columns are written on publish.
    expect(actions).toMatch(/published_at:\s*new Date\(\)\.toISOString\(\)/);
    expect(actions).toMatch(/approved_by:\s*user\.id/);
    // WA-02 — the update is verified and a 0-row result becomes an error, not ok.
    expect(actions).toMatch(/\.eq\("status",\s*"draft"\)\.select\("id"\)/);
    expect(actions).toMatch(/if\s*\(!data\?\.length\)\s*return\s*\{\s*error:/);
    // Regression guard: the old fire-and-forget "always ok" shape is gone.
    expect(actions).not.toMatch(/update\(\{ status: "published" \}\)\.eq\("id", id\)\.eq\("status", "draft"\);/);
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
