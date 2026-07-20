"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logFactoryError, mapFactoryError } from "@/app/(app)/factories/[id]/neutral";

export type FactoryDataResult = {
  ok?: boolean;
  error?: string;
  batchId?: string;
  pendingReconciliation?: number;
  rejected?: number;
};

const ADMIN_ROLES = ["security_admin", "workflow_admin", "compliance_admin"];
const CSV_SCHEMA_VERSION = "factory360-v2-staging-1";
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const REQUIRED_HEADERS = ["cr_number", "license_number", "plant_number"];
const ALLOWED_HEADERS = new Set([
  ...REQUIRED_HEADERS,
  "unified_number", "legal_name", "legal_name_en", "legal_name_ar",
  "cr_status", "license_status", "license_type", "license_stage",
  "license_issue_date", "license_expiry_date", "holder_name",
  "investment_type", "investment_size", "address_line_1", "district_en",
  "district_ar", "street_name_en", "street_name_ar", "city_en", "city_ar",
  "region_en", "region_ar", "latitude", "longitude",
]);

async function requireFactoryDataAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" as const };
  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  if (error) return { error: "role_check_unavailable" as const };
  if (!(data ?? []).some(row => ADMIN_ROLES.includes(row.role_key))) return { error: "admin_role_required" as const };
  return { sb, user };
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } | { error: string } {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some(value => value.trim())) records.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) return { error: "CSV_UNCLOSED_QUOTE" };
  row.push(field);
  if (row.some(value => value.trim())) records.push(row);
  if (records.length < 2) return { error: "CSV_HAS_NO_DATA_ROWS" };
  const headers = records[0].map((value, index) => value.replace(index === 0 ? /^\uFEFF/ : /$^/, "").trim());
  if (new Set(headers).size !== headers.length) return { error: "CSV_DUPLICATE_HEADER" };
  if (headers.some(header => !ALLOWED_HEADERS.has(header))) return { error: "CSV_UNKNOWN_HEADER" };
  if (REQUIRED_HEADERS.some(header => !headers.includes(header))) return { error: "CSV_REQUIRED_HEADER_MISSING" };
  if (records.length - 1 > MAX_ROWS) return { error: "CSV_ROW_LIMIT_EXCEEDED" };
  return { headers, rows: records.slice(1) };
}

export async function stageFactoryCsv(_: FactoryDataResult, formData: FormData): Promise<FactoryDataResult> {
  const gate = await requireFactoryDataAdmin();
  if ("error" in gate) return { error: gate.error };
  const file = formData.get("csv_file");
  const schemaVersion = String(formData.get("schema_version") ?? "");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) return { error: "CSV_FILE_REQUIRED" };
  if (schemaVersion !== CSV_SCHEMA_VERSION) return { error: "CSV_SCHEMA_VERSION_UNSUPPORTED" };
  if (!file.size || file.size > MAX_FILE_BYTES) return { error: "CSV_FILE_SIZE_INVALID" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const parsed = parseCsv(bytes.toString("utf8"));
  if ("error" in parsed) return { error: parsed.error };
  const fileSha256 = createHash("sha256").update(bytes).digest("hex");
  const normalized = parsed.rows.map((values, index) => {
    const raw_values = Object.fromEntries(parsed.headers.map((header, column) => [header, (values[column] ?? "").trim()]));
    const errors: string[] = [];
    if (values.length !== parsed.headers.length) errors.push("CSV_COLUMN_COUNT_MISMATCH");
    for (const header of REQUIRED_HEADERS) if (!raw_values[header]) errors.push(`CSV_${header.toUpperCase()}_MISSING`);
    return { row_number: index + 2, raw_values, status: errors.length ? "rejected" : "pending", safe_error_codes: errors };
  });
  const rejected = normalized.filter(row => row.status === "rejected").length;

  const { data: run, error: runError } = await gate.sb.from("senaei_sync_runs").insert({
    mode: "csv_import", status: "queued", contract_version: schemaVersion,
    source_file_name: file.name, source_file_sha256: fileSha256,
    rows_received: normalized.length, rows_accepted: 0, rows_rejected: rejected,
    requested_by: gate.user.id,
  }).select("id").single();
  if (runError || !run) return { error: "CSV_STAGE_RUN_FAILED" };

  const { data: batch, error: batchError } = await gate.sb.from("factory_import_batches").insert({
    sync_run_id: run.id, file_name: file.name, file_sha256: fileSha256,
    schema_version: schemaVersion, status: rejected === normalized.length ? "rejected" : "validated",
    uploaded_by: gate.user.id,
  }).select("id").single();
  if (batchError || !batch) {
    await gate.sb.from("senaei_sync_runs").update({ status: "failed" }).eq("id", run.id);
    return { error: batchError?.code === "23505" ? "CSV_BATCH_ALREADY_STAGED" : "CSV_STAGE_BATCH_FAILED" };
  }

  const { error: rowsError } = await gate.sb.from("factory_import_rows").insert(
    normalized.map(row => ({ ...row, batch_id: batch.id })),
  );
  if (rowsError) {
    await Promise.all([
      gate.sb.from("factory_import_batches").update({ status: "failed" }).eq("id", batch.id),
      gate.sb.from("senaei_sync_runs").update({ status: "failed" }).eq("id", run.id),
    ]);
    return { error: "CSV_STAGE_ROWS_FAILED" };
  }
  revalidatePath("/admin/integrations/factory-data");
  return { ok: true, batchId: batch.id, pendingReconciliation: normalized.length - rejected, rejected };
}

