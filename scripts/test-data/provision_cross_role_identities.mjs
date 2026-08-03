#!/usr/bin/env node
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BATCH = "CROSS_ROLE_CERT_V1";
const APPROVED_REF = "iiozvqntawxfwbgffzqu";
const APPLY_ACK = "CONFIRM_PERSISTENT_NONPRODUCTION_ACCESS";
const ROTATE_ACK = "CONFIRM_ROTATE_FIVE_NONPRODUCTION_IDENTITIES";
const REPAIR_ADMIN_ACK = "CONFIRM_REPAIR_EXISTING_NONPRODUCTION_ADMIN";
const apply = process.argv.includes("--apply");
const rotateOwnedPasswords = process.argv.includes("--rotate-owned-passwords");
const repairAdmin = process.argv.includes("--repair-admin");
const envPath = resolve(process.env.E2E_ENV_FILE || "apps/web/.env.local");
const manifestPath = resolve(".local-inputs/cross-role-cert-v1.manifest.json");

function parseEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1)]; }));
}
const fileEnv = parseEnv(envPath);
const setting = (name, allowEmpty = false) => {
  const present = Object.hasOwn(process.env, name) || Object.hasOwn(fileEnv, name);
  const value = Object.hasOwn(process.env, name) ? process.env[name] : fileEnv[name];
  if (!present || (!allowEmpty && !value?.trim())) throw new Error(`CROSS_ROLE_REFUSED: ${name} is required`);
  return value;
};
const url = setting("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = setting("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRole = setting("SUPABASE_SERVICE_ROLE_KEY");
const projectRef = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
if (process.env.NODE_ENV === "production" || projectRef !== APPROVED_REF) {
  throw new Error("CROSS_ROLE_REFUSED: target is not the approved non-production project");
}
if (apply && process.env.CROSS_ROLE_IDENTITY_APPLY !== APPLY_ACK) {
  throw new Error("CROSS_ROLE_REFUSED: persistent-access acknowledgement is absent");
}
if (rotateOwnedPasswords && (!apply || process.env.CROSS_ROLE_PASSWORD_ROTATION !== ROTATE_ACK)) {
  throw new Error("CROSS_ROLE_REFUSED: five-identity password-rotation acknowledgement is absent");
}
if (repairAdmin && (!apply || process.env.CROSS_ROLE_ADMIN_REPAIR !== REPAIR_ADMIN_ACK)) {
  throw new Error("CROSS_ROLE_REFUSED: existing Admin repair acknowledgement is absent");
}
if (repairAdmin && rotateOwnedPasswords) {
  throw new Error("CROSS_ROLE_REFUSED: Admin-only repair cannot rotate the full identity cohort");
}

const accounts = [
  { alias: "admin", id: "a1000000-0000-4000-8000-000000000001", email: "admin1@local.saqeel.test", roles: ["admin"], full_name: "Cross-role certification Admin", region: "Riyadh", org_scope: "national" },
  { alias: "planner", id: "a2000000-0000-4000-8000-000000000001", email: "planner1@local.saqeel.test", roles: ["planner"], full_name: "Cross-role certification Planner", region: "Riyadh", org_scope: "regional" },
  { alias: "supervisor", id: "a3000000-0000-4000-8000-000000000001", email: "supervisor1@local.saqeel.test", roles: ["supervisor"], full_name: "Cross-role certification Supervisor", region: "Riyadh", org_scope: "regional" },
  { alias: "multi_role", id: "a5000000-0000-4000-8000-000000000001", email: "multi-role@local.saqeel.test", roles: ["planner", "supervisor"], full_name: "Cross-role certification Multi-role", region: "Riyadh", org_scope: "regional" },
  { alias: "no_workspace", id: "a6000000-0000-4000-8000-000000000001", email: "no-workspace@local.saqeel.test", roles: [], full_name: "Cross-role certification No-workspace", region: null, org_scope: null },
];
const serviceHeaders = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" };
const anonHeaders = jwt => ({ apikey: anonKey, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" });
const scrub = text => text.replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");

function persistLocalSetting(name, value) {
  let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  text = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(envPath, text, { mode: 0o600 });
  chmodSync(envPath, 0o600);
}

function resolvePassword() {
  const current = Object.hasOwn(process.env, "SAQEEL_CROSS_ROLE_PASSWORD")
    ? process.env.SAQEEL_CROSS_ROLE_PASSWORD
    : fileEnv.SAQEEL_CROSS_ROLE_PASSWORD;
  if (current?.trim()) return current;
  throw new Error("CROSS_ROLE_REFUSED: SAQEEL_CROSS_ROLE_PASSWORD is required");
}
const password = apply ? resolvePassword() : null;

async function fetchJson(path, { method = "GET", headers = serviceHeaders, body, prefer } = {}) {
  const response = await fetch(`${url}${path}`, {
    method, headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} failed: HTTP ${response.status} ${scrub(text).slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function login(email, loginPassword = password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: loginPassword }),
  });
  if (!response.ok) throw new Error(`CROSS_ROLE_AUTH_FAILED: ${response.status}`);
  const body = await response.json();
  return { jwt: body.access_token, user_id: body.user.id };
}
async function canLogin(email, loginPassword = password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: loginPassword }),
  });
  if (response.ok) return true;
  if (response.status === 400) return false;
  throw new Error(`CROSS_ROLE_AUTH_PROBE_FAILED: ${response.status}`);
}
async function revokeAllSessions(jwt) {
  const response = await fetch(`${url}/auth/v1/logout?scope=global`, {
    method: "POST", headers: anonHeaders(jwt),
  });
  if (!response.ok) throw new Error(`CROSS_ROLE_SESSION_REVOCATION_FAILED: ${response.status}`);
}
const digest = value => createHash("sha256").update(value).digest("hex").slice(0, 12);
const metadataFor = account => ({ data_mode: "NONPRODUCTION_SYNTHETIC", seed_batch_id: BATCH, roles: account.roles, region: account.region, org_scope: account.org_scope });
const metadataMatches = (actual, expected) => Object.entries(expected).every(([key, value]) => JSON.stringify(actual?.[key] ?? null) === JSON.stringify(value));

