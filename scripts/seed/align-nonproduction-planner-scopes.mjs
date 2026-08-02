#!/usr/bin/env node
// Non-production-only test-scope alignment. This never creates, deletes,
// disables or resets an account: it gives the two existing planner personas a
// Riyadh scope required by the same explicit-capability predicate used by the
// governed scheduling RPC.
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
if (!url?.includes("iiozvqntawxfwbgffzqu.supabase.co") || !serviceRole) {
  throw new Error("Refused: non-production target or local service authority is unavailable");
}

const planners = ["planner.one@saqeel.test", "planner.two@saqeel.test"];
const headers = {
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  "Content-Type": "application/json",
};
const authResponse = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
if (!authResponse.ok) throw new Error(`Auth planner preflight failed: HTTP ${authResponse.status}`);
const users = (await authResponse.json()).users ?? [];
const reconciled = [];
for (const email of planners) {
  const user = users.find(candidate => candidate.email === email);
  if (!user) throw new Error(`Refused: required existing planner account is missing (${email})`);
  const profileResponse = await fetch(`${url}/rest/v1/profiles?user_id=eq.${user.id}&select=user_id,region`, { headers });
  if (!profileResponse.ok) throw new Error(`Profile preflight failed for ${email}: HTTP ${profileResponse.status}`);
  const [profile] = await profileResponse.json();
  if (!profile) throw new Error(`Refused: planner profile is missing (${email})`);
  if (profile.region && profile.region !== "Riyadh") {
    throw new Error(`Refused: ${email} already has non-test scope ${profile.region}`);
  }
  if (profile.region !== "Riyadh") {
    const update = await fetch(`${url}/rest/v1/profiles?user_id=eq.${user.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ region: "Riyadh" }),
    });
    if (!update.ok) throw new Error(`Planner scope update failed for ${email}: HTTP ${update.status}`);
  }
  reconciled.push(email);
}
process.stdout.write(JSON.stringify({ target: "NONPRODUCTION", scope: "Riyadh", reconciled_planners: reconciled }));
