#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { buildAccountPlan } from "./lib/accounts.mjs";
import { APPROVED_TARGET_REF, projectRefFromUrl, REFUSAL } from "./lib/preflight.mjs";
import { safeJson } from "./lib/redact.mjs";

const apply = process.argv.includes("--apply");
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const seedBatchId = process.env.SEED_BATCH_ID;
if (projectRefFromUrl(url) !== APPROVED_TARGET_REF || !anonKey || !seedBatchId) {
  throw new Error(`${REFUSAL}: cleanup target is not proven`);
}
const descriptor = Number(process.env.SEED_CREDENTIALS_FD);
if (!Number.isInteger(descriptor) || descriptor < 3) {
  throw new Error(`${REFUSAL}: cleanup requires an operator-owned credential descriptor`);
}
const credentials = JSON.parse(readFileSync(descriptor, "utf8"));
if ("service_role_key" in credentials) {
  throw new Error(`${REFUSAL}: cleanup process must not receive a service-role credential`);
}
const planner = buildAccountPlan(seedBatchId).find(account => account.role_key === "planner");
const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anonKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: planner.email, password: credentials.account_passwords[planner.alias] }),
});
if (!login.ok) throw new Error(`Cleanup persona login failed: HTTP ${login.status}`);
const jwt = (await login.json()).access_token;
async function select(table, query) {
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) throw new Error(`Cleanup inventory failed for ${table}: HTTP ${response.status}`);
  return response.json();
}

const factories = await select("factories", `select=id&source=eq.${encodeURIComponent(`demo_seed:${seedBatchId}`)}`);
const factoryIds = factories.map(row => row.id);
const visits = factoryIds.length
  ? await select("visits", `select=id&factory_id=in.(${factoryIds.join(",")})`)
  : [];
const visitIds = visits.map(row => row.id);
const inspections = visitIds.length
  ? await select("inspections", `select=id,status&visit_id=in.(${visitIds.join(",")})`)
  : [];
const immutable = inspections.filter(row => ["submitted", "under_review", "approved", "returned", "rejected"].includes(row.status));
const report = {
  mode: "cleanup-dry-run",
  seed_batch_id: seedBatchId,
  target_project_ref: APPROVED_TARGET_REF,
  exact_members: {
    auth_users: 39,
    factories: factories.length,
    visits: visits.length,
    inspections: inspections.length,
  },
  immutable_residuals: immutable.length,
  mutation_performed: false,
  decision: immutable.length
    ? "REFUSED_IMMUTABLE_HISTORY_PRESENT"
    : "ELIGIBLE_FOR_SEPARATELY_CONFIRMED_REVERSE_DEPENDENCY_CLEANUP",
};
if (apply) {
  throw new Error(
    `${REFUSAL}: destructive cleanup is not authorized while ${immutable.length} immutable inspection histories remain`,
  );
}
if (process.env.SEED_CLEANUP_REPORT_PATH) {
  writeFileSync(process.env.SEED_CLEANUP_REPORT_PATH, safeJson(report), { mode: 0o600 });
}
process.stdout.write(safeJson(report));