async function authInventory() {
  const response = await fetchJson("/auth/v1/admin/users?page=1&per_page=1000");
  return response.users ?? [];
}
async function reconcileProfile(account, created) {
  const rows = await fetchJson(`/rest/v1/profiles?select=user_id,full_name,email,region,org_scope,account_status&user_id=eq.${account.id}`);
  const expected = { user_id: account.id, full_name: account.full_name, email: account.email, region: account.region, org_scope: account.org_scope, account_status: "active" };
  if (rows.length) {
    const existing = rows[0];
    const compatible = existing.user_id === expected.user_id &&
      existing.email === expected.email &&
      existing.region === expected.region &&
      existing.org_scope === expected.org_scope &&
      existing.account_status === expected.account_status &&
      Boolean(existing.full_name?.trim());
    if (!compatible) throw new Error(`CROSS_ROLE_PROFILE_COLLISION: ${account.alias}`);
    return false;
  }
  await fetchJson("/rest/v1/profiles", { method: "POST", body: expected, prefer: "return=minimal" });
  await fetchJson("/rest/v1/audit_events", { method: "POST", body: {
    actor: accounts[0].id, object_type: "profiles", object_id: account.id,
    action: "nonproduction_profile_bootstrap", before_state: null,
    after_state: { seed_batch_id: BATCH, alias: account.alias, created_auth_identity: created, region: account.region, org_scope: account.org_scope },
    requirement_refs: ["MVP1-FND-001", "RBAC-001"],
  }, prefer: "return=minimal" });
  return true;
}
async function grantBootstrapAdmin() {
  const rows = await fetchJson(`/rest/v1/user_roles?select=user_id,role_key&user_id=eq.${accounts[0].id}&role_key=eq.admin`);
  if (rows.length) return false;
  await fetchJson("/rest/v1/user_roles", { method: "POST", body: { user_id: accounts[0].id, role_key: "admin", granted_by: accounts[0].id }, prefer: "return=minimal" });
  await fetchJson("/rest/v1/audit_events", { method: "POST", body: {
    actor: accounts[0].id, object_type: "user_roles", object_id: accounts[0].id,
    action: "nonproduction_bootstrap_admin_grant", before_state: null,
    after_state: { seed_batch_id: BATCH, role_key: "admin" }, requirement_refs: ["EXE-ACCESS", "CANONICAL-ROLE-001"],
  }, prefer: "return=minimal" });
  return true;
}
async function rpc(name, jwt, body) {
  return fetchJson(`/rest/v1/rpc/${name}`, { method: "POST", headers: anonHeaders(jwt), body });
}
function persistIgnoredReferences() {
  const updates = {
    SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL: accounts[0].email,
    SAQEEL_TEST_PLANNER_EMAIL: accounts[1].email,
    SAQEEL_TEST_SUPERVISOR_EMAIL: accounts[2].email,
    SAQEEL_TEST_REVIEWER_EMAIL: accounts[2].email,
    SAQEEL_TEST_MULTI_ROLE_EMAIL: accounts[3].email,
    SAQEEL_TEST_NO_WORKSPACE_EMAIL: accounts[4].email,
    CROSS_ROLE_IDENTITY_BATCH: BATCH,
    CROSS_ROLE_ALLOWED_PROJECT_REF: APPROVED_REF,
  };
  for (const [key, value] of Object.entries(updates)) {
    persistLocalSetting(key, value);
  }
}

