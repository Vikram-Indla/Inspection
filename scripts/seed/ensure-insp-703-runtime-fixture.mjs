import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APPROVED_TARGET_REF, projectRefFromUrl, REFUSAL } from "./lib/preflight.mjs";
import { safeJson } from "./lib/redact.mjs";

const MARKER = "[INSP-703:runtime-fixture:v2]";
const envPath = resolve(process.env.E2E_ENV_FILE || "apps/web/.env.local");

function parseEnv(path) {
  if (!existsSync(path)) throw new Error(`${REFUSAL}: non-production environment file is unavailable`);
  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

const fileEnv = parseEnv(envPath);
const setting = (name, { allowEmpty = false } = {}) => {
  const present = Object.hasOwn(process.env, name) || Object.hasOwn(fileEnv, name);
  const value = Object.hasOwn(process.env, name) ? process.env[name] : fileEnv[name];
  if (!present || (!allowEmpty && !value?.trim())) {
    throw new Error(`${REFUSAL}: ${name} is required`);
  }
  return value;
};

const url = setting("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = setting("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const password = setting("SAQEEL_TEST_PASSWORD", { allowEmpty: true });
const inspectorEmail = setting("SAQEEL_TEST_INSPECTOR_EMAIL");

if (process.env.NODE_ENV === "production" || projectRefFromUrl(url) !== APPROVED_TARGET_REF) {
  throw new Error(`${REFUSAL}: target is not the approved non-production Supabase project`);
}

async function login(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Configured persona authentication failed: HTTP ${response.status}`);
  const body = await response.json();
  return { jwt: body.access_token, userId: body.user.id };
}

async function request(path, jwt, { method = "GET", body } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.text()).replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");
    throw new Error(`${method} ${path.split("?")[0]} failed: HTTP ${response.status} ${detail.slice(0, 500)}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const rpc = (name, jwt, body) => request(`/rest/v1/rpc/${name}`, jwt, { method: "POST", body });

async function existingPlanner() {
  if (Object.hasOwn(process.env, "SAQEEL_TEST_PLANNER_EMAIL") || Object.hasOwn(fileEnv, "SAQEEL_TEST_PLANNER_EMAIL")) {
    return login(setting("SAQEEL_TEST_PLANNER_EMAIL"));
  }
  // Discovery is read-only and only bridges an absent persona reference. The
  // service credential never performs a business write or appears in output.
  const serviceRole = setting("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` };
  const rolesResponse = await fetch(`${url}/rest/v1/user_roles?select=user_id&role_key=eq.planner`, { headers });
  if (!rolesResponse.ok) throw new Error(`Existing Planner discovery failed: HTTP ${rolesResponse.status}`);
  const plannerIds = new Set((await rolesResponse.json()).map(row => row.user_id));
  const authResponse = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
  if (!authResponse.ok) throw new Error(`Existing Planner identity lookup failed: HTTP ${authResponse.status}`);
  const plannerUsers = ((await authResponse.json()).users ?? []).filter(user => plannerIds.has(user.id) && user.email);
  for (const plannerUser of plannerUsers) {
    try {
      return await login(plannerUser.email);
    } catch {
      // A governed account may use a different operator-owned password. Keep
      // searching without logging the protected identity or auth response.
    }
  }
  throw new Error("INSP-703 fixture blocked: no existing Planner persona accepts the configured test password");
}

async function governedInspectorRegion() {
  const ownProfiles = await request(
    `/rest/v1/profiles?select=region&user_id=eq.${inspector.userId}&limit=1`,
    inspector.jwt,
  );
  if (ownProfiles[0]?.region) return ownProfiles[0].region;
  const serviceRole = setting("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(
    `${url}/rest/v1/profiles?select=region&user_id=eq.${inspector.userId}&limit=1`,
    { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } },
  );
  if (!response.ok) throw new Error(`Inspector scope lookup failed: HTTP ${response.status}`);
  return (await response.json())[0]?.region ?? null;
}

const planner = await existingPlanner();
const inspector = await login(inspectorEmail);

async function visibleRuntimeInspection() {
  const rows = await request(
    "/rest/v1/inspections?select=id,visit_id,status,visits!inner(id)&status=eq.in_progress&order=started_at.desc&limit=1",
    inspector.jwt,
  );
  return rows[0] ?? null;
}

let inspection = await visibleRuntimeInspection();
let fixtureAction = "reused";

if (!inspection) {
  const markedVisits = await request(
    `/rest/v1/visits?select=id,package_version_id,execution_mode,assignments!inner(inspector_id,status)` +
      `&notes=eq.${encodeURIComponent(MARKER)}&assignments.inspector_id=eq.${inspector.userId}&limit=1`,
    planner.jwt,
  );
  let visitId = markedVisits[0]?.id;
  let packageVersionId = markedVisits[0]?.package_version_id;

  if (!visitId) {
    const activeVisits = await request(
      "/rest/v1/visits?select=factory_id&planning_status=in.(draft,validated,published,returned)",
      planner.jwt,
    );
    const activeFactoryIds = new Set(activeVisits.map(row => row.factory_id));
    const factories = await request(
      "/rest/v1/factories?select=id,license_number,official_lat,official_lng,region&official_lat=not.is.null&official_lng=not.is.null&license_number=not.is.null&limit=100",
      planner.jwt,
    );
    const inspectorRegion = await governedInspectorRegion();
    if (!inspectorRegion) throw new Error("INSP-703 fixture blocked: Inspector has no governed regional scope");
    const factory = factories.find(row => row.region === inspectorRegion && !activeFactoryIds.has(row.id));
    if (!factory) throw new Error("INSP-703 fixture blocked: no governed factory without an active visit is available");

    const packageVersions = await request(
      "/rest/v1/package_versions?select=id,definition&status=eq.published&order=published_at.desc&limit=100",
      planner.jwt,
    );
    const packageVersion = packageVersions.find(row => Array.isArray(row.definition?.sections) && row.definition.sections.length > 0);
    if (!packageVersion) throw new Error("INSP-703 fixture blocked: no eligible published package version is available");
    packageVersionId = packageVersion.id;

    // Keep this successor outside the earlier v1 window while remaining a
    // normal dated test visit inside the Inspector's governed region.
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.valueOf() + 8 * 60 * 60 * 1000);
    await rpc("publish_single_visit", planner.jwt, {
      p_factory_id: factory.id,
      p_package_version_id: packageVersionId,
      p_inspector_id: inspector.userId,
      p_visit_type: "periodic",
      p_execution_mode: "physical",
      p_window_start: start.toISOString(),
      p_window_end: end.toISOString(),
      p_license_number: factory.license_number,
      p_location_confirmed: true,
      // Planned visits must use the governed factory coordinates; the external
      // planner-coordinate guard correctly refuses a copied override.
      p_planner_lat: null,
      p_planner_lng: null,
      p_notes: MARKER,
      p_resume_plan_id: null,
    });
    const created = await request(
      `/rest/v1/visits?select=id&notes=eq.${encodeURIComponent(MARKER)}&limit=1`,
      planner.jwt,
    );
    visitId = created[0]?.id;
    if (!visitId) throw new Error("INSP-703 fixture blocked: published visit is not RLS-visible to Planner");
    fixtureAction = "created";
  }

  const assignments = await request(
    `/rest/v1/assignments?select=status&visit_id=eq.${visitId}&inspector_id=eq.${inspector.userId}`,
    inspector.jwt,
  );
  if (assignments.length !== 1) throw new Error("INSP-703 fixture blocked: assignment is not RLS-visible to Inspector");
  if (assignments[0].status === "assigned") {
    await rpc("accept_prepare_assignment", inspector.jwt, { p_visit: visitId });
  }

  const preparations = await request(
    `/rest/v1/visit_preparations?select=confirmed_ready_at&visit_id=eq.${visitId}`,
    inspector.jwt,
  );
  if (!preparations.length) {
    await rpc("save_visit_preparation", inspector.jwt, {
      p_visit: visitId,
      p_execution_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      p_confirmed_mode: "physical",
      p_package_version_id: packageVersionId,
      p_form_config: {},
    });
  }
  if (!preparations[0]?.confirmed_ready_at) {
    await rpc("confirm_visit_ready", inspector.jwt, { p_visit: visitId });
  }
  inspection = await visibleRuntimeInspection();
}

if (!inspection) throw new Error("INSP-703 fixture blocked: Inspector cannot read the assigned in-progress inspection through RLS");
const visibleAssignments = await request(
  `/rest/v1/assignments?select=inspector_id,status&visit_id=eq.${inspection.visit_id}`,
  inspector.jwt,
);
const assignment = visibleAssignments[0];
if (!assignment || assignment.inspector_id !== inspector.userId || !["accepted", "ready"].includes(assignment.status)) {
  throw new Error("INSP-703 fixture blocked: visible inspection is not coherently assigned to the configured Inspector");
}

process.stdout.write(safeJson({
  gate: "INSP-703",
  target: "approved_nonproduction",
  fixture_action: fixtureAction,
  authenticated_personas: { planner: true, inspector: true },
  rls_visible: {
    assigned_in_progress_inspections: 1,
    coherent_assignment: true,
  },
}));
