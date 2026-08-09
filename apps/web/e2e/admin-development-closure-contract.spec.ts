import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const webRoot = resolve(__dirname, "..");
const repoRoot = resolve(webRoot, "../..");
const readWeb = (path: string) => readFileSync(join(webRoot, path), "utf8");
const migration = readFileSync(
  join(repoRoot, "supabase/migrations/20260802100000_admin_risk_delegation_closure.sql"),
  "utf8",
);

test.describe("TASK-ADMIN-DEVELOPMENT-CLOSURE-20260802", () => {
  test("admin compliance/config guards use the canonical RLS role keys", () => {
    const guard = readWeb("src/lib/admin-configuration.ts");
    const regulations = readWeb("src/app/(app)/admin/regulations/page.tsx");
    const items = readWeb("src/app/(app)/admin/items/page.tsx");
    const packages = readWeb("src/app/(app)/admin/packages/page.tsx");
    const violations = readWeb("src/app/(app)/admin/violations/page.tsx");
    const localization = readWeb("src/app/(app)/admin/localization/page.tsx");
    for (const source of [guard, regulations, items, packages, violations]) {
      expect(source).toContain("compliance_admin");
      expect(source).toContain("form_admin");
    }
    for (const role of ["compliance_admin", "security_admin", "workflow_admin"]) {
      expect(localization).toContain(role);
    }
    expect(guard).toContain('role === "admin"');
  });

  test("shared Admin account disclosure has a discernible accessible name", () => {
    // AdminShellClient.tsx retired — the account disclosure now lives on the
    // shared shell's account trigger (ShellClient.tsx), same accessible-name
    // shape: local-part-or-display-name plus the role summary.
    const shell = readWeb("src/components/ShellClient.tsx");
    expect(shell).toContain('aria-label={`${accountName} — ${accountRoleSummary}`}');
    expect(shell).toContain('displayName || email.split("@")[0]');
  });
  test("delegation resolves email inside the guarded RPC", () => {
    const actions = readWeb("src/app/(app)/admin/delegation/actions.ts");
    expect(actions).toContain('sb.rpc("create_delegation_by_email"');
    expect(actions).not.toContain('.from("profiles").select("user_id")');
    expect(migration).toContain("return public.create_delegation(v_delegate, p_scope, p_reason, p_starts_at, p_ends_at)");
    expect(migration).toContain("DELEGATION_DELEGATE_NOT_FOUND");
  });

  test("canonical Admin can read the directory and mutate only Admin risk configuration", () => {
    expect(migration).toContain("profiles_read_canonical_admin");
    expect(migration).toContain("engine_write_canonical_admin");
    expect(migration).toContain("public.has_internal_role('admin')");
    expect(migration).not.toMatch(/has_internal_role\('(?:planner|inspector|supervisor)'\).*risk/s);
  });

  test("risk publication is CAS guarded, maker-checker approved, audited, and materializes live settings", () => {
    expect(migration).toContain("stale risk model version — reload and retry");
    expect(migration).toContain("maker-checker: creator cannot approve own model");
    expect(migration).toContain("approval required before publish");
    expect(migration).toContain("set settings = v.payload");
    expect(migration).toContain("where engine = 'risk'");
    expect(migration).toContain("execute function public.audit_row_change()");
    expect(migration).toContain("retirement reason required");
  });

  test("new RPCs remain authenticated-only", () => {
    expect(migration).toContain("revoke all on function public.create_delegation_by_email");
    expect(migration).toContain("grant execute on function public.create_delegation_by_email");
    expect(migration).toContain("revoke all on function public.risk_model_transition");
    expect(migration).toContain("grant execute on function public.risk_model_transition");
  });
});