async function repairExistingAdmin() {
  const account = accounts[0];
  const existingUsers = await authInventory();
  const byId = existingUsers.find(user => user.id === account.id);
  const byEmail = existingUsers.find(user => user.email === account.email);
  if (!byId || !byEmail || byId !== byEmail) {
    throw new Error("CROSS_ROLE_ADMIN_REPAIR_REFUSED: governed existing Admin identity is absent or ambiguous");
  }
  const counters = { password_reconciled: 0, metadata_reconciled: 0, profile_created: 0, role_created: 0, sessions_revoked: 0 };
  const passwordMatches = await canLogin(account.email);
  const metadataMatchesExpected = metadataMatches(byId.app_metadata, metadataFor(account));
  if (!passwordMatches || !metadataMatchesExpected) {
    await fetchJson(`/auth/v1/admin/users/${account.id}`, { method: "PUT", body: {
      ...(!passwordMatches ? { password } : {}),
      ...(!metadataMatchesExpected ? { app_metadata: metadataFor(account) } : {}),
    } });
    counters.password_reconciled = passwordMatches ? 0 : 1;
    counters.metadata_reconciled = metadataMatchesExpected ? 0 : 1;
  }
  if (await reconcileProfile(account, false)) counters.profile_created += 1;
  if (await grantBootstrapAdmin()) counters.role_created += 1;
  if (!passwordMatches) {
    const rotated = await login(account.email);
    await revokeAllSessions(rotated.jwt);
    counters.sessions_revoked += 1;
  }
  const verified = await login(account.email);
  if (verified.user_id !== account.id) throw new Error("CROSS_ROLE_ADMIN_REPAIR_REFUSED: authenticated Admin identity mismatch");
  const profile = await fetchJson(`/rest/v1/profiles?select=user_id,region,org_scope,account_status&user_id=eq.${account.id}`, { headers: anonHeaders(verified.jwt) });
  const roles = await fetchJson(`/rest/v1/user_roles?select=user_id,role_key&user_id=eq.${account.id}&order=role_key`, { headers: anonHeaders(verified.jwt) });
  if (profile.length !== 1 || profile[0].region !== account.region || profile[0].org_scope !== account.org_scope || profile[0].account_status !== "active") {
    throw new Error("CROSS_ROLE_ADMIN_REPAIR_REFUSED: governed Admin profile scope mismatch");
  }
  if (roles.length !== 1 || roles[0].role_key !== "admin") {
    throw new Error("CROSS_ROLE_ADMIN_REPAIR_REFUSED: governed Admin role mismatch");
  }
  const changed = Object.values(counters).some(value => value > 0);
  if (changed) await fetchJson("/rest/v1/audit_events", { method: "POST", body: {
    actor: account.id,
    object_type: "controlled_test_identity",
    object_id: account.id,
    action: "nonproduction_admin_identity_reconciled",
    before_state: null,
    after_state: { seed_batch_id: BATCH, role_key: "admin", region: account.region, org_scope: account.org_scope, counters },
    requirement_refs: ["RBAC-001", "CANONICAL-ROLE-001"],
  }, prefer: "return=minimal" });
  persistLocalSetting("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL", account.email);
  process.stdout.write(`${JSON.stringify({
    mode: "apply", target: "approved_nonproduction", batch: BATCH,
    repair: "existing_admin_only", identity_hash: digest(account.id),
    authenticated: true, role: "admin", region: account.region, org_scope: account.org_scope,
    idempotent_replay_ready: true, audit_appended: changed, counters,
  }, null, 2)}\n`);
}

