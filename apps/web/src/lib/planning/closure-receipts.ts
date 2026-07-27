import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanningClosureError =
  | "cutoff_blocked"
  | "conflict"
  | "state_blocked"
  | "unauthorized"
  | "unavailable"
  | "invalid_request"
  | "receipt_invalid"
  | "service_error";

export type PlanningOutboxState = "intent_queued";

export type PlanningMutationRowReceipt = {
  visitId: string;
  preVersion: number;
  postVersion: number;
  serverTransactionTime: string;
  priorWindowStart: string | null;
  priorWindowEnd: string | null;
  requestedWindowStart: string | null;
  requestedWindowEnd: string | null;
  cutoffAt: string;
  cutoffAllowed: true;
  auditEventId: number;
  outboxIntentId: string;
  outboxState: PlanningOutboxState;
};

export type PlanningMutationReceipt = {
  commandId: string;
  operation: "cancel" | "reschedule";
  correlationId: string;
  visitIds: string[];
  updatedCount: number;
  rows: PlanningMutationRowReceipt[];
  idempotent: boolean;
};

export type PlanningArchiveReceipt = {
  commandId: string;
  operation: "archive_draft";
  planId: string;
  childCount: number;
  planningStatusPreserved: true;
  outboxIntentIds: string[];
  outboxState: PlanningOutboxState;
  correlationId: string;
  idempotent: boolean;
};

export type PlanningBulkReceipt = {
  commandId: string;
  status: "running" | "partial_failed" | "completed";
  targetCount: number;
  pendingCount: number;
  appliedCount: number;
  blockedCount: number;
  failedCount: number;
  inventoryHash: string;
};

