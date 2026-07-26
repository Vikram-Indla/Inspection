import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * DEMO-ADMIN-ALIAS-001
 *
 * Idempotently provisions the synthetic admin1 demo account. Secrets are read
 * from the environment and are never written or logged. Run only against an
 * explicitly allow-listed non-production project:
 *
 * SEED_ALLOWED_PROJECT_REF=<ref> DEMO_ADMIN_PASSWORD=<password> npm run seed:demo-admin
 */

if (process.env.NODE_ENV === "production") {
  throw new Error("SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN");
}

const here = dirname(fileURLToPath(import.meta.url));
const envFiles = [join(here, "..", ".env"), join(here, "..", ".env.local")];
const fileEnv = {};
for (const file of envFiles) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) fileEnv[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Optional local environment file.
  }
}

const read = key => process.env[key] || fileEnv[key];
const base = read("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = read("SUPABASE_SERVICE_ROLE_KEY");
const allowedRef = process.env.SEED_ALLOWED_PROJECT_REF;
const password = process.env.DEMO_ADMIN_PASSWORD;
const email = process.env.DEMO_ADMIN_EMAIL || "admin1@mim.gov.sa";
const username = process.env.DEMO_ADMIN_USERNAME || "admin1";
const grantorEmail = process.env.DEMO_ADMIN_GRANTOR_EMAIL || "admin@mim.gov.sa";

if (!base || !anonKey || !serviceKey || !allowedRef || !password) {
  throw new Error("SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN");
}
const projectRef = new URL(base).hostname.split(".")[0];
if (projectRef !== allowedRef) throw new Error("SEEDING_BLOCKED_ENVIRONMENT_NOT_PROVEN");

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};
const restHeaders = {
  ...adminHeaders,
  Prefer: "resolution=merge-duplicates,return=minimal",
};

async function responseJson(response, operation) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.msg || body.message || body.error || `HTTP ${response.status}`;
    throw new Error(`${operation}: ${message}`);
  }
  return body;
}

const inventory = await responseJson(
  await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1000`, { headers: adminHeaders }),
  "Auth inventory",
);
const users = Array.isArray(inventory) ? inventory : inventory.users || [];
const grantor = users.find(user => String(user.email || "").toLowerCase() === grantorEmail.toLowerCase());
if (!grantor) throw new Error("DEMO_ADMIN_GRANTOR_NOT_FOUND");

let demoUser = users.find(user => String(user.email || "").toLowerCase() === email.toLowerCase());
if (demoUser) {
  demoUser = await responseJson(
    await fetch(`${base}/auth/v1/admin/users/${demoUser.id}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: { username, full_name: "Demo Administrator" },
        app_metadata: { ...(demoUser.app_metadata || {}), demo_account: true },
      }),
    }),
    "Update demo administrator",
  );
} else {
  demoUser = await responseJson(
    await fetch(`${base}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, full_name: "Demo Administrator" },
        app_metadata: { demo_account: true },
      }),
    }),
    "Create demo administrator",
  );
}

await responseJson(
  await fetch(`${base}/rest/v1/profiles?on_conflict=user_id`, {
    method: "POST",
    headers: restHeaders,
    body: JSON.stringify([{
      user_id: demoUser.id,
      full_name: "Demo Administrator",
      email,
      region: "National",
      org_scope: "Demo administration",
    }]),
  }),
  "Upsert demo profile",
);

const roleKeys = [
  "compliance_admin",
  "form_admin",
  "workflow_admin",
  "security_admin",
  "gis_admin",
  "risk_owner",
];
await responseJson(
  await fetch(`${base}/rest/v1/user_roles?on_conflict=user_id,role_key`, {
    method: "POST",
    headers: restHeaders,
    body: JSON.stringify(roleKeys.map(role_key => ({
      user_id: demoUser.id,
      role_key,
      granted_by: grantor.id,
    }))),
  }),
  "Upsert demo roles",
);

const login = await responseJson(
  await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }),
  "Verify demo login",
);
if (!login.access_token) throw new Error("DEMO_ADMIN_LOGIN_NOT_VERIFIED");

console.log(JSON.stringify({
  project_ref: projectRef,
  username,
  email,
  roles: roleKeys,
  login_verified: true,
}));
