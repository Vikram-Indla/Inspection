import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./provision_cross_role_identities.mjs", import.meta.url), "utf8");

test("cross-role provisioning is production-refused and confirmation-gated", () => {
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /projectRef !== APPROVED_REF/);
  assert.match(source, /CONFIRM_PERSISTENT_NONPRODUCTION_ACCESS/);
  assert.match(source, /CONFIRM_ROTATE_FIVE_NONPRODUCTION_IDENTITIES/);
  assert.match(source, /CROSS_ROLE_REFUSED: SAQEEL_CROSS_ROLE_PASSWORD is required/);
  assert.doesNotMatch(source, /randomBytes|generated.*password/i);
});

test("rotation is restricted to the five owned accounts and globally revokes their sessions", () => {
  assert.match(source, /for \(const account of accounts\)/);
  assert.match(source, /\/auth\/v1\/admin\/users\/\$\{account\.id\}/);
  assert.match(source, /\/auth\/v1\/logout\?scope=global/);
  assert.doesNotMatch(source, /SAQEEL_TEST_INSPECTOR_EMAIL[^\n]+password/);
});

test("ordinary replay skips matching auth metadata instead of rewriting it", () => {
  assert.match(source, /metadataMatches\(byId\.app_metadata, metadataFor\(account\)\)/);
  assert.match(source, /auth_metadata_updated/);
  assert.match(source, /passwords_rotated/);
});

test("cross-role identities use app_metadata and never assign authorization through user metadata", () => {
  assert.match(source, /app_metadata: metadataFor\(account\)/);
  assert.match(source, /user_metadata: \{\}/);
  assert.doesNotMatch(source, /user_metadata:\s*\{[^}]+/);
});

test("pack contains five new identities, canonical grants, multi-role and refusal personas", () => {
  assert.match(source, /alias: "admin"/);
  assert.match(source, /alias: "planner"/);
  assert.match(source, /alias: "supervisor"/);
  assert.match(source, /alias: "multi_role"/);
  assert.match(source, /roles: \["planner", "supervisor"\]/);
  assert.match(source, /alias: "no_workspace"/);
  assert.match(source, /roles: \[\]/);
  assert.equal((source.match(/email: "/g) ?? []).length, 5);
});

test("accepted workbook profiles replay only with exact identity and scope", () => {
  assert.match(source, /existing\.email === expected\.email/);
  assert.match(source, /existing\.region === expected\.region/);
  assert.match(source, /existing\.org_scope === expected\.org_scope/);
  assert.match(source, /existing\.account_status === expected\.account_status/);
  assert.match(source, /Boolean\(existing\.full_name\?\.trim\(\)\)/);
});

test("existing Inspector is authenticated but never reconciled or modified", () => {
  assert.match(source, /setting\("SAQEEL_TEST_INSPECTOR_EMAIL"\)/);
  assert.match(source, /setting\("SAQEEL_TEST_PASSWORD", true\)/);
  assert.match(source, /login\(inspectorEmail, inspectorPassword\)/);
  assert.doesNotMatch(source, /SAQEEL_TEST_INSPECTOR_EMAIL[^\n]+admin\/users/);
});

test("evidence is secret-safe and ignored local state carries the manifest", () => {
  assert.match(source, /\.local-inputs\/cross-role-cert-v1\.manifest\.json/);
  assert.match(source, /id_hash: digest\(account\.id\)/);
  assert.doesNotMatch(source, /console\.log\([^)]*(password|serviceRole|jwt)/i);
});

test("all five headed setup personas use the governed primary-cohort password reference", () => {
  const personas = readFileSync(new URL("../../apps/web/e2e/personas.ts", import.meta.url), "utf8");
  assert.match(personas, /primaryCohortPassword = \(persona: string\) => requireSetting\("SAQEEL_CROSS_ROLE_PASSWORD", persona\)/);
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("planner"\); \}/);
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("supervisor"\); \}/);
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("reviewer"\); \}/);
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("admin"\); \}/);
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("inspector"\); \}/);
  assert.doesNotMatch(personas, /password\(\): string \{ return sharedPassword\("(?:admin|inspector)"\); \}/);
});

