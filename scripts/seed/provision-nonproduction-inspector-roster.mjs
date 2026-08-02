#!/usr/bin/env node
// Additive, idempotent fixture provisioning for the linked non-production
// Saqeel project. The names below are fictional personas, never real people.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const ENV_FILE = new URL("../../apps/web/.env.local", import.meta.url);
const env = Object.fromEntries(readFileSync(ENV_FILE, "utf8")
  .split(/\r?\n/)
  .filter(line => line && !line.startsWith("#") && line.includes("="))
  .map(line => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
const password = env.SAQEEL_TEST_PASSWORD;
const batch = "SAQEEL-NONPROD-INSPECTOR-ROSTER-20260729";
if (!url?.includes("iiozvqntawxfwbgffzqu.supabase.co") || !serviceRole || !password) {
  throw new Error("Refused: non-production target or required local credentials are unavailable");
}

const people = [
  ["amina-al-harbi", "Amina Al-Harbi", "Eastern"],
  ["khalid-al-shammari", "Khalid Al-Shammari", "Eastern"],
  ["fahad-al-qahtani", "Fahad Al-Qahtani", "Riyadh"],
  ["huda-al-mutairi", "Huda Al-Mutairi", "Riyadh"],
  ["noura-al-ghamdi", "Noura Al-Ghamdi", "Makkah"],
  ["laila-al-zahrani", "Laila Al-Zahrani", "Makkah"],
  ["reem-al-otaibi", "Reem Al-Otaibi", "Madinah"],
  ["omar-al-anazi", "Omar Al-Anazi", "Madinah"],
  ["sultan-al-dosari", "Sultan Al-Dosari", "Qassim"],
  ["yasser-al-rashid", "Yasser Al-Rashid", "Qassim"],
].map(([key, full_name, region]) => ({
  persona_key: key,
  full_name,
  region,
  email: `np.inspector.${key}@saqeel.test`,
  daily_capacity: 10,
}));
const deterministicUuid = value => {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
const adminHeaders = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" };
const restHeaders = { ...adminHeaders, Prefer: "resolution=merge-duplicates,return=representation" };
const list = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers: adminHeaders });
if (!list.ok) throw new Error(`Auth roster preflight failed: HTTP ${list.status}`);
const existing = (await list.json()).users ?? [];
const rows = [];
for (const person of people) {
  const id = deterministicUuid(`${batch}:${person.persona_key}`);
  const prior = existing.find(user => user.email === person.email);
  if (prior && prior.id !== id) throw new Error(`Refused: deterministic identity collision for ${person.persona_key}`);
  if (!prior) {
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({ id, email: person.email, password, email_confirm: true, user_metadata: {
        full_name: person.full_name, data_mode: "NONPRODUCTION_SYNTHETIC", seed_batch_id: batch,
      }}),
    });
    if (!created.ok) throw new Error(`Auth create failed for ${person.persona_key}: HTTP ${created.status}`);
  }
  rows.push({ ...person, user_id: id });
}
const post = async (path, body) => {
  const response = await fetch(`${url}/rest/v1/${path}`, { method: "POST", headers: restHeaders, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`${path} reconcile failed: HTTP ${response.status}`);
};
await post("profiles?on_conflict=user_id", rows.map(({ user_id, full_name, email, region }) => ({
  user_id, full_name, email, region, account_status: "active", org_scope: `NONPRODUCTION_SYNTHETIC:${batch}`,
})));
await post("user_roles?on_conflict=user_id,role_key", rows.map(({ user_id }) => ({ user_id, role_key: "inspector" })));
await post("nonproduction_inspector_roster?on_conflict=user_id", rows.map(({ user_id, persona_key, region, daily_capacity }) => ({
  user_id, persona_key, region, daily_capacity, account_status: "active", provenance: "NONPRODUCTION_SYNTHETIC", seed_batch_id: batch,
})));
process.stdout.write(JSON.stringify({ roster: "NONPRODUCTION_SYNTHETIC", batch, reconciled_personas: rows.length, regions: [...new Set(rows.map(row => row.region))] }));
