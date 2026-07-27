"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// DEC-032 is a platform-wide P0: submission_versions cannot produce its
// required digest, so no route may claim or attempt a real inspection
// submission. Keep the server action fail-closed as a second boundary even
// though the client submit control is disabled.

export type BulkItemResult = { factory_id: string; status: "success" | "failed"; violation_id: string | null; inspection_id: string | null; error_code: string | null };
export type BulkResult = {
  error?:
    | "dec032_blocked"
    | "auth_required"
    | "invalid_request"
    | "acknowledgement_required"
    | "idempotency_conflict"
    | "not_authorized"
    | "governed_violation_required"
    | "penalty_mapping_required"
    | "package_version_invalid"
    | "write_failed";
  batchId?: string;
  successCount?: number;
  total?: number;
  results?: BulkItemResult[];
  replayed?: boolean;
};

export async function issueBulkViolation(_: BulkResult, _formData: FormData): Promise<BulkResult> {
  if (process.env.ENFORCEMENT_P0_RPCS_DEPLOYED !== "true") {
    return { error: "dec032_blocked" };
  }
  const requestId = String(_formData.get("request_id") ?? "");
  const factoryIds = _formData.getAll("factory_id").map(String).filter(Boolean);
  const violationCode = String(_formData.get("violation_code") ?? "").trim();
  const packageVersionId = String(_formData.get("package_version_id") ?? "");
  const notes = String(_formData.get("notes") ?? "").trim();
  const acknowledged = _formData.get("acknowledged") === "on";
  if (!requestId || !factoryIds.length || !violationCode || !packageVersionId) {
    return { error: "invalid_request" };
  }
  if (!acknowledged) return { error: "acknowledgement_required" };

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" };
  const { data, error } = await sb.rpc("issue_bulk_violation", {
    p_request_id: requestId,
    p_factory_ids: factoryIds,
    p_violation_code: violationCode,
    p_package_version_id: packageVersionId,
    p_notes: notes || null,
    p_acknowledged: true,
    p_correlation_id: null,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("BULK_VIOLATION_NOT_AUTHORIZED")) return { error: "not_authorized" };
    if (message.includes("BULK_ACKNOWLEDGEMENT_REQUIRED")) return { error: "acknowledgement_required" };
    if (message.includes("BULK_IDEMPOTENCY_CONFLICT")) return { error: "idempotency_conflict" };
    if (message.includes("BULK_VIOLATION_NOT_GOVERNED")) return { error: "governed_violation_required" };
    if (message.includes("BULK_PENALTY_MAPPING_REQUIRED")) return { error: "penalty_mapping_required" };
    if (
      message.includes("BULK_PACKAGE_VERSION_NOT_PUBLISHED_ACTIVE_LOCKED")
      || message.includes("BULK_PACKAGE_VERSION_INVALID")
    ) return { error: "package_version_invalid" };
    return { error: "write_failed" };
  }
  const receipt = data as Record<string, unknown> | null;
  const results = receipt?.results;
  const typedResults = Array.isArray(results) ? results : [];
  const resultShapeInvalid = typedResults.some((item) => {
    if (!item || typeof item !== "object") return true;
    const row = item as Record<string, unknown>;
    const status = String(row.status);
    if (typeof row.factory_id !== "string" || !["success", "failed"].includes(status)) return true;
    if (status === "success") {
      return typeof row.violation_id !== "string"
        || typeof row.inspection_id !== "string"
        || row.error_code !== null;
    }
    return row.violation_id !== null
      || row.inspection_id !== null
      || typeof row.error_code !== "string";
  });
  if (
    !receipt
    || receipt.status !== "ok"
    || typeof receipt.batch_id !== "string"
    || typeof receipt.replayed !== "boolean"
    || typeof receipt.success_count !== "number"
    || typeof receipt.total !== "number"
    || typeof receipt.correlation_id !== "string"
    || !Array.isArray(results)
    || resultShapeInvalid
    || receipt.total !== typedResults.length
    || receipt.success_count !== typedResults.filter((row) =>
      Boolean(row && typeof row === "object" && (row as Record<string, unknown>).status === "success")
    ).length
  ) return { error: "write_failed" };

  revalidatePath("/admin/bulk-violations");
  revalidatePath("/enforcement");
  return {
    batchId: receipt.batch_id,
    replayed: receipt.replayed,
    successCount: receipt.success_count,
    total: receipt.total,
    results: results as BulkItemResult[],
  };
}
