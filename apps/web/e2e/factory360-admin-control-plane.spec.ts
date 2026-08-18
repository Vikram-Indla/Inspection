import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");

test.describe("Factory 360 governed admin control plane", () => {
  test("keeps route and actions behind the exact admin role boundary", () => {
    const layout = read("src/app/(app)/admin/integrations/factory-data/layout.tsx");
    const actions = read("src/app/(app)/admin/integrations/factory-data/actions.ts");
    expect(layout).toContain('<AdminRouteBoundary allowedRoles={["admin"]}>');
    expect(actions).toContain('const ADMIN_ROLES = ["admin"];');
    expect(actions).toContain("ADMIN_ROLES.includes(row.role_key)");
    expect(actions).toContain("requireFactoryDataAdmin");
    expect(actions).toContain('return { error: "admin_role_required"');
  });

  test("stages strict CSV custody without applying source truth", () => {
    const actions = read("src/app/(app)/admin/integrations/factory-data/actions.ts");
    for (const table of ["senaei_sync_runs", "factory_import_batches", "factory_import_rows"]) expect(actions).toContain(`from("${table}")`);
    for (const guard of ["CSV_UNKNOWN_HEADER", "CSV_REQUIRED_HEADER_MISSING", "CSV_COLUMN_COUNT_MISMATCH", "CSV_ROW_LIMIT_EXCEEDED"]) expect(actions).toContain(guard);
    expect(actions).toContain('createHash("sha256")');
    expect(actions).not.toMatch(/from\("(?:commercial_registrations|industrial_licenses|factories)"\)\.upsert/);
    expect(actions).not.toContain("SENAEI_BASE_URL");
  });

  test("exposes retained mutations only in admin and relies on audited RLS tables", () => {
    const controls = ["document-form", "representative-form", "catalog-forms"]
      .map(name => read(`src/components/sections/admin-factory-data/${name}.tsx`))
      .join("\n");
    const actions = read("src/app/(app)/admin/integrations/factory-data/actions.ts");
    const copy = read("src/i18n/locales/en/admin-factory-data.json");
    const migration = fs.readFileSync(path.resolve(webRoot, "../../supabase/migrations/20260720010000_factory360_v2_foundation.sql"), "utf8");
    for (const operation of ["document", "representative", "product", "material", "representative_status"]) expect(controls).toContain(`value="${operation}"`);
    for (const field of ["reference_no", "valid_from", "valid_to", "annual_capacity", "is_primary", "full_name", "role_title", "phone", "email", "source", "hs_code"]) expect(controls).toContain(`name="${field}"`);
    expect(actions).toContain("validTo < validFrom");
    expect(actions).toContain("annualCapacity < 0");
    expect(actions).toContain("mapFactoryError(error, \"update\")");
    expect(copy).toContain("Factory 360 profiles are read-only");
    expect(copy).toContain("SENAEI_API_CONTRACT_NOT_SUPPLIED");
    for (const table of ["senaei_sync_runs", "factory_import_batches", "factory_import_rows"]) expect(migration).toContain(`'${table}'`);
    expect(migration).toContain("audit_row_change()");
  });

  test("shows provider, batch, rejected-row and reconciliation truth separately", () => {
    const copy = read("src/i18n/locales/en/admin-factory-data.json");
    for (const heading of ["Senaei provider", "CSV staging and validation", "Sync and import history", "Rejected staged rows", "Reconciliation history"]) expect(copy).toContain(heading);
    expect(copy).toContain("No remote call is made from this page");
    expect(copy).toContain("Staged does not mean imported");
  });
});
