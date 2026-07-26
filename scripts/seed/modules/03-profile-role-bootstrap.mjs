import { readFileSync } from "node:fs";
import { buildAccountPlan } from "../lib/accounts.mjs";
import { APPROVED_TARGET_REF, projectRefFromUrl, REFUSAL } from "../lib/preflight.mjs";
import { safeJson } from "../lib/redact.mjs";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (projectRefFromUrl(url) !== APPROVED_TARGET_REF || !anonKey) {
  throw new Error(`${REFUSAL}: target or anonymous key is not proven`);
}
const descriptor = Number(process.env.SEED_CREDENTIALS_FD);
if (!Number.isInteger(descriptor) || descriptor < 3) {
  throw new Error(`${REFUSAL}: SEED_CREDENTIALS_FD must reference an operator-owned descriptor`);
}
const credentials = JSON.parse(readFileSync(descriptor, "utf8"));
if ("service_role_key" in credentials) {
  throw new Error(`${REFUSAL}: access bootstrap process must not receive a service-role credential`);
}

async function login(email, password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Persona login failed for ${email}: HTTP ${response.status}`);
  return (await response.json()).access_token;
}

async function rpc(name, jwt, body) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.text()).replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");
    throw new Error(`${name} failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }
  return response.status === 204 ? null : response.json();
}

const accounts = buildAccountPlan(process.env.SEED_BATCH_ID);
const adminJwt = await login(
  credentials.bootstrap_admin.email,
  credentials.bootstrap_admin.password,
);

for (const account of accounts) {
  await rpc("admin_bootstrap_profile", adminJwt, {
    p_user: account.id,
    p_full_name: `${account.full_name_en} — ${account.full_name_ar}`,
    p_region: null,
    p_org_scope: null,
  });
  await rpc("admin_grant_role", adminJwt, {
    p_user: account.id,
    p_role: account.role_key,
  });
}

let verifiedLogins = 0;
for (const account of accounts) {
  await login(account.email, credentials.account_passwords[account.alias]);
  verifiedLogins += 1;
}

process.stdout.write(safeJson({
  mode: "profile-role-bootstrap",
  profiles_reconciled: accounts.length,
  role_grants_reconciled: accounts.length,
  verified_logins: verifiedLogins,
  service_role_present: false,
}));
