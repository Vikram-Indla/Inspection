import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const login = fs.readFileSync(path.join(webRoot, "src/app/login/field/FieldLoginClient.tsx"), "utf8");
const seeder = fs.readFileSync(path.join(webRoot, "scripts/seed-demo-admin.mjs"), "utf8");
const pkg = fs.readFileSync(path.join(webRoot, "package.json"), "utf8");

test.describe("DEMO-ADMIN-ALIAS-001", () => {
  test("maps only the explicit demo alias to its Supabase email identity", () => {
    expect(login).toContain('id.toLocaleLowerCase() === "admin1" ? "admin1@mim.gov.sa" : id');
    expect(login).toContain("auth.signInWithPassword({");
    expect(login).toContain("email,");
    expect(login).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("seeder is environment-guarded, idempotent, and assigns the six admin roles", () => {
    expect(seeder).toContain("SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN");
    expect(seeder).toContain("SEED_ALLOWED_PROJECT_REF");
    expect(seeder).toContain("DEMO_ADMIN_PASSWORD");
    expect(seeder).toContain("resolution=merge-duplicates");
    for (const role of ["compliance_admin", "form_admin", "workflow_admin", "security_admin", "gis_admin", "risk_owner"]) {
      expect(seeder).toContain(`"${role}"`);
    }
    expect(seeder).not.toContain("password: \"admin1\"");
    expect(seeder).not.toContain("service_role");
  });

  test("package exposes the reproducible demo-admin seed command", () => {
    expect(pkg).toContain('"seed:demo-admin": "node scripts/seed-demo-admin.mjs"');
  });
});
