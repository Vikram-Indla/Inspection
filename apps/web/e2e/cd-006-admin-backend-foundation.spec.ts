import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.describe("CD-006..011 admin backend foundation", () => {
  test("all configuration mutations use the common fail-closed write guard", () => {
    for (const path of [
      "src/app/(app)/admin/regulations/actions.ts",
      "src/app/(app)/admin/items/actions.ts",
      "src/app/(app)/admin/packages/actions.ts",
    ]) {
      const content = src(path);
      expect(content).toContain('from "@/lib/admin-configuration"');
      expect(content).toContain("requireConfigurationWriter()");
      expect(content).toContain("NEUTRAL_WRITE_ERROR");
      expect(content).toContain("logProviderError(");
      expect(content).not.toMatch(/return \{ error: error\.message \}/);
    }
    const violations = src("src/app/(app)/admin/violations/actions.ts");
    for (const mutation of [
      "createViolationCode",
      "deactivateViolationCode",
      "publishViolationCode",
      "createPenaltyMapping",
      "publishPenaltyMapping",
    ]) {
      expect(violations).toContain(`export async function ${mutation}`);
    }
    expect(violations.match(/return \{ error: CCR_REQUIRED \};/g)?.length).toBe(5);
    expect(violations).not.toMatch(/\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
  });

  test("the guard only admits the configuration roles and returns neutral failures", () => {
    const guard = src("src/lib/admin-configuration.ts");
    expect(guard).toContain('role === "compliance_admin" || role === "form_admin"');
    expect(guard).toContain("Your permissions could not be verified. Try again.");
    expect(guard).toContain("The change could not be saved. Review the fields and try again.");
  });

  test("the forward migration adds append-only audit coverage for previously untracked configuration records", () => {
    const migration = src("../../supabase/migrations/20260715173000_admin_configuration_audit.sql");
    for (const table of ["regulation_clauses", "inspection_items", "violation_codes", "penalty_mappings"]) {
      expect(migration).toContain(`'${table}'`);
    }
    expect(migration).toContain("execute function audit_row_change()");
  });

  test("regulation publishing validates clause consumers and the database protects published records", () => {
    const auditMigration = src("../../supabase/migrations/20260715173000_admin_configuration_audit.sql");
    const fourRoleMigration = src("../../supabase/migrations/20260729003741_four_role_package_configuration_authority.sql");
    expect(fourRoleMigration).toContain("create or replace function public.publish_regulation(p_regulation_id uuid)");
    expect(fourRoleMigration).toContain("every regulation clause must map to an inspection item");
    expect(fourRoleMigration).toContain("maker-checker requires a distinct approver");
    expect(fourRoleMigration).toContain("set status = 'published', approved_by = auth.uid()");
    expect(auditMigration).toContain("regulations_maker_checker");
    expect(auditMigration).toContain("trg_guard_published_regulation");
  });
});
