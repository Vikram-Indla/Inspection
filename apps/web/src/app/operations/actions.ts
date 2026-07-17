"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

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

// M08-003 auto-refresh — re-fetch ONLY the live monitoring rows. Called on an
// interval from Monitoring.tsx so the table stays live without reloading the
// whole route. Reads run under the caller's session: RLS on visits/geo_events
// (0001, 0008) is the authority on what each role can monitor.
export type MonitorRow = {
  id: string;
  factory_id: string | null;
  factory_name: string | null;
  operational_state: string;
  geofence: string | null;
  inspector: string | null;
};
export type MonitorFetch = { error?: string; rows?: MonitorRow[]; at?: string };

type MonitorVisitRow = {
  id: string;
  planning_status: string;
  operational_state: string;
  factory_id: string | null;
  factories: { id: string; name: string; region: string | null; city: string | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

export async function fetchMonitoringRows(region: string, city: string): Promise<MonitorFetch> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const { data, error } = await sb
    .from("visits")
    .select("id, planning_status, operational_state, factory_id, factories(id, name, region, city), assignments(profiles(full_name))")
    .order("window_start", { ascending: true });
  if (error) { console.error("[operations monitoring visits]", error); return { error: "Live monitoring is temporarily unavailable. Try again." }; }

  const visits = ((data ?? []) as unknown as MonitorVisitRow[]).filter(v =>
    // Planning status and operational state are separate domains: a visit
    // remains monitorable after its planning window expires once execution
    // has begun. Keep the refresh leg aligned with the page's initial read.
    (v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)) &&
    (!region || v.factories?.region === region) && (!city || v.factories?.city === city));

  // Latest geofence verdict per visit (append-only geo_events, newest first).
  const ids = visits.map(v => v.id);
  let latest = new Map<string, string>();
  if (ids.length > 0) {
    const { data: geo, error: gErr } = await sb
      .from("geo_events")
      .select("visit_id, geofence_result, occurred_at")
      .in("visit_id", ids)
      .not("geofence_result", "is", null)
      .order("occurred_at", { ascending: false })
      .limit(300);
    if (gErr) { console.error("[operations monitoring geofence]", gErr); return { error: "Live geofence data is temporarily unavailable. Try again." }; }
    latest = new Map();
    for (const g of (geo ?? []) as { visit_id: string; geofence_result: string | null }[]) {
      if (g.geofence_result && !latest.has(g.visit_id)) latest.set(g.visit_id, g.geofence_result);
    }
  }

  return {
    at: new Date().toISOString(),
    rows: visits.map(v => ({
      id: v.id,
      factory_id: v.factories?.id ?? v.factory_id,
      factory_name: v.factories?.name ?? null,
      operational_state: v.operational_state,
      geofence: latest.get(v.id) ?? null,
      inspector: v.assignments?.[0]?.profiles?.full_name ?? null,
    })),
  };
}

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
  revalidatePath("/operations");
  revalidatePath("/field");
  return { ok: true };
}