test("Admin-only repair is explicit, existing-identity-only and does not rotate the cohort", () => {
  assert.match(source, /CONFIRM_REPAIR_EXISTING_NONPRODUCTION_ADMIN/);
  assert.match(source, /repairAdmin && rotateOwnedPasswords/);
  assert.match(source, /governed existing Admin identity is absent or ambiguous/);
  assert.match(source, /if \(repairAdmin\) \{\s*await repairExistingAdmin\(\);\s*process\.exit\(0\);/);
  assert.match(source, /persistLocalSetting\("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", account\.email\)/);
  assert.doesNotMatch(source.slice(source.indexOf("async function repairExistingAdmin"), source.indexOf("async function certify")), /\/auth\/v1\/admin\/users[^`]*method: "POST"/);
});

test("Admin-only repair verifies login, exact role and organization scope without secret output", () => {
  const repair = source.slice(source.indexOf("async function repairExistingAdmin"), source.indexOf("async function certify"));
  assert.match(source, /verified\.user_id !== account\.id/);
  assert.match(source, /profile\[0\]\.region !== account\.region/);
  assert.match(source, /profile\[0\]\.org_scope !== account\.org_scope/);
  assert.match(source, /roles\.length !== 1 \|\| roles\[0\]\.role_key !== "admin"/);
  assert.match(source, /nonproduction_admin_identity_reconciled/);
  assert.match(source, /identity_hash: digest\(account\.id\)/);
  assert.doesNotMatch(repair.slice(repair.indexOf("process.stdout.write")), /password|serviceRole|jwt/);
});

test("golden-journey Admin uses the governed primary-cohort password reference", () => {
  const personas = readFileSync(new URL("../../apps/web/e2e/personas.ts", import.meta.url), "utf8");
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("admin"\); \}/);
  assert.doesNotMatch(personas, /password\(\): string \{ return sharedPassword\("admin"\); \}/);
});

test("golden journey selects the approved existing cross-role alternate Inspector", () => {
  const personas = readFileSync(new URL("../../apps/web/e2e/personas.ts", import.meta.url), "utf8");
  assert.match(personas, /SAQEEL_TEST_MULTI_ROLE_EMAIL", "golden alternate inspector"/);
  assert.match(personas, /primaryCohortPassword\("golden alternate inspector"\)/);
});

test("Admin-only repair is explicit, existing-identity-only and does not rotate the cohort", () => {
  assert.match(source, /CONFIRM_REPAIR_EXISTING_NONPRODUCTION_ADMIN/);
  assert.match(source, /repairAdmin && rotateOwnedPasswords/);
  assert.match(source, /governed existing Admin identity is absent or ambiguous/);
  assert.match(source, /if \(repairAdmin\) \{\s*await repairExistingAdmin\(\);\s*process\.exit\(0\);/);
  assert.match(source, /persistLocalSetting\("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", account\.email\)/);
  assert.doesNotMatch(source.slice(source.indexOf("async function repairExistingAdmin"), source.indexOf("async function certify")), /\/auth\/v1\/admin\/users[^`]*method: "POST"/);
});

test("Admin-only repair verifies login, exact role and organization scope without secret output", () => {
  const repair = source.slice(source.indexOf("async function repairExistingAdmin"), source.indexOf("async function certify"));
  assert.match(source, /verified\.user_id !== account\.id/);
  assert.match(source, /profile\[0\]\.region !== account\.region/);
  assert.match(source, /profile\[0\]\.org_scope !== account\.org_scope/);
  assert.match(source, /roles\.length !== 1 \|\| roles\[0\]\.role_key !== "admin"/);
  assert.match(source, /nonproduction_admin_identity_reconciled/);
  assert.match(source, /identity_hash: digest\(account\.id\)/);
  assert.doesNotMatch(repair.slice(repair.indexOf("process.stdout.write")), /password|serviceRole|jwt/);
});

test("golden-journey Admin uses the governed primary-cohort password reference", () => {
  const personas = readFileSync(new URL("../../apps/web/e2e/personas.ts", import.meta.url), "utf8");
  assert.match(personas, /password\(\): string \{ return primaryCohortPassword\("admin"\); \}/);
  assert.doesNotMatch(personas, /password\(\): string \{ return sharedPassword\("admin"\); \}/);
});

test("golden journey selects the approved existing cross-role alternate Inspector", () => {
  const personas = readFileSync(new URL("../../apps/web/e2e/personas.ts", import.meta.url), "utf8");
  assert.match(personas, /SAQEEL_TEST_MULTI_ROLE_EMAIL", "golden alternate inspector"/);
  assert.match(personas, /primaryCohortPassword\("golden alternate inspector"\)/);
});
