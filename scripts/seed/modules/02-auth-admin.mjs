import { readFileSync } from "node:fs";
import { buildAccountPlan } from "../lib/accounts.mjs";
import { APPROVED_TARGET_REF, projectRefFromUrl, REFUSAL } from "../lib/preflight.mjs";
import { safeJson } from "../lib/redact.mjs";

const apply = process.argv.includes("--apply");
const seedBatchId = process.env.SEED_BATCH_ID;
const accounts = buildAccountPlan(seedBatchId);

if (!apply) {
  process.stdout.write(safeJson({
    mode: "dry-run",
    planned_auth_users: accounts.length,
    aliases: accounts.map(account => account.alias),
    remote_writes: 0,
  }));
  process.exit(0);
}

if (process.env.SEED_APPLY_AUTH_ADMIN !== "YES_I_UNDERSTAND") {
  throw new Error(`${REFUSAL}: explicit Auth Admin apply acknowledgement missing`);
}
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
if (projectRefFromUrl(url) !== APPROVED_TARGET_REF) {
  throw new Error(`${REFUSAL}: wrong target`);
}
const descriptor = Number(process.env.SEED_CREDENTIALS_FD);
if (!Number.isInteger(descriptor) || descriptor < 3) {
  throw new Error(`${REFUSAL}: SEED_CREDENTIALS_FD must reference an operator-owned descriptor`);
}

const credentialBytes = readFileSync(descriptor, "utf8");
const credentials = JSON.parse(credentialBytes);
const serviceRoleKey = credentials.service_role_key;
const passwords = credentials.account_passwords;
if (!serviceRoleKey || !passwords || accounts.some(account => !passwords[account.alias])) {
  throw new Error(`${REFUSAL}: incomplete credential bundle`);
}

const lookup = await fetch(
  `${url}/auth/v1/admin/users?page=1&per_page=1000`,
  {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  },
);
if (!lookup.ok) {
  throw new Error(`Auth Admin collision preflight failed: HTTP ${lookup.status}`);
}
const existingUsers = (await lookup.json()).users ?? [];

for (const account of accounts) {
  const byId = existingUsers.find(user => user.id === account.id);
  const byEmail = existingUsers.find(user => user.email === account.email);
  if (
    (byId && byId.email !== account.email) ||
    (byEmail && byEmail.id !== account.id)
  ) {
    throw new Error(`Auth Admin deterministic collision for ${account.alias}`);
  }
  if (byId) continue;

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: account.id,
      email: account.email,
      password: passwords[account.alias],
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name_en,
        full_name_ar: account.full_name_ar,
        employee_ref: account.employee_ref,
        seed_batch_id: seedBatchId,
        data_mode: account.data_mode,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Auth Admin reconcile failed for ${account.alias}: HTTP ${response.status}`);
  }
}

process.stdout.write(safeJson({
  mode: "apply",
  reconciled_auth_users: accounts.length,
  remote_writes: accounts.length,
  next_state: "service-role child must exit; profile bootstrap remains blocked",
}));
