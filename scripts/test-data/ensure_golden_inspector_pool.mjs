#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APPROVED_REF = "iiozvqntawxfwbgffzqu";
const APPLY_ACK = "CONFIRM_GOLDEN_INSPECTOR_POOL_NONPRODUCTION";
const BATCH = "GOLDEN_INSPECTOR_POOL_V1";
const apply = process.argv.includes("--apply");
const acquire = process.argv.includes("--acquire");
const release = process.argv.includes("--release");
const verify = process.argv.includes("--verify");
const includeCrossRoleAlternate = process.argv.includes("--include-cross-role-alternate");
if ([acquire, release, verify].filter(Boolean).length > 1) throw new Error("GOLDEN_POOL_REFUSED: acquire, verify and release are mutually exclusive");
const envPath = resolve(process.env.E2E_ENV_FILE || "apps/web/.env.local");
const fileEnv = existsSync(envPath) ? Object.fromEntries(readFileSync(envPath, "utf8").split(/\r?\n/)
  .filter(line => line && !line.startsWith("#") && line.includes("="))
  .map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)]; })) : {};
const has = name => Object.hasOwn(process.env, name) || Object.hasOwn(fileEnv, name);
const value = name => Object.hasOwn(process.env, name) ? process.env[name] : fileEnv[name];
const required = name => {
  if (!has(name) || !value(name)?.trim()) throw new Error(`GOLDEN_POOL_REFUSED: ${name} is required`);
  return value(name).trim();
};
const url = required("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
const projectRef = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
if (process.env.NODE_ENV === "production" || projectRef !== APPROVED_REF) {
  throw new Error("GOLDEN_POOL_REFUSED: target is not the approved non-production project");
}
if ((apply || acquire || release || verify) && process.env.GOLDEN_INSPECTOR_POOL_APPLY !== APPLY_ACK) {
  throw new Error("GOLDEN_POOL_REFUSED: explicit apply acknowledgement is absent");
}

function slotReference(index) {
  const slot = String(index).padStart(2, "0");
  const emailName = `SAQEEL_TEST_INSPECTOR_${slot}_EMAIL`;
  const passwordName = `SAQEEL_TEST_INSPECTOR_${slot}_PASSWORD`;
  const legacy = index === 1 && !has(emailName) && !has(passwordName) && has("SAQEEL_TEST_INSPECTOR_EMAIL") && has("SAQEEL_TEST_PASSWORD");
  const emailPresent = legacy || has(emailName);
  const passwordPresent = legacy || has(passwordName);
  if (emailPresent !== passwordPresent) throw new Error(`GOLDEN_POOL_REFUSED: partial slot ${slot}`);
  if (!emailPresent) return null;
  return {
    slot,
    email: legacy ? value("SAQEEL_TEST_INSPECTOR_EMAIL") : value(emailName),
    password: legacy ? value("SAQEEL_TEST_PASSWORD") : value(passwordName),
  };
}
const references = Array.from({ length: 30 }, (_, index) => slotReference(index + 1)).filter(Boolean);
if (includeCrossRoleAlternate && !references.some(reference => reference.slot === "02")) {
  references.push({
    slot: "02",
    email: required("SAQEEL_TEST_MULTI_ROLE_EMAIL"),
    password: required("SAQEEL_CROSS_ROLE_PASSWORD"),
  });
}
if (references.length === 0) throw new Error("GOLDEN_POOL_REFUSED: no Inspector slot references are configured");
if (new Set(references.map(reference => reference.email.trim().toLowerCase())).size !== references.length) {
  throw new Error("GOLDEN_POOL_REFUSED: duplicate Inspector email references");
}

const serviceHeaders = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" };
const scrub = text => text.replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");
async function request(path, { method = "GET", body, prefer } = {}) {
  const response = await fetch(`${url}${path}`, { method, headers: { ...serviceHeaders, ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} failed: HTTP ${response.status} ${scrub(text).slice(0, 240)}`);
  return text ? JSON.parse(text) : null;
}
async function login(reference) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: reference.email, password: reference.password }),
  });
  if (!response.ok) throw new Error(`GOLDEN_POOL_AUTH_FAILED: slot ${reference.slot} HTTP ${response.status}`);
  const body = await response.json();
  return { ...reference, userId: body.user.id };
}
const authenticated = [];
for (const reference of references) authenticated.push(await login(reference));
if (new Set(authenticated.map(persona => persona.userId)).size !== authenticated.length) {
  throw new Error("GOLDEN_POOL_REFUSED: duplicate authenticated users");
}

async function reconcile(persona) {
  const personaKey = `golden_inspector_${persona.slot}`;
  const profiles = await request(`/rest/v1/profiles?select=user_id,email,region,org_scope,account_status&user_id=eq.${persona.userId}`);
  if (profiles.length && (profiles[0].email.toLowerCase() !== persona.email.toLowerCase() || profiles[0].account_status !== "active")) {
    throw new Error(`GOLDEN_POOL_PROFILE_COLLISION: slot ${persona.slot}`);
  }
  const profileScopeDrift = profiles.length && (profiles[0].region !== "Riyadh" || profiles[0].org_scope !== "regional");
  if (!profiles.length && apply) await request("/rest/v1/profiles", { method: "POST", prefer: "return=minimal", body: {
    user_id: persona.userId, email: persona.email, full_name: `Golden Inspector ${persona.slot}`, region: "Riyadh", org_scope: "regional", account_status: "active",
  }});
  if (profileScopeDrift && apply) await request(`/rest/v1/profiles?user_id=eq.${persona.userId}`, { method: "PATCH", prefer: "return=minimal", body: { region: "Riyadh", org_scope: "regional" } });
  const roles = await request(`/rest/v1/user_roles?select=user_id,role_key&user_id=eq.${persona.userId}&role_key=eq.inspector`);
  if (!roles.length && apply) await request("/rest/v1/user_roles", { method: "POST", prefer: "return=minimal", body: { user_id: persona.userId, role_key: "inspector" } });
  const roster = await request(`/rest/v1/nonproduction_inspector_roster?select=user_id,persona_key,region,account_status,daily_capacity,provenance,seed_batch_id&or=(user_id.eq.${persona.userId},persona_key.eq.${personaKey})`);
  const expected = { user_id: persona.userId, persona_key: personaKey, region: "Riyadh", account_status: "active", daily_capacity: 1, provenance: "NONPRODUCTION_SYNTHETIC", seed_batch_id: BATCH };
  if (roster.some(row => row.user_id !== persona.userId || row.provenance !== "NONPRODUCTION_SYNTHETIC")) {
    throw new Error(`GOLDEN_POOL_ROSTER_COLLISION: slot ${persona.slot}`);
  }
  const rosterDrift = roster.length && Object.entries(expected).some(([key, expectedValue]) => roster[0][key] !== expectedValue);
  if (!roster.length && apply) await request("/rest/v1/nonproduction_inspector_roster", { method: "POST", prefer: "return=minimal", body: expected });
  if (rosterDrift && apply) await request(`/rest/v1/nonproduction_inspector_roster?user_id=eq.${persona.userId}`, { method: "PATCH", prefer: "return=minimal", body: expected });
  if (apply && (!profiles.length || profileScopeDrift || !roles.length || !roster.length || rosterDrift)) await request("/rest/v1/audit_events", { method: "POST", prefer: "return=minimal", body: {
    actor: persona.userId, object_type: "nonproduction_inspector_roster", object_id: persona.userId,
    action: "NONPRODUCTION_GOLDEN_INSPECTOR_RECONCILED",
    before_state: { profile_scope: profiles[0] ? { region: profiles[0].region, org_scope: profiles[0].org_scope } : null, roster: roster[0] ?? null },
    after_state: { slot: persona.slot, seed_batch_id: BATCH, region: "Riyadh", org_scope: "regional" }, requirement_refs: ["B10-EV-001"],
  }});
  return { persona, changed: Boolean(!profiles.length || profileScopeDrift || !roles.length || !roster.length || rosterDrift) };
}
const reconciliation = [];
for (const persona of authenticated) reconciliation.push(await reconcile(persona));

let lease = null;
async function verifyLease(leaseId, chosen, windowStart, windowEnd) {
  const verified = await request("/rest/v1/rpc/verify_nonproduction_golden_inspector_lease", { method: "POST", body: {
    p_lease_id: leaseId, p_inspector_id: chosen.userId,
    p_window_start: windowStart, p_window_end: windowEnd,
  }});
  if (verified !== true) throw new Error("GOLDEN_POOL_REFUSED: lease verification failed closed");
}
if (acquire) {
  const runKey = required("GOLDEN_INSPECTOR_RUN_KEY");
  const windowStart = required("GOLDEN_INSPECTOR_WINDOW_START");
  const windowEnd = required("GOLDEN_INSPECTOR_WINDOW_END");
  const expiresAt = required("GOLDEN_INSPECTOR_LEASE_EXPIRES_AT");
  const rows = await request("/rest/v1/rpc/acquire_nonproduction_golden_inspector_lease", { method: "POST", body: {
    p_run_key: runKey, p_candidate_ids: authenticated.map(persona => persona.userId),
    p_window_start: windowStart, p_window_end: windowEnd, p_expires_at: expiresAt,
  }});
  if (rows.length !== 1) throw new Error("GOLDEN_POOL_REFUSED: lease acquisition did not return exactly one row");
  const chosen = authenticated.find(persona => persona.userId === rows[0].inspector_id);
  if (!chosen) throw new Error("GOLDEN_POOL_REFUSED: leased user is outside the configured pool");
  await verifyLease(rows[0].lease_id, chosen, windowStart, windowEnd);
  lease = { lease_id: rows[0].lease_id, slot: chosen.slot };
}
if (verify) {
  const leaseId = required("GOLDEN_INSPECTOR_LEASE_ID");
  const slot = required("GOLDEN_INSPECTOR_SLOT");
  const chosen = authenticated.find(persona => persona.slot === slot);
  if (!chosen) throw new Error("GOLDEN_POOL_REFUSED: selected slot is outside the configured pool");
  await verifyLease(leaseId, chosen, required("GOLDEN_INSPECTOR_WINDOW_START"), required("GOLDEN_INSPECTOR_WINDOW_END"));
  lease = { lease_id: leaseId, slot, verified: true };
}
if (release) {
  const leaseId = required("GOLDEN_INSPECTOR_LEASE_ID");
  const eventType = required("GOLDEN_INSPECTOR_LEASE_EVENT");
  const visitId = has("GOLDEN_INSPECTOR_VISIT_ID") && value("GOLDEN_INSPECTOR_VISIT_ID")?.trim() || null;
  await request("/rest/v1/rpc/release_nonproduction_golden_inspector_lease", { method: "POST", body: {
    p_lease_id: leaseId, p_event_type: eventType, p_visit_id: visitId,
  }});
  lease = { lease_id: leaseId, event: eventType };
}

process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "dry-run", target: "approved_nonproduction", configured_slots: authenticated.length, remaining_reference_gap: 30 - authenticated.length, verified_slots: authenticated.length, mutations: apply ? reconciliation.filter(result => result.changed).length : 0, lease }, null, 2)}\n`);
