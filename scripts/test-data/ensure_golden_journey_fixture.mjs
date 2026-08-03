#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APPROVED_REF = "iiozvqntawxfwbgffzqu";
const APPLY_ACK = "CONFIRM_GOLDEN_JOURNEY_NONPRODUCTION_FIXTURE";
const PACKAGE_ID = "9e5f0101-0000-4000-8000-000000000001";
const VERSION_ID = "9e5f0101-0000-4000-8000-000000000002";
const PACKAGE_CODE = "PKG-UAT-GOLDEN-FS101";
const VERSION_LABEL = "uat-golden-fs101-v1";
const REQUIRED_ITEMS = ["FS-101", "FS-102", "FS-107", "EG-201", "HZ-310"];
const GIS_AUTHORITY_PATH = resolve("supabase/migrations/0001_foundation.sql");
const RECOVERY_FACTORY_ID = process.env.GOLDEN_RECOVERY_FACTORY_ID?.trim() || null;
const REGULATION = { id: "9e5f0101-0000-4000-8000-000000000010", code: "SBC-801", version_label: "uat-golden-fs101-v2", title: "Fire Code — Industrial", issuing_authority: "Saudi Building Code Committee", effective_from: "2026-08-03" };
const CLAUSES = [
  { id: "9e5f0101-0000-4000-8000-000000000011", regulation_id: REGULATION.id, clause_ref: "4.2", title: "Portable extinguishers — service & tagging", applicability: "all industrial occupancies", legal_source: "Royal Decree M/43 art. 12" },
  { id: "9e5f0101-0000-4000-8000-000000000012", regulation_id: REGULATION.id, clause_ref: "4.7", title: "Fire pump weekly churn test", applicability: "facilities with fixed pumps", legal_source: "SBC-801" },
  { id: "9e5f0101-0000-4000-8000-000000000013", regulation_id: REGULATION.id, clause_ref: "5.1", title: "Exit route obstruction", applicability: "all occupancies", legal_source: "SBC-801" },
  { id: "9e5f0101-0000-4000-8000-000000000014", regulation_id: REGULATION.id, clause_ref: "7.3", title: "Hazmat segregation per class", applicability: "hazmat storage", legal_source: "SBC-801" },
];
const GOVERNED_ITEMS = [
  { id: "b0000000-0000-4000-8000-000000000101", code: "FS-101", title: "Extinguisher service tags current", clause_id: CLAUSES[0].id, response_model: { responses: ["compliant", "non_compliant", "na"], mapping: { non_compliant: { result: "Non-Compliant", violation: "V-FS-09", action_form: "corrective_blocking" } } }, evidence_rule: { on: "non_compliant", type: "photo", min: 1, mandatory: true }, score_weight: 5, guidance_en: "Check service tag dates on all extinguishers", active: true },
  { id: "b0000000-0000-4000-8000-000000000102", code: "FS-102", title: "Sprinkler control valve accessible & sealed open", clause_id: CLAUSES[0].id, response_model: { responses: ["compliant", "non_compliant", "na"], mapping: { non_compliant: { result: "Non-Compliant" } }, score_excluded_on: ["na"] }, evidence_rule: null, score_weight: 5, guidance_en: "Valve must be accessible and sealed in open position", active: true },
  { id: "b0000000-0000-4000-8000-000000000107", code: "FS-107", title: "Pump room weekly run log", clause_id: CLAUSES[1].id, response_model: { responses: ["value_date"], conditional: { visible_when: "fire_pump_present=yes", mandatory_when_visible: true } }, evidence_rule: { on: "any", type: "document", mandatory: false }, score_weight: 3, guidance_en: "Verify weekly churn test log", active: true },
  { id: "b0000000-0000-4000-8000-000000000201", code: "EG-201", title: "Exit routes unobstructed", clause_id: CLAUSES[2].id, response_model: { responses: ["compliant", "non_compliant"], mapping: { non_compliant: { result: "Non-Compliant", violation: "V-FS-01", action_form: "corrective_blocking" } } }, evidence_rule: { on: "non_compliant", type: "photo", min: 1, mandatory: true, note: true }, score_weight: 8, guidance_en: "All egress paths clear of obstruction", active: true },
  { id: "b0000000-0000-4000-8000-000000000310", code: "HZ-310", title: "Hazmat segregation per class", clause_id: CLAUSES[3].id, response_model: { responses: ["compliant", "non_compliant", "na"], conditional: { visible_when: "hazmat_present=yes", mandatory_when_visible: true }, mapping: { non_compliant: { result: "Non-Compliant", violation: "V-HZ-02" } } }, evidence_rule: { on: "non_compliant", type: "photo", min: 1, mandatory: true }, score_weight: 8, guidance_en: "Verify segregation distances per hazard class", active: true },
];
const apply = process.argv.includes("--apply");
const envPath = resolve(process.env.E2E_ENV_FILE || "apps/web/.env.local");

function parseEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1)]; }));
}
const fileEnv = parseEnv(envPath);
function setting(name) {
  const present = Object.hasOwn(process.env, name) || Object.hasOwn(fileEnv, name);
  const value = Object.hasOwn(process.env, name) ? process.env[name] : fileEnv[name];
  if (!present || !value?.trim()) throw new Error(`GOLDEN_FIXTURE_REFUSED: ${name} is required`);
  return value;
}

const url = setting("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = setting("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRole = setting("SUPABASE_SERVICE_ROLE_KEY");
const password = setting("SAQEEL_CROSS_ROLE_PASSWORD");
const plannerEmail = setting("SAQEEL_TEST_PLANNER_EMAIL");
const adminEmail = setting("SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL");
const projectRef = new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
if (process.env.NODE_ENV === "production" || projectRef !== APPROVED_REF) {
  throw new Error("GOLDEN_FIXTURE_REFUSED: target is not the approved non-production project");
}
if (apply && process.env.GOLDEN_JOURNEY_FIXTURE_APPLY !== APPLY_ACK) {
  throw new Error("GOLDEN_FIXTURE_REFUSED: explicit apply acknowledgement is absent");
}

const serviceHeaders = { apikey: serviceRole, Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" };
const userHeaders = jwt => ({ apikey: anonKey, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" });
const scrub = text => text.replaceAll(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[REDACTED_JWT]");

async function request(path, { method = "GET", headers = serviceHeaders, body, prefer } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} failed: HTTP ${response.status} ${scrub(text).slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function login(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`GOLDEN_FIXTURE_AUTH_FAILED: HTTP ${response.status}`);
  const body = await response.json();
  return { jwt: body.access_token, userId: body.user.id };
}
const containsFs101 = definition => (definition?.sections ?? []).some(section => (section.items ?? []).includes("FS-101"));

function acceptedGeofenceAuthority() {
  const source = readFileSync(GIS_AUTHORITY_PATH, "utf8");
  const match = source.match(/\('gis',\s*'([^']*"geofence_default_radius_m":\s*(\d+)[^']*)',\s*'([^']+)'\)/);
  const radius = Number(match?.[2]);
  if (!match || !Number.isSafeInteger(radius) || radius <= 0 || !match[3].startsWith("v1-accepted-")) {
    throw new Error("GOLDEN_FIXTURE_REFUSED: accepted GIS geofence authority is unavailable");
  }
  return { radius, version: match[3] };
}

const planner = await login(plannerEmail);
const admin = await login(adminEmail);
const roleRows = await request(`/rest/v1/user_roles?select=user_id,role_key&user_id=in.(${planner.userId},${admin.userId})`);
if (!roleRows.some(row => row.user_id === planner.userId && row.role_key === "planner")) throw new Error("GOLDEN_FIXTURE_REFUSED: planner role proof failed");
if (!roleRows.some(row => row.user_id === admin.userId && row.role_key === "admin")) throw new Error("GOLDEN_FIXTURE_REFUSED: admin role proof failed");
if (planner.userId === admin.userId) throw new Error("GOLDEN_FIXTURE_REFUSED: maker and approver must be distinct");

async function reconcileRecoveryFactoryGeofence() {
  if (!RECOVERY_FACTORY_ID) return { requested: false, changed: false };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(RECOVERY_FACTORY_ID)) {
    throw new Error("GOLDEN_FIXTURE_REFUSED: GOLDEN_RECOVERY_FACTORY_ID must be a UUID");
  }
  const authority = acceptedGeofenceAuthority();
  const rows = await request(`/rest/v1/factories?select=id,factory_code,geofence_radius_m&id=eq.${RECOVERY_FACTORY_ID}`);
  if (rows.length !== 1 || !rows[0].factory_code?.startsWith("R3-QA-CERT-")) {
    throw new Error("GOLDEN_FIXTURE_REFUSED: recovery factory is absent or not harness-owned");
  }
  const before = rows[0].geofence_radius_m;
  if (before !== null && before !== authority.radius) {
    throw new Error("GOLDEN_FIXTURE_COLLISION: recovery factory has a different governed geofence radius");
  }
  if (before === authority.radius) return { requested: true, changed: false, ...authority };
  if (apply) {
    const updated = await request(`/rest/v1/factories?id=eq.${RECOVERY_FACTORY_ID}`, {
      method: "PATCH", body: { geofence_radius_m: authority.radius }, prefer: "return=representation",
    });
    if (updated.length !== 1 || updated[0].id !== RECOVERY_FACTORY_ID || updated[0].geofence_radius_m !== authority.radius) {
      throw new Error("GOLDEN_FIXTURE_CERTIFICATION_FAILED: recovery factory geofence");
    }
    await request("/rest/v1/audit_events", { method: "POST", body: {
      actor: admin.userId,
      object_type: "factories",
      object_id: RECOVERY_FACTORY_ID,
      action: "nonproduction_golden_geofence_reconciled",
      before_state: { geofence_radius_m: before, fixture_owner: rows[0].factory_code },
      after_state: { geofence_radius_m: authority.radius, fixture_owner: rows[0].factory_code },
      requirement_refs: ["MVP1-M05-001", "EXE-GEO-001"],
      config_versions: { gis: authority.version },
    }, prefer: "return=minimal" });
  }
  return { requested: true, changed: apply, ...authority };
}

const geofenceReconciliation = await reconcileRecoveryFactoryGeofence();

async function ensureExact(table, row, identityFields) {
  const existing = await request(`/rest/v1/${table}?select=*&id=eq.${row.id}`);
  if (existing.length) {
    if (identityFields.some(field => canonical(existing[0][field]) !== canonical(row[field]))) {
      throw new Error(`GOLDEN_FIXTURE_COLLISION: ${table} ${row.id}`);
    }
    return false;
  }
  if (apply) await request(`/rest/v1/${table}`, { method: "POST", body: row, prefer: "return=minimal" });
  return true;
}

function canonical(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map(entry => JSON.parse(canonical(entry))));
  if (value && typeof value === "object") return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(key => [key, JSON.parse(canonical(value[key]))])));
  return JSON.stringify(value);
}

const plannedGovernedRows = [];
const regulationRows = await request(`/rest/v1/regulations?select=id,code,version_label,title,issuing_authority,status&id=eq.${REGULATION.id}`);
const regulationWasAbsent = regulationRows.length === 0;
if (regulationRows.length) {
  const row = regulationRows[0];
  if (row.code !== REGULATION.code || row.version_label !== REGULATION.version_label || row.title !== REGULATION.title || row.issuing_authority !== REGULATION.issuing_authority || row.status !== "published") {
    throw new Error(`GOLDEN_FIXTURE_COLLISION: regulations ${REGULATION.id}`);
  }
} else {
  plannedGovernedRows.push(REGULATION.id);
  if (apply) await request("/rest/v1/regulations", { method: "POST", body: { ...REGULATION, status: "draft", created_by: planner.userId }, prefer: "return=minimal" });
}
for (const clause of CLAUSES) if (await ensureExact("regulation_clauses", clause, ["regulation_id", "clause_ref", "title", "applicability", "legal_source"])) plannedGovernedRows.push(clause.id);
for (const item of GOVERNED_ITEMS) if (await ensureExact("inspection_items", item, ["code", "title", "clause_id", "response_model", "evidence_rule", "score_weight", "guidance_en", "active"])) plannedGovernedRows.push(item.id);
if (apply && regulationWasAbsent) await request("/rest/v1/rpc/publish_regulation", { method: "POST", headers: userHeaders(admin.jwt), body: { p_regulation_id: REGULATION.id } });

const items = apply || plannedGovernedRows.length === 0
  ? await request(`/rest/v1/inspection_items?select=id,code,title,response_model,evidence_rule,score_weight,score_excluded_on,guidance_en,guidance_ar,active,regulation_clauses(clause_ref,legal_source,regulations(status))&code=in.(${REQUIRED_ITEMS.join(",")})`)
  : GOVERNED_ITEMS.map(item => ({ ...item, regulation_clauses: { clause_ref: CLAUSES.find(clause => clause.id === item.clause_id).clause_ref, legal_source: CLAUSES.find(clause => clause.id === item.clause_id).legal_source, regulations: { status: "published" } } }));
const byCode = new Map(items.map(item => [item.code, item]));
for (const code of REQUIRED_ITEMS) if (!byCode.get(code)?.active || byCode.get(code)?.regulation_clauses?.regulations?.status !== "published") throw new Error(`GOLDEN_FIXTURE_REFUSED: governed item is unavailable (${code})`);

const definition = {
  fixture: "UAT_GOLDEN_FS101_V1",
  classification: "NONPRODUCTION_SYNTHETIC",
  sections: [
    { key: "factory_verification", title: "Factory verification", title_en: "Factory verification", title_ar: "Factory verification", language_fallback: "en", fields: ["rep_name", "rep_role", "location_confirm"] },
    { key: "s1", title: "Fire protection systems", title_en: "Fire protection systems", title_ar: "Fire protection systems", language_fallback: "en", items: ["FS-101", "FS-102", "FS-107"], mandatory: true },
    { key: "s2", title: "Exits & evacuation", title_en: "Exits & evacuation", title_ar: "Exits & evacuation", language_fallback: "en", items: ["EG-201"], mandatory: true },
    { key: "s3", title: "Hazardous materials", title_en: "Hazardous materials", title_ar: "Hazardous materials", language_fallback: "en", items: ["HZ-310"], mandatory: true },
  ],
  action_forms: [{ key: "corrective_blocking", title: "Corrective action form", blocking: true, fields: ["owner_name", "owner_role", "due_at", "required_correction"] }],
  item_rules: Object.fromEntries(REQUIRED_ITEMS.map(code => {
    const item = byCode.get(code);
    const conditional = item.response_model?.conditional;
    return [code, {
      requirement: conditional ? "conditional" : "required",
      ...(conditional ? { conditional } : {}),
      ...(item.response_model?.mapping ? { response_mapping: item.response_model.mapping } : {}),
      ...(item.evidence_rule ? { evidence_rule: item.evidence_rule } : {}),
      scoring_enabled: true,
      score_weight: item.score_weight,
    }];
  })),
  item_snapshot: Object.fromEntries(REQUIRED_ITEMS.map(code => {
    const item = byCode.get(code);
    const rule = definitionItemRule(item);
    return [code, {
      ...item,
      response_model: {
        ...item.response_model,
        requirement: rule.requirement,
        ...(rule.conditional ? { conditional: rule.conditional } : {}),
        ...(rule.response_mapping ? { mapping: rule.response_mapping } : {}),
        scoring_enabled: rule.scoring_enabled,
      },
      evidence_rule: rule.evidence_rule ?? item.evidence_rule ?? null,
      score_weight: rule.score_weight,
      score_excluded_on: item.score_excluded_on ?? null,
    }];
  })),
  violation_snapshot: {},
  template_snapshot: {},
};

function definitionItemRule(item) {
  const conditional = item.response_model?.conditional;
  return {
    requirement: conditional ? "conditional" : "required",
    ...(conditional ? { conditional } : {}),
    ...(item.response_model?.mapping ? { response_mapping: item.response_model.mapping } : {}),
    ...(item.evidence_rule ? { evidence_rule: item.evidence_rule } : {}),
    scoring_enabled: true,
    score_weight: item.score_weight,
  };
}

const existingVersions = await request(`/rest/v1/package_versions?select=id,package_id,version_label,status,definition&id=eq.${VERSION_ID}`);
if (existingVersions.length) {
  const version = existingVersions[0];
  if (version.package_id !== PACKAGE_ID || version.version_label !== VERSION_LABEL || !["draft", "published"].includes(version.status)) {
    throw new Error("GOLDEN_FIXTURE_COLLISION: deterministic version does not match the accepted fixture");
  }
  if (version.status === "published") {
    if (!containsFs101(version.definition)) throw new Error("GOLDEN_FIXTURE_COLLISION: published deterministic version lacks FS-101");
    process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "dry-run", target: "approved_nonproduction", changed: geofenceReconciliation.changed, geofence_reconciliation: geofenceReconciliation, planner_authenticated: true, admin_authenticated: true, maker_checker_distinct: true, package_id: PACKAGE_ID, version_id: VERSION_ID, status: "published", has_fs101: true }, null, 2)}\n`);
    process.exit(0);
  }
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", target: "approved_nonproduction", changed: false, planner_authenticated: true, admin_authenticated: true, maker_checker_distinct: true, planned_publish_existing_draft: VERSION_ID, governed_items_verified: REQUIRED_ITEMS, remote_writes: 0 }, null, 2)}\n`);
    process.exit(0);
  }
}

