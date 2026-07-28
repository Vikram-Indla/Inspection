import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Service-key variant of seed-dashboard-kpis.mjs.
 *
 * Same deterministic, idempotent fixtures as the sanctioned seeder, but it
 * authenticates with the Supabase service-role key instead of persona password
 * logins (the standard personas exist but their passwords were not changed).
 * Foreign keys and audit triggers still fire; only RLS is bypassed by the key.
 * Persona user IDs are the real ones resolved from the auth admin list, so
 * created_by / inspector_id / recipient stay honest.
 */

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, "..", ".env.local"), "utf8");
const BASE = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!BASE) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing from apps/web/.env.local");
if (!SVC) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from environment");

// Real persona user IDs from auth.users (resolved via the admin API).
const planner = { jwt: SVC, userId: "61573500-f533-438c-82b6-b0223df88671" };
const inspector = { jwt: SVC, userId: "c2ae5022-91a8-4014-8643-d436d2b3e640" };
const ops = { jwt: SVC, userId: "38fd1ad1-ec82-4d62-8da4-a3231271753a" };

const IDS = {
  factories: Array.from({ length: 6 }, (_, i) => `f7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  plans: Array.from({ length: 6 }, (_, i) => `a7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  visits: Array.from({ length: 6 }, (_, i) => `b7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  assignments: Array.from({ length: 6 }, (_, i) => `c7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  journeys: Array.from({ length: 3 }, (_, i) => `d7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  geo: Array.from({ length: 3 }, (_, i) => `e7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`),
  inspections: ["97000000-0000-4000-8000-000000000001", "97000000-0000-4000-8000-000000000002"],
  finding: "87000000-0000-4000-8000-000000000001",
  violation: "86000000-0000-4000-8000-000000000001",
  actions: ["85000000-0000-4000-8000-000000000001", "85000000-0000-4000-8000-000000000002"],
  notifications: ["84000000-0000-4000-8000-000000000001", "84000000-0000-4000-8000-000000000002"],
};

async function rest(method, path, jwt, body, prefer = "return=representation") {
  const response = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SVC,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status} ${raw.slice(0, 300)}`);
  return raw ? JSON.parse(raw) : null;
}

async function insertMissing(table, rows, jwt) {
  if (!rows.length) return { inserted: 0, existing: 0 };
  const ids = rows.map(row => row.id);
  const existing = await rest("GET", `${table}?select=id&id=in.(${ids.join(",")})`, jwt);
  const found = new Set(existing.map(row => row.id));
  const missing = rows.filter(row => !found.has(row.id));
  if (missing.length) await rest("POST", table, jwt, missing);
  return { inserted: missing.length, existing: found.size };
}

async function upsert(table, rows, jwt) {
  if (!rows.length) return { upserted: 0 };
  await rest("POST", table, jwt, rows, "resolution=merge-duplicates,return=minimal");
  return { upserted: rows.length };
}

const packages = await rest(
  "GET",
  "package_versions?select=id,status&status=eq.published&order=published_at.desc&limit=1",
  planner.jwt,
);
if (!packages.length) throw new Error("No published package version exists; KPI seed stopped without writes");
const packageVersionId = packages[0].id;

const now = Date.now();
const hour = 3_600_000;
const day = 86_400_000;
const iso = offset => new Date(now + offset).toISOString();
const states = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted"];
const names = ["New", "Prepared overdue", "En route", "Arrived", "Executing overdue", "Submitted"];
const scores = [18, 42, 55, 71, 83, 94];
const bands = ["low", "medium", "medium", "high", "high", "high"];
const windows = [
  [day, 2 * day],
  [-2 * day, day],
  [-2.5 * hour, 1.5 * hour],
  [-3.5 * hour, 0.5 * hour],
  [-6 * hour, -2 * hour],
  [-10 * day, -9 * day],
];

const factories = states.map((state, i) => ({
  id: IDS.factories[i],
  factory_code: `KPI-VERIFY-0${i + 1}`,
  name: `KPI Verify — ${names[i]}`,
  cr_number: `VERIFY-${String(i + 1).padStart(4, "0")}`,
  license_number: `KPI-LIC-${String(i + 1).padStart(3, "0")}`,
  region: "Verification Fixtures",
  city: "Dashboard KPI",
  activity_class: "verification_fixture",
  official_lat: 24.69 + i * 0.018,
  official_lng: 46.61 + i * 0.024,
  source: "verification_fixture",
  source_synced_at: iso(-5 * 60_000),
  risk_score: scores[i],
  risk_band: bands[i],
  risk_version: "v1-accepted-2026-07-11",
  geofence_radius_m: 150,
}));

const plans = states.map((state, i) => ({
  id: IDS.plans[i], method: "single", status: "published", created_by: planner.userId,
  criteria: { fixture: "TASK-DASH-KPI-SEED-001", state }, published_at: iso(-day),
}));

const visits = states.map((state, i) => ({
  id: IDS.visits[i], visit_plan_id: IDS.plans[i], factory_id: IDS.factories[i],
  visit_type: "periodic", execution_mode: "physical", planning_status: "published",
  operational_state: state, window_start: iso(windows[i][0]), window_end: iso(windows[i][1]),
  priority: i >= 4 ? "high" : "normal",
  notes: `TASK-DASH-KPI-SEED-001 · ${state} · deterministic verification fixture`,
  planner_lat: factories[i].official_lat, planner_lng: factories[i].official_lng,
  package_version_id: packageVersionId,
}));

const assignments = states.map((state, i) => ({
  id: IDS.assignments[i], visit_id: IDS.visits[i], inspector_id: inspector.userId,
  method: "manual", status: state === "new" ? "assigned" : "ready",
  candidates: { fixture: "TASK-DASH-KPI-SEED-001" },
}));

const journeys = [2, 3, 4].map((visitIndex, i) => ({
  id: IDS.journeys[i], visit_id: IDS.visits[visitIndex], inspector_id: inspector.userId,
  started_at: iso(-(i + 1) * hour), eta_minutes: 18 - i * 5,
  remaining_distance_m: 12000 - i * 4500,
  status: states[visitIndex] === "executing" ? "arrived" : "on_journey",
}));

const geoEvents = [
  { id: IDS.geo[0], journey_id: IDS.journeys[0], visit_id: IDS.visits[2], kind: "telemetry", observed_lat: factories[2].official_lat - 0.04, observed_lng: factories[2].official_lng - 0.03, accuracy_m: 12, geofence_result: null, device_id: "KPI-VERIFY-DEVICE", occurred_at: iso(-45 * 60_000) },
  { id: IDS.geo[1], journey_id: IDS.journeys[1], visit_id: IDS.visits[3], kind: "arrival", observed_lat: factories[3].official_lat + 0.0004, observed_lng: factories[3].official_lng - 0.0003, accuracy_m: 9, geofence_result: "inside", device_id: "KPI-VERIFY-DEVICE", occurred_at: iso(-25 * 60_000) },
  { id: IDS.geo[2], journey_id: IDS.journeys[2], visit_id: IDS.visits[4], kind: "checkin", observed_lat: factories[4].official_lat + 0.0002, observed_lng: factories[4].official_lng + 0.0002, accuracy_m: 7, geofence_result: "inside", device_id: "KPI-VERIFY-DEVICE", occurred_at: iso(-15 * 60_000) },
].map(row => ({ ...row, gis_version: "v1-accepted-2026-07-11" }));

const inspections = [
  { id: IDS.inspections[0], visit_id: IDS.visits[4], status: "in_progress", package_version_id: packageVersionId, started_at: iso(-5 * hour), submitted_at: null },
  { id: IDS.inspections[1], visit_id: IDS.visits[5], status: "approved", package_version_id: packageVersionId, started_at: iso(-10 * day), submitted_at: iso(-9 * day) },
];

const violationCodes = await rest("GET", "violation_codes?select=id,code&active_to=is.null&order=code.asc&limit=1", inspector.jwt);
if (!violationCodes.length) throw new Error("No active violation code exists; KPI seed stopped before action fixtures");
const mappings = await rest("GET", `penalty_mappings?select=mapping_version&violation_code_id=eq.${violationCodes[0].id}&limit=1`, inspector.jwt);
if (!mappings.length) throw new Error("No penalty mapping exists for the selected verification violation code");

const finding = {
  id: IDS.finding, inspection_id: IDS.inspections[0], severity: "medium",
  description: "TASK-DASH-KPI-SEED-001 — traceable verification finding for the Operations corrective-action panel.",
};
const violation = {
  id: IDS.violation, inspection_id: IDS.inspections[0], violation_code_id: violationCodes[0].id,
  finding_id: IDS.finding, mapping_version: mappings[0].mapping_version,
};
const actions = [
  { id: IDS.actions[0], inspection_id: IDS.inspections[0], violation_id: IDS.violation, form_type: "corrective", owner_name: "KPI Verification Owner", owner_role: "HSE Manager", due_at: iso(-2 * day), required_correction: "Verify the overdue blocking-action state and trace it to the fixture inspection.", status: "open", is_blocking: true },
  { id: IDS.actions[1], inspection_id: IDS.inspections[0], violation_id: IDS.violation, form_type: "corrective", owner_name: "KPI Verification Owner", owner_role: "Plant Manager", due_at: iso(5 * day), required_correction: "Verify the acknowledged advisory state without changing production policy.", status: "acknowledged", is_blocking: false },
];
const notifications = [
  { id: IDS.notifications[0], event_key: "assignment", recipient: ops.userId, payload: { fixture: "TASK-DASH-KPI-SEED-001", visit_id: IDS.visits[2] }, channel: "inapp", delivery_state: "delivered", delivered_at: iso(-12 * 60_000), created_at: iso(-12 * 60_000) },
  { id: IDS.notifications[1], event_key: "review_decision", recipient: ops.userId, payload: { fixture: "TASK-DASH-KPI-SEED-001", visit_id: IDS.visits[5], decision: "approve" }, channel: "inapp", delivery_state: "delivered", delivered_at: iso(-8 * 60_000), created_at: iso(-8 * 60_000) },
];

const result = {};
result.factories = await insertMissing("factories", factories, planner.jwt);
result.visit_plans = await insertMissing("visit_plans", plans, planner.jwt);
result.visits = await upsert("visits", visits, planner.jwt);
result.assignments = await insertMissing("assignments", assignments, planner.jwt);
result.journey_sessions = await insertMissing("journey_sessions", journeys, inspector.jwt);
result.geo_events = await insertMissing("geo_events", geoEvents, inspector.jwt);
result.inspections = await insertMissing("inspections", inspections, inspector.jwt);
result.findings = await insertMissing("findings", [finding], inspector.jwt);
result.violations = await insertMissing("violations", [violation], inspector.jwt);
result.action_forms = await insertMissing("action_forms", actions, inspector.jwt);
result.notifications = await upsert("notifications", notifications, ops.jwt);

const truth = await rest(
  "GET",
  `visits?select=id,operational_state,planning_status,factory_id&id=in.(${IDS.visits.join(",")})&order=operational_state.asc`,
  ops.jwt,
);
if (truth.length !== 6 || new Set(truth.map(row => row.operational_state)).size !== 6) {
  throw new Error(`Fixture truth check failed: expected six distinct operational states, got ${JSON.stringify(truth)}`);
}

console.log(JSON.stringify({
  task: "TASK-DASH-KPI-SEED-001 (service-key variant)",
  status: "PASS",
  fixtureRegion: "Verification Fixtures",
  fixtureCity: "Dashboard KPI",
  stateCounts: Object.fromEntries(states.map(state => [state, truth.filter(row => row.operational_state === state).length])),
  rows: result,
}, null, 2));
