"use server";
// DEC-L — calls issue_bulk_violation (20260719030000), the only writer for
// bulk-issued violations. All authoritative validation, the role guard, the
// idempotency replay and the per-target result shape live in that one RPC
// (same division of responsibility as planning/immediate/actions.ts and
// create_immediate_visit): this action only normalizes form input.
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type BulkItemResult = { factory_id: string; status: "success" | "failed"; violation_id: string | null; inspection_id: string | null; error_code: string | null };
export type BulkResult = { error?: string; batchId?: string; successCount?: number; total?: number; results?: BulkItemResult[]; replayed?: boolean };

export async function issueBulkViolation(_: BulkResult, formData: FormData): Promise<BulkResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "auth_required" };

  const requestId = String(formData.get("request_id") ?? "");
  const violationCode = String(formData.get("violation_code") ?? "").trim();
  const factoryIds = formData.getAll("factory_id").map(String).filter(Boolean);
  const notes = String(formData.get("notes") ?? "").trim();
  const acknowledged = formData.get("acknowledged") === "on";

  if (!requestId) return { error: "invalid_request" };
  if (!violationCode) return { error: "violation_required" };
  if (!factoryIds.length) return { error: "establishments_required" };
  if (!acknowledged) return { error: "acknowledgement_required" };

  const { data, error } = await sb.rpc("issue_bulk_violation", {
    p_request_id: requestId,
    p_factory_ids: factoryIds,
    p_violation_code: violationCode,
    p_notes: notes || null,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[DEC-L issue_bulk_violation]", error.message);
    return { error: error.message };
  }

  const result = (data ?? {}) as { batch_id?: string; success_count?: number; total?: number; results?: BulkItemResult[]; replayed?: boolean };
  return {
    batchId: result.batch_id,
    successCount: result.success_count,
    total: result.total,
    results: result.results ?? [],
    replayed: result.replayed,
  };
}