async function certify(personas) {
  const byAlias = Object.fromEntries(personas.map(row => [row.alias, row]));
  const reads = {
    admin_profiles: (await fetchJson("/rest/v1/profiles?select=user_id", { headers: anonHeaders(byAlias.admin.jwt) })).length,
    planner_factories: (await fetchJson("/rest/v1/factories?select=id", { headers: anonHeaders(byAlias.planner.jwt) })).length,
    supervisor_reviews: (await fetchJson("/rest/v1/reviews?select=id", { headers: anonHeaders(byAlias.supervisor.jwt) })).length,
    inspector_assignments: (await fetchJson(`/rest/v1/assignments?select=id&inspector_id=eq.${byAlias.inspector.user_id}`, { headers: anonHeaders(byAlias.inspector.jwt) })).length,
    multi_role_reviews: (await fetchJson("/rest/v1/reviews?select=id", { headers: anonHeaders(byAlias.multi_role.jwt) })).length,
    no_workspace_roles: (await fetchJson(`/rest/v1/user_roles?select=role_key&user_id=eq.${byAlias.no_workspace.user_id}`, { headers: anonHeaders(byAlias.no_workspace.jwt) })).length,
    no_workspace_visits: (await fetchJson("/rest/v1/visits?select=id", { headers: anonHeaders(byAlias.no_workspace.jwt) })).length,
  };
  const forbidden = {};
  for (const alias of ["planner", "supervisor", "inspector", "multi_role", "no_workspace"]) {
    const response = await fetch(`${url}/rest/v1/user_roles`, {
      method: "POST", headers: anonHeaders(byAlias[alias].jwt),
      body: JSON.stringify({ user_id: "00000000-0000-4000-8000-000000000000", role_key: "admin" }),
    });
    forbidden[`${alias}_role_grant`] = response.status === 403;
  }
  if (reads.no_workspace_roles !== 0 || reads.no_workspace_visits !== 0 || Object.values(forbidden).some(value => !value)) {
    throw new Error("CROSS_ROLE_RLS_CERTIFICATION_FAILED");
  }
  const counts = {};
  for (const [name, path] of Object.entries({
    factories: "factories?select=id&source=like.demo_seed:*", inspections: "inspections?select=id",
    submission_versions: "submission_versions?select=id", reviews: "reviews?select=id",
    notifications: "notifications?select=id", audit_events: "audit_events?select=id",
  })) counts[name] = (await fetchJson(`/rest/v1/${path}`)).length;
  return { reads, forbidden, linked_counts: counts };
}

