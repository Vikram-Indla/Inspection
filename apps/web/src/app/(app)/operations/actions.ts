"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { decideActiveCancellation as decideActiveCancellationRpc } from "@/lib/execution";

export type OpsResult = { error?: string; ok?: boolean };

// SB12 · M08 — Operations Center write leg: acknowledge / close a corrective action.
// RLS policy `actions_rw` (0002_rbac_audit.sql) governs: USING admits ops/reviewer/auditor
// or the assigned inspector; WITH CHECK is the authority on the written row. We never
// bypass — any RLS rejection is mapped to stable recovery copy below.
export async function updateActionFormStatus(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const action_form_id = String(formData.get("action_form_id") ?? "");
  const next_status = String(formData.get("next_status") ?? "");
  if (!action_form_id) return { error: "Missing action form id." };
  if (!["acknowledged", "closed"].includes(next_status)) return { error: "Invalid status transition." };

  const { data, error } = await sb
    .from("action_forms")
    .update({ status: next_status })
    .eq("id", action_form_id)
    .neq("status", "closed") // closed is terminal; never reopen from here (M09-027 blocking stays authoritative)
    .select("id");
  if (error) { console.error("[operations action status]", error); return { error: "The corrective action could not be updated. Nothing was changed. Try again." }; }
  if (!data || data.length === 0) return { error: "No row updated — outside your RLS scope (actions_rw) or already closed." };

  revalidatePath("/operations");
  return { ok: true };
}

// M08-003 request-time monitoring shape. The Operations page supplies one
// RLS-scoped snapshot; no refresh cadence is configured or claimed.
export type MonitorRow = {
  id: string;
  factory_id: string | null;
  factory_name: string | null;
  operational_state: string;
  geofence: string | null;
  inspector: string | null;
};

// ENG-11 — mark a notification handled. SELECT remains recipient/ops scoped by
// `notif_own` (0002); UPDATE is independently recipient/ops scoped by
// `notif_update_recipient` (0015). The database remains the authority.
export async function markNotificationHandled(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const notification_id = String(formData.get("notification_id") ?? "");
  if (!notification_id) return { error: "Missing notification id." };

  const { data, error } = await sb
    .from("notifications")
    .update({ delivery_state: "handled" })
    .eq("id", notification_id)
    .neq("delivery_state", "handled")
    .select("id");
  if (error) { console.error("[operations notification status]", error); return { error: "The notification could not be marked handled. Try again." }; }
  if (!data || data.length === 0) return { error: "No row updated — outside your notification scope or already handled." };

  revalidatePath("/operations");
  return { ok: true };
}

// TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003 — only the database RPC may
// decide an outside-fence request. It performs RBAC-008, requester/approver
// separation, evidence, expiry, immutable geo-event and STM-JRN-003 checks in
// one transaction; this action never updates visits or requests directly.
export async function decideGeoOverride(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const requestId = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("decision_reason") ?? "").trim();
  if (!requestId || !["approved", "rejected"].includes(decision)) return { error: "Invalid override decision." };
  if (decision === "rejected" && !reason) return { error: "A rejection reason is mandatory." };

  const { data, error } = await sb.rpc("decide_geo_override", {
    p_request: requestId,
    p_decision: decision,
    p_decision_reason: reason || null,
  });
  if (error) {
    // Keep detailed RLS/RPC diagnostics server-side. The database has already
    // refused the write, so the UI must not claim a decision occurred.
    console.error("[operations decideGeoOverride]", error);
    return { error: "The override could not be decided. It may be expired, outside your Operations scope, or no longer pending." };
  }
  const decided = (Array.isArray(data) ? data[0] : data) as { status?: string } | null;
  if (decided?.status === "expired") {
    return { error: "No decision was saved — the override expired before Operations could act." };
  }
  // The Operations page composes several large live ledgers. Revalidating it
  // synchronously inside the action can leave the client transition displaying
  // "Saving decision…" even after the atomic RPC committed. The client owns a
  // short post-acknowledgement refresh; field pages are dynamic and read the
  // approved state on their next refresh/navigation.
  return { ok: true };
}

// TASK-EXECUTION-MODULE-001 · Phase 4B — active-session cancellation decision
// queue (plan §12). Only the database RPC may decide: it enforces
// operations.approve_active_cancel, requester/decider separation, mandatory
// rejection reason and idempotent replay in one transaction. Approval is
// terminal — the visit is cancelled and every captured response/evidence/geo
// row is PRESERVED; this action never updates visits or requests directly.
export async function decideActiveCancellation(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const requestId = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("decision_reason") ?? "").trim();
  if (!requestId || !["approve", "reject"].includes(decision)) return { error: "Invalid cancellation decision." };
  if (decision === "reject" && !reason) return { error: "A rejection reason is mandatory." };

  const r = await decideActiveCancellationRpc(sb, {
    requestId,
    decision: decision as "approve" | "reject",
    reason: reason || null,
  });
  if (r.error) {
    // Self-decide and already-decided tokens map to neutral copy; detailed
    // diagnostics stay server-side (the database already refused the write).
    if (r.error === "CANCEL_SELF_DECIDE") return { error: "You cannot decide your own cancellation request." };
    if (r.error === "CANCEL_ALREADY_DECIDED") return { error: "This request was already decided — the queue will refresh." };
    if (r.error === "CANCEL_REJECTION_REASON_REQUIRED") return { error: "A rejection reason is mandatory." };
    return { error: "The cancellation could not be decided. It may be outside your Operations scope or no longer pending." };
  }
  return { ok: true };
}