export type PlanningBulkCommandStart = {
  commandId: string;
  targetCount: number | null;
  inventoryHash: string | null;
  idempotent: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const record = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
const text = (value: unknown): string | null => typeof value === "string" ? value : null;
const integer = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;
const textArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every(item => typeof item === "string") ? value : null;

export function classifyPlanningClosureError(error: { message?: string; code?: string } | null): PlanningClosureError {
  const message = error?.message ?? "";
  if (/PLANNING-CLOSURE-720H/.test(message)) return "cutoff_blocked";
  if (/PLANNING-CLOSURE-(STALE|IDEMPOTENCY-CONFLICT)/.test(message)) return "conflict";
  if (/PLANNING-(CLOSURE-STATE|ARCHIVE-(STATE|CHILD-STATE))/.test(message)) return "state_blocked";
  if (/PLANNING-(CLOSURE|ARCHIVE|BULK)-DENIED/.test(message) || error?.code === "42501") return "unauthorized";
  if (/PLANNING-(CLOSURE|BULK)-(TARGET|COMMAND)-NOT-FOUND/.test(message)) return "unavailable";
  if (/PLANNING-(CLOSURE|ARCHIVE|BULK|RESCHEDULE)-/.test(message) || error?.code === "22023") return "invalid_request";
  return "service_error";
}

export function parsePlanningMutationReceipt(value: unknown): PlanningMutationReceipt | null {
  const root = record(value);
  if (!root) return null;
  const commandId = text(root.command_id);
  const operation = text(root.operation);
  const correlationId = text(root.correlation_id);
  const visitIds = textArray(root.visit_ids);
  const updatedCount = integer(root.updated_count);
  if (!commandId || !UUID.test(commandId) || !correlationId || !UUID.test(correlationId)
      || (operation !== "cancel" && operation !== "reschedule")
      || !visitIds || updatedCount == null || updatedCount !== visitIds.length
      || !Array.isArray(root.rows) || root.rows.length !== updatedCount) return null;
  const rows: PlanningMutationRowReceipt[] = [];
  for (const raw of root.rows) {
    const row = record(raw);
    if (!row) return null;
    const visitId = text(row.visit_id);
    const preVersion = integer(row.pre_version);
    const postVersion = integer(row.post_version);
    const serverTransactionTime = text(row.server_transaction_time);
    const cutoffAt = text(row.cutoff_at);
    const auditEventId = integer(row.audit_event_id);
    const outboxIntentId = text(row.outbox_intent_id);
    if (!visitId || !UUID.test(visitId) || preVersion == null || postVersion == null
        || !serverTransactionTime || !cutoffAt || auditEventId == null
        || !outboxIntentId || !UUID.test(outboxIntentId) || row.cutoff_allowed !== true) return null;
    rows.push({
      visitId, preVersion, postVersion, serverTransactionTime,
      priorWindowStart: text(row.prior_window_start),
      priorWindowEnd: text(row.prior_window_end),
      requestedWindowStart: text(row.requested_window_start),
      requestedWindowEnd: text(row.requested_window_end),
      cutoffAt, cutoffAllowed: true, auditEventId, outboxIntentId,
      outboxState: "intent_queued",
    });
  }
  return {
    commandId, operation, correlationId, visitIds, updatedCount, rows,
    idempotent: root.idempotent === true,
  };
}

export function parsePlanningArchiveReceipt(value: unknown): PlanningArchiveReceipt | null {
  const root = record(value);
  if (!root) return null;
  const commandId = text(root.command_id);
  const planId = text(root.plan_id);
  const correlationId = text(root.correlation_id);
  const childCount = integer(root.child_count);
  const outboxIntentIds = textArray(root.outbox_intent_ids);
  if (!commandId || !UUID.test(commandId) || !planId || !UUID.test(planId)
      || !correlationId || !UUID.test(correlationId) || childCount == null
      || !outboxIntentIds || !outboxIntentIds.every(id => UUID.test(id))
      || root.operation !== "archive_draft" || root.planning_status_preserved !== true) return null;
  return {
    commandId, operation: "archive_draft", planId, childCount,
    planningStatusPreserved: true, outboxIntentIds, outboxState: "intent_queued",
    correlationId, idempotent: root.idempotent === true,
  };
}

export function parsePlanningBulkReceipt(value: unknown): PlanningBulkReceipt | null {
  const root = record(value);
  if (!root) return null;
  const commandId = text(root.command_id);
  const status = text(root.status);
  const targetCount = integer(root.target_count);
  const pendingCount = integer(root.pending_count);
  const appliedCount = integer(root.applied_count);
  const blockedCount = integer(root.blocked_count);
  const failedCount = integer(root.failed_count);
  const inventoryHash = text(root.inventory_hash);
  if (!commandId || !UUID.test(commandId)
      || (status !== "running" && status !== "partial_failed" && status !== "completed")
      || targetCount == null || pendingCount == null || appliedCount == null
      || blockedCount == null || failedCount == null || !inventoryHash) return null;
  return { commandId, status, targetCount, pendingCount, appliedCount, blockedCount, failedCount, inventoryHash };
}

export function parsePlanningBulkCommandStart(value: unknown): PlanningBulkCommandStart | null {
  const root = record(value);
  if (!root) return null;
  const commandId = text(root.command_id);
  const targetCount = integer(root.target_count);
  const inventoryHash = text(root.inventory_hash);
  const idempotent = root.idempotent === true;
  if (!commandId || !UUID.test(commandId)) return null;
  if (!idempotent && (targetCount == null || !inventoryHash)) return null;
  return { commandId, targetCount, inventoryHash, idempotent };
}

export async function readPlanningVersions(
  sb: SupabaseClient,
  visitIds: string[],
): Promise<{ versions: Record<string, number> | null; error: PlanningClosureError | null }> {
  const { data, error } = await sb.from("visits").select("id, planning_version").in("id", visitIds);
  if (error) {
    console.error("[planning.closure] planning-version read failed:", error.message);
    return { versions: null, error: "service_error" };
  }
  if (!data || data.length !== visitIds.length) return { versions: null, error: "unavailable" };
  const versions: Record<string, number> = {};
  for (const row of data) {
    if (typeof row.planning_version !== "number" || !Number.isInteger(row.planning_version)) {
      return { versions: null, error: "receipt_invalid" };
    }
    versions[row.id] = row.planning_version;
  }
  return { versions, error: null };
}
