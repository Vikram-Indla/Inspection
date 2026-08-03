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