if (!apply) {
  process.stdout.write(`${JSON.stringify({ mode: "dry-run", target: "approved_nonproduction", batch: BATCH, planned_new_identities: repairAdmin ? 0 : 5, planned_role_grants: repairAdmin ? 1 : 5, reviewer_distinct: false, admin_only_repair: repairAdmin, password_rotation_authorized: rotateOwnedPasswords, remote_writes: 0 }, null, 2)}\n`);
  process.exit(0);
}

if (repairAdmin) {
  await repairExistingAdmin();
  process.exit(0);
}

const existingUsers = await authInventory();
const createdAliases = [];
const counters = { auth_created: 0, auth_metadata_updated: 0, passwords_rotated: 0, sessions_revoked: 0, profiles_created: 0, bootstrap_roles_created: 0 };
for (const account of accounts) {
  const byId = existingUsers.find(user => user.id === account.id);
  const byEmail = existingUsers.find(user => user.email === account.email);
  if ((byId && byId.email !== account.email) || (byEmail && byEmail.id !== account.id)) throw new Error(`CROSS_ROLE_AUTH_COLLISION: ${account.alias}`);
  if (!byId) {
    await fetchJson("/auth/v1/admin/users", { method: "POST", body: {
      id: account.id, email: account.email, password, email_confirm: true,
      app_metadata: metadataFor(account), user_metadata: {},
    } });
    createdAliases.push(account.alias);
    counters.auth_created += 1;
  } else if (rotateOwnedPasswords) {
    await fetchJson(`/auth/v1/admin/users/${account.id}`, { method: "PUT", body: { password, app_metadata: metadataFor(account) } });
    counters.passwords_rotated += 1;
  } else if (!metadataMatches(byId.app_metadata, metadataFor(account))) {
    await fetchJson(`/auth/v1/admin/users/${account.id}`, { method: "PUT", body: { app_metadata: metadataFor(account) } });
    counters.auth_metadata_updated += 1;
  }
}
for (const account of accounts) if (await reconcileProfile(account, createdAliases.includes(account.alias))) counters.profiles_created += 1;
if (await grantBootstrapAdmin()) counters.bootstrap_roles_created += 1;
if (rotateOwnedPasswords) {
  for (const account of accounts) {
    const session = await login(account.email);
    await revokeAllSessions(session.jwt);
    counters.sessions_revoked += 1;
  }
}
const admin = await login(accounts[0].email);
for (const account of accounts.slice(1)) {
  for (const role of account.roles) await rpc("admin_grant_role", admin.jwt, { p_user: account.id, p_role: role });
}
const personas = [];
for (const account of accounts) personas.push({ alias: account.alias, ...(await login(account.email)) });
const inspectorEmail = setting("SAQEEL_TEST_INSPECTOR_EMAIL");
const inspectorPassword = setting("SAQEEL_TEST_PASSWORD", true);
personas.push({ alias: "inspector", ...(await login(inspectorEmail, inspectorPassword)) });
persistIgnoredReferences();
const evidence = await certify(personas);
const manifest = { batch: BATCH, target_ref: APPROVED_REF, accounts: accounts.map(account => ({ alias: account.alias, id_hash: digest(account.id), created: createdAliases.includes(account.alias), roles: account.roles })), counters, staging_replay: { explicit_project_allowlist_required: true, production_refused: true, secret_external_and_ignored: true }, evidence };
mkdirSync(resolve(".local-inputs"), { recursive: true, mode: 0o700 });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ mode: "apply", target: "approved_nonproduction", batch: BATCH, identities_reconciled: 5, identities_created: createdAliases.length, profiles_reconciled: 5, canonical_role_grants: 5, authenticated_personas: 6, reviewer_distinct: false, idempotent_replay_ready: true, counters, staging_replay: { explicit_project_allowlist_required: true, production_refused: true, secret_external_and_ignored: true }, evidence }, null, 2)}\n`);