export async function mutateFactoryMasterData(_: FactoryDataResult, formData: FormData): Promise<FactoryDataResult> {
  const gate = await requireFactoryDataAdmin();
  if ("error" in gate) return { error: gate.error };
  const factoryId = String(formData.get("factory_id") ?? "");
  const operation = String(formData.get("operation") ?? "");
  if (!factoryId) return { error: "factory_required" };
  let error: { message?: string } | null = null;

  if (operation === "document") {
    const title = String(formData.get("title") ?? "").trim();
    const docType = String(formData.get("doc_type") ?? "");
    const referenceNo = String(formData.get("reference_no") ?? "").trim();
    const validFrom = String(formData.get("valid_from") ?? "").trim();
    const validTo = String(formData.get("valid_to") ?? "").trim();
    if (!title || !["license", "cr", "safety_cert", "layout", "other"].includes(docType)) return { error: "invalid_document" };
    if (validFrom && validTo && validTo < validFrom) return { error: "Valid-to must be on or after valid-from." };
    ({ error } = await gate.sb.from("factory_documents").insert({ factory_id: factoryId, doc_type: docType, title, reference_no: referenceNo || null, valid_from: validFrom || null, valid_to: validTo || null, storage_path: null, uploaded_by: gate.user.id, source_system: "inspection_platform" }));
  } else if (operation === "representative") {
    const fullName = String(formData.get("full_name") ?? "").trim();
    if (!fullName) return { error: "representative_name_required" };
    ({ error } = await gate.sb.from("factory_representatives").insert({ factory_id: factoryId, full_name: fullName, role_title: String(formData.get("role_title") ?? "").trim() || null, phone: String(formData.get("phone") ?? "").trim() || null, email: String(formData.get("email") ?? "").trim() || null, is_primary: formData.get("is_primary") === "on" }));
  } else if (operation === "product") {
    const name = String(formData.get("name") ?? "").trim();
    const capacityRaw = String(formData.get("annual_capacity") ?? "").trim();
    if (!name) return { error: "product_name_required" };
    let annualCapacity: number | null = null;
    if (capacityRaw) {
      annualCapacity = Number(capacityRaw);
      if (!Number.isFinite(annualCapacity) || annualCapacity < 0) return { error: "Annual capacity must be a non-negative number." };
    }
    ({ error } = await gate.sb.from("factory_products").insert({ factory_id: factoryId, name, hs_code: String(formData.get("hs_code") ?? "").trim() || null, unit: String(formData.get("unit") ?? "").trim() || null, annual_capacity: annualCapacity, is_primary: formData.get("is_primary") === "on", created_by: gate.user.id }));
  } else if (operation === "material") {
    const name = String(formData.get("name") ?? "").trim();
    const source = String(formData.get("source") ?? "");
    if (!name || !["local", "imported"].includes(source)) return { error: "invalid_material" };
    ({ error } = await gate.sb.from("factory_materials").insert({ factory_id: factoryId, name, source, hs_code: String(formData.get("hs_code") ?? "").trim() || null, created_by: gate.user.id }));
  } else if (operation === "representative_status") {
    const representativeId = String(formData.get("representative_id") ?? "");
    const { data, error: updateError } = await gate.sb.from("factory_representatives").update({ active: formData.get("active") === "true" }).eq("id", representativeId).eq("factory_id", factoryId).select("id").maybeSingle();
    if (!data && !updateError) return { error: "representative_not_found" };
    error = updateError;
  } else return { error: "operation_not_allowed" };

  if (error) {
    logFactoryError(`admin-${operation}`, error);
    return { error: mapFactoryError(error, "update") };
  }
  revalidatePath("/admin/integrations/factory-data");
  revalidatePath(`/factories/${factoryId}`);
  return { ok: true };
}
