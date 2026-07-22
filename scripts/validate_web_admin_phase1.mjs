#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contract = path.join(root, "product-contract/web-admin-phase1");
const planning = path.join(root, ".planning-pack/web-admin-phase1");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function parseCsv(file) {
  const text = fs.readFileSync(file, "utf8");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.filter(values => values.some(Boolean)).map(values =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

const requirements = parseCsv(path.join(contract, "REQUIREMENT_BASELINE.csv"));
const routes = parseCsv(path.join(contract, "ROUTE_INVENTORY.csv"));
const designs = parseCsv(path.join(contract, "DESIGN_ROUTE_MAP.csv"));
const packages = parseCsv(path.join(contract, "PACKAGE_MANIFEST.csv"));
const sources = parseCsv(path.join(contract, "SOURCE_MANIFEST.csv"));
const acceptance = parseCsv(path.join(contract, "ACCEPTANCE_CRITERIA.csv"));
const migrations = parseCsv(path.join(contract, "CURRENT_TO_TARGET_MIGRATION.csv"));
const designSources = parseCsv(path.join(contract, "DESIGN_SOURCE_MANIFEST.csv"));
const authorityPackages = parseCsv(path.join(contract, "AUTHORITY_PACKAGE_MANIFEST.csv"));
const f0Migrations = parseCsv(path.join(contract, "F0_CURRENT_TO_TARGET_MIGRATION.csv"));

const allowedDispositions = new Set([
  "PHASE1_WEB", "PHASE1_ADMIN", "PHASE1_SHARED_BACKEND", "PHASE2_IPAD_DEFERRED",
  "EXTERNAL_CONTRACT_BLOCKED", "OPEN_BUSINESS_DECISION",
]);

if (requirements.length !== 478) fail(`expected 478 requirements, found ${requirements.length}`);
const requirementIds = new Set(requirements.map(row => row.requirement_id));
if (requirementIds.size !== 478) fail("requirement IDs are not unique");
for (let index = 1; index <= 478; index += 1) {
  const id = `CR-${String(index).padStart(3, "0")}`;
  if (!requirementIds.has(id)) fail(`missing requirement ${id}`);
}
for (const row of requirements) {
  if (!allowedDispositions.has(row.disposition)) fail(`${row.requirement_id} has invalid disposition ${row.disposition}`);
  if (!row.source_coordinate || !row.original_source_text || !row.source_sha256) fail(`${row.requirement_id} lacks source traceability`);
  if (!row.target_module_id || !row.acceptance_ids || !row.evidence_ids) fail(`${row.requirement_id} lacks target/acceptance/evidence mapping`);
  if (row.disposition === "PHASE2_IPAD_DEFERRED" && !row.target_routes.startsWith("/field")) fail(`${row.requirement_id} deferred route is not /field/**`);
}

const pageRoutes = routes.filter(row => row.route_type === "PAGE");
const apiRoutes = routes.filter(row => row.route_type === "API");
const phase1Pages = pageRoutes.filter(row => row.phase_scope === "PHASE1_WEB_ADMIN");
const phase2Pages = pageRoutes.filter(row => row.phase_scope === "PHASE2_IPAD_DEFERRED");
if (pageRoutes.length !== 76) fail(`expected 76 page routes, found ${pageRoutes.length}`);
if (phase1Pages.length !== 71) fail(`expected 71 Phase 1 page routes, found ${phase1Pages.length}`);
if (phase2Pages.length !== 5) fail(`expected 5 deferred field routes, found ${phase2Pages.length}`);
if (apiRoutes.length !== 3) fail(`expected 3 API routes, found ${apiRoutes.length}`);
for (const row of phase1Pages) {
  if (["", "UNASSIGNED", "PHASE2"].includes(row.owner_package)) fail(`${row.route} lacks a Phase 1 owner`);
  if (!row.page_or_handler_file || !row.persona_permission_guard || !row.evidence_status) fail(`${row.route} lacks route inventory evidence`);
}

if (migrations.length !== 71) fail(`expected 71 current-to-target migration rows, found ${migrations.length}`);
if (new Set(migrations.map(row => row.current_route)).size !== 71) fail("migration routes are not unique");
for (const row of migrations) {
  for (const field of ["current_files", "saqeel_design_reference", "requirement_ids", "existing_behavior", "backend_contracts", "permissions", "current_tests", "required_certification", "replacement_strategy", "cutover_method", "rollback_method", "legacy_retention"]) {
    if (!row[field]) fail(`${row.migration_id} lacks ${field}`);
  }
  if (!row.cutover_method.includes("Product Owner approval")) fail(`${row.migration_id} lacks Product Owner cutover approval`);
  if (!row.legacy_retention.includes("RETAIN_UNTIL_STABILIZATION")) fail(`${row.migration_id} does not retain the prior implementation`);
  if (!new Set(["DIRECT_REPLACEMENT_AFTER_CERTIFICATION", "FEATURE_FLAG_OR_GUARDED_PREVIEW_REQUIRED"]).has(row.replacement_strategy)) fail(`${row.migration_id} has an invalid strategy`);
}
for (const row of routes) {
  for (const field of ["owner_package", "requirement_ids", "design_authority", "acceptance_ids", "dependencies", "tests", "evidence_status"]) {
    if (!row[field]) fail(`${row.route} lacks ${field}`);
  }
}

if (designs.length !== 46) fail(`expected 46 design rows, found ${designs.length}`);
if (designSources.length !== 46) fail(`expected 46 design source rows, found ${designSources.length}`);
for (const row of designSources) {
  if (!row.logical_path || !row.size_bytes || !/^[a-f0-9]{64}$/.test(row.sha256) || !row.authority || !row.version || !row.external_storage_pointer) fail(`${row.source_id} lacks source manifest authority`);
  if (row.git_storage !== "PROHIBITED_BINARY_EXTERNAL_ONLY") fail(`${row.source_id} violates binary storage policy`);
}
if (authorityPackages.length !== 1 || !/^[a-f0-9]{64}$/.test(authorityPackages[0].sha256)) fail("authority package manifest is invalid");
if (f0Migrations.length !== 7) fail(`expected 7 F0 migration rows, found ${f0Migrations.length}`);
for (const row of f0Migrations) {
  for (const field of ["current_files", "design_ids", "requirement_ids", "existing_behavior", "backend_contracts", "permissions", "current_tests", "replacement_strategy", "cutover_method", "rollback_method", "legacy_retention"]) {
    if (!row[field]) fail(`${row.migration_id} lacks ${field}`);
  }
}
const uniqueDesigns = new Set(designs.map(row => row.sha256));
if (uniqueDesigns.size !== 45) fail(`expected 45 unique design payloads, found ${uniqueDesigns.size}`);
const aliases = designs.filter(row => row.unique_payload === "IDENTICAL_ALIAS");
if (aliases.length !== 1 || aliases[0].duplicate_of !== "SAQEEL Admin Lookups.dc.html") fail("Admin Lookups duplicate alias is not recorded exactly once");
for (const row of designs) {
  if (!row.target_routes || !row.owner_package || !row.delta_class || !row.reference_viewport) fail(`${row.design_id} is incompletely mapped`);
  if (!row.visual_acceptance.includes("ZERO_UNAPPROVED_DIFF")) fail(`${row.design_id} lacks the visual acceptance gate`);
  for (const field of ["requirement_ids", "acceptance_ids", "dependencies", "evidence_ids", "backend_preservation", "required_states", "functional_acceptance"]) {
    if (!row[field]) fail(`${row.design_id} lacks ${field}`);
  }
}

if (packages.length !== 12) fail(`expected 12 implementation packages, found ${packages.length}`);
const expectedPackages = ["F0", ...Array.from({ length: 11 }, (_, index) => `M${index + 1}`)];
const packageIds = new Set(packages.map(row => row.package_id));
for (const id of expectedPackages) if (!packageIds.has(id)) fail(`missing package ${id}`);
for (const row of packages) {
  if (row.route_ownership.includes("/field") || row.exact_current_files.includes("/(app)/field/")) fail(`${row.package_id} owns prohibited Phase 2 files`);
  if (!row.test_contract || !row.rollback || !row.completion_command) fail(`${row.package_id} lacks test/rollback/completion contracts`);
  const prompt = path.join(planning, "prompts", `${row.package_id}_IMPLEMENTATION_PROMPT.md`);
  if (!fs.existsSync(prompt)) fail(`missing prompt ${prompt}`);
}

if (sources.length !== 9) fail(`expected 9 approved customer sources, found ${sources.length}`);
for (const source of sources) {
  if (!/^[a-f0-9]{64}$/.test(source.sha256)) fail(`${source.source_id} has an invalid SHA-256`);
  if (!source.logical_path || !source.size_bytes || !source.authority || !source.version || !source.external_storage_pointer) fail(`${source.source_id} lacks source manifest authority`);
  if (source.git_storage !== "PROHIBITED_BINARY_EXTERNAL_ONLY") fail(`${source.source_id} violates documentation storage policy`);
}

if (acceptance.length !== 72) fail(`expected 72 package acceptance rows, found ${acceptance.length}`);
if (new Set(acceptance.map(row => row.acceptance_id)).size !== 72) fail("package acceptance IDs are not unique");

const prohibitedExtensions = new Set([".zip", ".xlsx", ".xls", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".mp4", ".webm"]);
for (const base of [contract, planning]) {
  for (const entry of fs.readdirSync(base, { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && prohibitedExtensions.has(path.extname(entry.name).toLowerCase())) fail(`prohibited binary artifact committed under planning authority: ${entry.name}`);
  }
}

if (!process.exitCode) {
  const counts = Object.fromEntries([...allowedDispositions].map(value => [value, requirements.filter(row => row.disposition === value).length]));
  console.log(JSON.stringify({
    status: "PASS",
    requirements: requirements.length,
    dispositions: counts,
    phase1PageRoutes: phase1Pages.length,
    phase2PageRoutes: phase2Pages.length,
    apiRoutes: apiRoutes.length,
    designFiles: designs.length,
    uniqueDesignPayloads: uniqueDesigns.size,
    packages: packages.length,
    migrationRows: migrations.length,
    acceptanceRows: acceptance.length,
  }, null, 2));
}