if (!apply) {
  process.stdout.write(`${JSON.stringify({ mode: "dry-run", target: "approved_nonproduction", changed: false, planner_authenticated: true, admin_authenticated: true, maker_checker_distinct: true, planned_governed_rows: plannedGovernedRows.length, planned_package_id: PACKAGE_ID, planned_version_id: VERSION_ID, governed_items_verified: REQUIRED_ITEMS, remote_writes: 0 }, null, 2)}\n`);
  process.exit(0);
}

const packages = await request(`/rest/v1/packages?select=id,code&id=eq.${PACKAGE_ID}`);
if (packages.length && packages[0].code !== PACKAGE_CODE) throw new Error("GOLDEN_FIXTURE_COLLISION: deterministic package id is owned by another fixture");
if (!packages.length) await request("/rest/v1/packages", { method: "POST", body: { id: PACKAGE_ID, code: PACKAGE_CODE, title: "UAT Golden Journey — governed FS-101 fixture", scope: "Non-production golden-journey verification only" }, prefer: "return=minimal" });
if (!existingVersions.length) await request("/rest/v1/package_versions", { method: "POST", body: { id: VERSION_ID, package_id: PACKAGE_ID, version_label: VERSION_LABEL, status: "draft", definition, effective_from: "2026-08-03", created_by: planner.userId }, prefer: "return=minimal" });
await request("/rest/v1/rpc/publish_package_version", { method: "POST", headers: userHeaders(admin.jwt), body: { p_version_id: VERSION_ID, p_definition: definition } });

const published = (await request(`/rest/v1/package_versions?select=id,package_id,status,definition,published_at&id=eq.${VERSION_ID}`))[0];
if (!published || published.package_id !== PACKAGE_ID || published.status !== "published" || !published.published_at || !containsFs101(published.definition)) {
  throw new Error("GOLDEN_FIXTURE_CERTIFICATION_FAILED");
}
process.stdout.write(`${JSON.stringify({ mode: "apply", target: "approved_nonproduction", changed: true, planner_authenticated: true, admin_authenticated: true, maker_checker_distinct: true, governed_items_verified: REQUIRED_ITEMS, package_id: PACKAGE_ID, version_id: VERSION_ID, status: published.status, has_fs101: true }, null, 2)}\n`);
