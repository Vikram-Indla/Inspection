#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APPROVED_REF = "iiozvqntawxfwbgffzqu";
const APPLY_ACK = "CONFIRM_GOVERNED_UAT_IDENTITIES_NONPRODUCTION";
const apply = process.argv.includes("--apply");
const envPath = resolve(process.env.E2E_ENV_FILE || "apps/web/.env.local");
const fileEnv = existsSync(envPath) ? Object.fromEntries(readFileSync(envPath, "utf8").split(/\r?\n/)
  .filter(line => line && !line.startsWith("#") && line.includes("="))
  .map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)]; })) : {};
const value = name => Object.hasOwn(process.env, name) ? process.env[name] : fileEnv[name];
const required = name => {
  const found = value(name)?.trim();
  if (!found) throw new Error(`UAT_IDENTITY_REFUSED: ${name} is required`);
  return found;
};
const optionalOverride = value("SAQEEL_UAT_PASSWORD")?.trim();
const sharedSecret = optionalOverride || required("SAQEEL_CROSS_ROLE_PASSWORD");

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
const projectRef = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
if (process.env.NODE_ENV === "production" || projectRef !== APPROVED_REF) {
  throw new Error("UAT_IDENTITY_REFUSED: target is not the approved non-production project");
}
if (apply && process.env.SAQEEL_UAT_IDENTITY_APPLY !== APPLY_ACK) {
  throw new Error("UAT_IDENTITY_REFUSED: explicit apply acknowledgement is absent");
}

const id = (prefix, n) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const regions = ["Riyadh", "Eastern Province", "Makkah", "Madinah", "Qassim"];
// Display names come from a checked-in map so the shell account chip renders an
// officer rather than a data-provenance note. The identities remain governed
// non-production: that fact is carried by app_metadata.data_mode and the
// seed_batch_id below, which is where a machine reads it — not by the name a
// human sees on every screen.
const displayNames = JSON.parse(readFileSync(resolve("scripts/test-data/uat-identity-names.json"), "utf8"));
const displayName = alias => {
  const name = displayNames[alias];
  if (!name) throw new Error(`UAT_IDENTITY_REFUSED: no display name for ${alias}`);
  return name;
};

const definitions = [
  ...["admin", "planner", "supervisor"].flatMap((role, roleIndex) =>
    Array.from({ length: 5 }, (_, index) => ({
      alias: `${role}${index + 1}`,
      id: id(`a${roleIndex + 1}`, index + 1),
      email: `${role}${index + 1}@mim.gov.sa`,
      roles: [role],
      region: regions[index],
      org_scope: role === "admin" ? "national" : "regional",
    }))),
  ...Array.from({ length: 30 }, (_, index) => ({
    alias: `inspector${index + 1}`,
    id: id("a4", index + 1),
    email: `inspector${index + 1}@mim.gov.sa`,
    roles: ["inspector"],
    region: regions[index % regions.length],
    org_scope: "regional",
  })),
];
if (definitions.length !== 45 || new Set(definitions.map(row => row.id)).size !== 45 || new Set(definitions.map(row => row.email)).size !== 45) {
  throw new Error("UAT_IDENTITY_REFUSED: governed identity definitions are incomplete or ambiguous");
}

const serviceHeaders = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" };
const request = async (path, { method = "GET", body, prefer } = {}) => {
  const response = await fetch(`${url}${path}`, { method, headers: { ...serviceHeaders, ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new Error(`UAT_IDENTITY_REQUEST_FAILED: ${method} ${path.split("?")[0]} HTTP ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
const inventory = (await request("/auth/v1/admin/users?page=1&per_page=1000")).users ?? [];
const reconciled = [];
for (const account of definitions) {
  const byId = inventory.find(user => user.id === account.id);
  const byEmail = inventory.find(user => user.email?.toLowerCase() === account.email);
  if (byEmail && byEmail.id !== account.id) throw new Error(`UAT_IDENTITY_REFUSED: target email collision for ${account.alias}`);
  const authBody = {
    id: account.id,
    email: account.email,
    password: sharedSecret,
    email_confirm: true,
    app_metadata: { role: account.roles[0], roles: account.roles, data_mode: "NONPRODUCTION_UAT", seed_batch_id: "GOVERNED_UAT_IDENTITIES_V1" },
    user_metadata: {},
  };
  if (apply) {
    if (byId) await request(`/auth/v1/admin/users/${account.id}`, { method: "PUT", body: authBody });
    else await request("/auth/v1/admin/users", { method: "POST", body: authBody });
    await request("/rest/v1/profiles?on_conflict=user_id", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: {
      user_id: account.id, full_name: displayName(account.alias), email: account.email,
      region: account.region, org_scope: account.org_scope, account_status: "active",
    }});
    await request("/rest/v1/user_roles?on_conflict=user_id,role_key", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: account.roles.map(role_key => ({ user_id: account.id, role_key })) });
  }
  reconciled.push({ alias: account.alias, action: byId ? "reconcile" : "create" });
}

if (apply) {
  for (const account of definitions) {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: account.email, password: sharedSecret }),
    });
    if (!response.ok) throw new Error(`UAT_IDENTITY_AUTH_FAILED: ${account.alias} HTTP ${response.status}`);
    const session = await response.json();
    if (session.user?.id !== account.id) throw new Error(`UAT_IDENTITY_AUTH_FAILED: deterministic identity mismatch for ${account.alias}`);
  }
}

process.stdout.write(`${JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  target: "approved_nonproduction",
  governed_accounts: definitions.length,
  roles: Object.fromEntries(["admin", "planner", "supervisor", "inspector"].map(role => [role, definitions.filter(row => row.roles.includes(role)).length])),
  planned_creates: reconciled.filter(row => row.action === "create").length,
  planned_reconciliations: reconciled.filter(row => row.action === "reconcile").length,
  authentication_verified: apply ? definitions.length : 0,
  remote_writes: apply,
}, null, 2)}\n`);
