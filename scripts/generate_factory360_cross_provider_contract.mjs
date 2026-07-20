import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const f360 = path.join(root, "product-contract", "factory-360");
const source = path.join(root, ".local-inputs", "industry-shared-factory360-gap-2026-07-20", "SAQEEL_INDUSTRY_SHARED_API_FACTORY360_GAP_CLOSURE_PACK_2026-07-20", "01_SOURCE_AUTHORITY", "Inspection_API_documentation.sanitized.json");
const inventory = path.join(f360, "FACTORY_360_API_FIELD_INVENTORY.csv");

function csvCell(value) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function csv(rows) { return rows.map(row => row.map(csvCell).join(",")).join("\n") + "\n"; }
function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) { const c = text[i]; const n = text[i + 1];
    if (quoted && c === '"' && n === '"') { cell += '"'; i += 1; }
    else if (c === '"') quoted = !quoted;
    else if (!quoted && c === ",") { row.push(cell); cell = ""; }
    else if (!quoted && c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function write(rel, rows) { fs.writeFileSync(path.join(f360, rel), csv(rows)); }
function endpointId(name) { return ({ "User > Login": "INSP-API-001", "User > Logout": "INSP-API-002", "User > Profile": "INSP-API-003", "User > Forget Password": "INSP-API-004", "User > Reset Password": "INSP-API-005", "Regulation > List Regulation": "INSP-API-006", "Regulation > Show Regulation": "INSP-API-007", "Task > List Task": "INSP-API-008", "Task > Show Task": "INSP-API-009", "Task > Plant Production Line": "INSP-API-010", "Task > Submit Inspection": "INSP-API-011" })[name]; }
function classify(endpoint, direction, field) {
  const p = field.toLowerCase();
  if (p.includes("password") || p === "$.token") return ["SENSITIVE_RESTRICTED", "none", "Never persist; credential/session boundary only."];
  if (p.includes("national_id") || p.includes("mobile") || p.includes("email") || p.includes("date_of_birth")) return ["SENSITIVE_RESTRICTED", "restricted_identity_snapshot", "Permission-filtered only; no offline inclusion without policy proof."];
  if (direction === "request") return ["TRANSIENT_REQUEST_ONLY", "none", "Validated only at the server-side request boundary."];
  if (p.endsWith(".id") || p.endsWith("_id")) return ["SOURCE_METADATA", "external_id", "Retain provider ID with source and version metadata."];
  if (p.includes("created_at") || p.includes("updated_at") || p.includes("synched_at") || p.includes("last_ops_at")) return ["SOURCE_METADATA", "source_timestamp", "Preserve as provider timestamp; do not overwrite platform audit time."];
  if (endpoint.includes("Regulation")) return ["CANONICAL_FIELD", "regulations_or_inspection_items", "Typed regulation adapter owns the canonical projection."];
  if (endpoint.includes("Production Line")) return ["CANONICAL_FIELD", "plant_production_line_items", "Typed production-line adapter owns the canonical projection."];
  if (endpoint.includes("Task")) return ["CANONICAL_FIELD", "inspection_tasks_or_observed_fact", "Task detail is context/observed fact; immutable report remains authoritative for compliance."];
  if (endpoint.includes("Profile")) return ["SENSITIVE_RESTRICTED", "restricted_user_profile", "Identity profile is not Factory 360 business master data."];
  return ["RAW_SNAPSHOT_ONLY", "provider_raw_snapshot", "No canonical persistence is inferred beyond the verified structural snapshot."];
}

const collection = JSON.parse(fs.readFileSync(source, "utf8"));
const endpointRows = [["endpoint_id","provider_family","name","method","path","auth_contract","content_type","status","authority_semantics","evidence"]];
for (const group of collection.item) for (const item of group.item) {
  const id = endpointId(`${group.name} > ${item.name}`);
  const url = item.request?.url?.raw ?? "NOT_DOCUMENTED";
  const method = item.request?.method ?? "NOT_DOCUMENTED";
  const auth = item.request?.auth?.type ?? (group.name === "User" && item.name !== "Logout" && item.name !== "Profile" ? "NOT_DOCUMENTED" : "bearer");
  const contentType = item.request?.body?.mode === "formdata" ? "multipart/form-data" : item.request?.body?.mode === "raw" ? "application/json" : "NOT_DOCUMENTED";
  const semantics = id === "INSP-API-011" ? "submission_candidate_BLOCKED_TRIGGER_DECISION" : id?.startsWith("INSP-API-00") ? "provider_contract" : "NOT_DOCUMENTED";
  endpointRows.push([id, "Inspection API", item.name, method, url.replace(/^https:\/\/[^/]+/, ""), auth, contentType, "STRUCTURALLY_DOCUMENTED", semantics, "Inspection_API_documentation.sanitized.json"]);
}
write("FACTORY_360_INSPECTION_API_CONSUMPTION_LEDGER.csv", endpointRows);

const fields = parseCsv(fs.readFileSync(inventory, "utf8"));
const header = fields.shift(); const index = Object.fromEntries(header.map((v, i) => [v, i]));
const mapping = [["mapping_id","endpoint_id","provider_family","direction","external_field_path","external_type","required_optional","enum_or_validation","canonical_entity","canonical_field","disposition","transformation","persistence_rule","history_version_rule","web_consumer","ipad_consumer","offline_inclusion","status","evidence"]];
for (let i = 0; i < fields.length; i += 1) {
  const row = fields[i]; const endpoint = row[index.endpoint]; const direction = row[index.direction]; const field = row[index.field_path];
  const [disposition, canonicalField, note] = classify(endpoint, direction, field);
  mapping.push([`F360-XPC-MAP-${String(i + 1).padStart(4, "0")}`, endpointId(endpoint), "Inspection API", direction, field, row[index.data_type], "NOT_DOCUMENTED", "NOT_DOCUMENTED", canonicalField === "none" ? "none" : canonicalField, canonicalField, disposition, "Typed adapter normalization where an existing adapter declares this field; otherwise preserve exact structural path.", note, disposition === "CANONICAL_FIELD" ? "Provider source/version retained; platform audit is separate." : "No platform history inferred.", "Shared Factory 360 server projection or not consumed", "Same shared server projection; no provider client", disposition === "SENSITIVE_RESTRICTED" ? "EXCLUDED_PENDING_POLICY" : disposition === "TRANSIENT_REQUEST_ONLY" ? "NOT_APPLICABLE" : "CANONICAL_VERSION_ONLY", "STRUCTURALLY_DOCUMENTED", "FACTORY_360_API_FIELD_INVENTORY.csv"]);
}
write("FACTORY_360_API_FIELD_MAPPING_LEDGER.csv", mapping);

write("FACTORY_360_SOURCE_PRECEDENCE_MATRIX.csv", [["field_group","master_value","observed_context_value","source","timestamp_version","reconciliation_rule","conflict_state","status"],
  ["Commercial Registration / Industrial Licence / Plant","Verified provider master field when endpoint contract is complete","Inspection task visit context","Inspection API; Industry Shared pending contract","provider source timestamp + external ID","Never overwrite; retain source-labelled discrepancy","DISCREPANCY_REQUIRES_REVIEW","PARTIAL"],
  ["Industrial activities/products/materials/machines/spare parts","Verified provider structural record","Inspection task and report context","Inspection API production-line; Industry Shared pending","provider timestamp/version when documented","Provider values are source-labelled; no guessed authority","UNVERIFIED_AUTHORITY","PARTIAL"],
  ["Workforce/contacts/delegations","No master selected","Read-only provider snapshot only","Industry Shared","contract not supplied","Separate domains; privacy/RLS proof required before persistence","BLOCKED_PRIVACY_CONTRACT","BLOCKED_EXTERNAL"],
  ["Risk","Existing Risk Engine","none","Inspection Platform","risk model version","Risk Engine is authoritative; provider facts are inputs only after verification","SOURCE_INPUT_PENDING","IMPLEMENTED"],
  ["Compliance/reports/violations/penalties","Approved immutable inspection report","Task/submission observed values","Inspection Platform","submission version + audit timestamp","Never overwrite immutable report; compare observed/provider facts separately","DISCREPANCY_REQUIRES_REVIEW","IMPLEMENTED"]]);
write("FACTORY_360_WEB_IPAD_CONSUMPTION_MATRIX.csv", [["consumer","input_contract","projection","provider_client_allowed","id_rule","null_unavailable_rule","offline_rule","status"],
  ["Web Factory 360","typed server adapter results","shared Factory 360 dossier loader","no","canonical external/source IDs","neutral unavailable state with provider code","reads canonical version only","PARTIAL"],
  ["iPad shared dossier","same typed server adapter results","shared Factory 360 dossier loader","no","same canonical IDs","same neutral unavailable state","permission-filtered canonical snapshot only","PARTIAL"],
  ["Offline snapshot","canonical server projection","versioned dossier snapshot","no","canonical IDs + source/version metadata","unavailable fields remain unavailable","never raw provider payload or credentials","IMPLEMENTED"]]);
write("FACTORY_360_ERROR_AND_UNAVAILABLE_CONTRACT.csv", [["provider_family","condition","canonical_code","user_behavior","retry","sensitive_detail","status"],
  ["Industry Shared","any endpoint without CONTRACT_VERIFIED definition","INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED","show unavailable; do not call network","no","none","IMPLEMENTED"],
  ["Inspection API","configuration missing","SENAEI_* configuration code","show configured-unavailable state","after configuration","none","IMPLEMENTED"],
  ["Inspection API","HTTP/network/invalid JSON","SENAEI_HTTP_ERROR / SENAEI_NETWORK_ERROR / SENAEI_INVALID_JSON","degraded result; preserve existing dossier","GET only per client contract","none","IMPLEMENTED"],
  ["External submission","governed trigger absent","BLOCKED_TRIGGER_DECISION","retain payload/outbox contract; do not forward","no","none","IMPLEMENTED"]]);
write("FACTORY_360_OFFLINE_VERSION_CONTRACT.csv", [["subject","source","snapshot_content","version_rule","permission_rule","conflict_rule","status"],
  ["Factory 360 dossier","shared server projection","canonical fields, availability, source metadata","snapshot version + source timestamps","role/RLS filtered","never silently overwrite","PARTIAL"],
  ["Inspection API provider payload","server adapter","no raw payload","not stored as offline payload","exclude credentials and restricted identity","not applicable","IMPLEMENTED"],
  ["Industry Shared","fail-closed provider","unavailable state only until verified","no raw payload or contract guess","sensitive domains excluded pending proof","not applicable","IMPLEMENTED"],
  ["Submission outbox","server-side payload builder","governed submission envelope only","immutable version + idempotency pending provider evidence","role/audit governed","BLOCKED_TRIGGER_DECISION","PARTIAL"]]);
write("FACTORY_360_EXTERNAL_SUBMISSION_CONTRACT.csv", [["endpoint_id","path","method","content_type","payload_contract","attachments","idempotency","forwarding","status","evidence"],
  ["INSP-API-011","/api/inspection/tasks/submit-inspection/{task}","POST","multipart/form-data","Every documented request field is inventoried in FACTORY_360_API_FIELD_MAPPING_LEDGER.csv; conditional rules remain NOT_DOCUMENTED unless structurally documented.","FormData boundary required; attachment field semantics structurally documented only.","NOT_DOCUMENTED","BLOCKED_TRIGGER_DECISION","PARTIAL","Inspection_API_documentation.sanitized.json + existing server adapter"]]);

const dictionaryPath = path.join(f360, "FACTORY_360_DATA_DICTIONARY.csv");
const dictionary = fs.readFileSync(dictionaryPath, "utf8");
if (!dictionary.includes("F360-XPC-DICT-001")) fs.appendFileSync(dictionaryPath, csv([
  ["F360-XPC-DICT-001","Cross-provider contract 014","N/A","Source and Version Metadata","Provider Family","string","Inspection API; Industry Shared","Source provenance is retained with every normalized value.","server projection source metadata","PARTIAL","Industry Shared remains unverified."],
  ["F360-XPC-DICT-002","Cross-provider contract 014","N/A","Source and Version Metadata","External Identifier","string","Inspection API; Industry Shared","Never replace canonical IDs; retain provider identifier with source.","typed adapter externalId","PARTIAL","No identifier format is guessed for Industry Shared."],
  ["F360-XPC-DICT-003","Cross-provider contract 014","N/A","Source and Version Metadata","Source Timestamp","ISO-8601 or NOT_DOCUMENTED","Inspection API; Industry Shared","Provider timestamp never overwrites platform audit timestamp.","created_at/updated_at source fields","PARTIAL","Field-level mapping ledger defines disposition."],
  ["F360-XPC-DICT-004","Cross-provider contract 014","N/A","Source and Version Metadata","Discrepancy State","enum","Inspection Platform","Master and observed/context values remain separate on conflict.","canonical reconciliation record","IMPLEMENTED","No silent overwrite."],
  ["F360-XPC-DICT-005","Cross-provider contract 014","N/A","Workforce","Workforce Snapshot","restricted aggregate","Industry Shared","Workforce domains stay separate pending privacy/retention/RLS proof.","CONDITIONAL_SOURCE_LABELLED_WORKFORCE_SNAPSHOT","BLOCKED_EXTERNAL","No person-level persistence."],
  ["F360-XPC-DICT-006","Cross-provider contract 014","N/A","Contacts","Contact Snapshot","restricted","Industry Shared","Permission-filtered only; no broad representative mapping.","CONDITIONAL_RESTRICTED_CONTACT_HISTORY","BLOCKED_EXTERNAL","Contract not supplied."],
  ["F360-XPC-DICT-007","Cross-provider contract 014","N/A","Delegations","Delegation Snapshot","restricted","Industry Shared","Separate from operational contacts.","CONDITIONAL_RESTRICTED_DELEGATION_HISTORY","BLOCKED_EXTERNAL","Contract not supplied."],
  ["F360-XPC-DICT-008","Cross-provider contract 014","N/A","Submission","External Submission Envelope","multipart/form-data","Inspection API","Payload builder is server-only and forwarding requires governed trigger.","GovernedInspectionSubmission","PARTIAL","BLOCKED_TRIGGER_DECISION."]
]));

if (process.argv.includes("--check")) {
  const required = ["FACTORY_360_INSPECTION_API_CONSUMPTION_LEDGER.csv","FACTORY_360_API_FIELD_MAPPING_LEDGER.csv","FACTORY_360_SOURCE_PRECEDENCE_MATRIX.csv","FACTORY_360_WEB_IPAD_CONSUMPTION_MATRIX.csv","FACTORY_360_ERROR_AND_UNAVAILABLE_CONTRACT.csv","FACTORY_360_OFFLINE_VERSION_CONTRACT.csv","FACTORY_360_EXTERNAL_SUBMISSION_CONTRACT.csv"];
  for (const file of required) if (!fs.existsSync(path.join(f360, file))) throw new Error(`missing ${file}`);
  if (mapping.length - 1 !== fields.length) throw new Error("field mapping inventory is incomplete");
  console.log(`Factory 360 cross-provider contract ledgers: ${fields.length} Inspection API fields mapped.`);
}
