"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type OpsResult = { error?: string; ok?: boolean };

// SB12 · M08 — Operations Center write leg: acknowledge / close a corrective action.
// RLS policy `actions_rw` (0002_rbac_audit.sql) governs: USING admits ops/reviewer/auditor
// or the assigned inspector; WITH CHECK is the authority on the written row. We never
// bypass — any RLS rejection is surfaced verbatim below.
export async function updateActionFormStatus(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
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
  if (error) return { error: error.message };
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
  operational_state: string;
  factory_id: string | null;
  factories: { id: string; name: string; region: string | null; city: string | null } | null;
  assignments: { profiles: { full_name: string } | null }[] | null;
};

export async function fetchMonitoringRows(region: string, city: string): Promise<MonitorFetch> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const { data, error } = await sb
    .from("visits")
    .select("id, operational_state, factory_id, factories(id, name, region, city), assignments(profiles(full_name))")
    .eq("planning_status", "published")
    .order("window_start", { ascending: true });
  if (error) return { error: `visits: ${error.message}` };

  const visits = ((data ?? []) as unknown as MonitorVisitRow[]).filter(v =>
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
    if (gErr) return { error: `geo_events: ${gErr.message}` };
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

// ENG-11 — mark a notification handled. The schema has a state column (delivery_state,
// 0001_foundation.sql), so the write leg exists; RLS policy `notif_own` is SELECT-only,
// so unless an UPDATE policy is added the database will report zero rows — we surface
// that honestly instead of pretending success.
export async function markNotificationHandled(_: OpsResult, formData: FormData): Promise<OpsResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const notification_id = String(formData.get("notification_id") ?? "");
  if (!notification_id) return { error: "Missing notification id." };

  const { data, error } = await sb
    .from("notifications")
    .update({ delivery_state: "handled" })
    .eq("id", notification_id)
    .neq("delivery_state", "handled")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "No row updated — notifications UPDATE is not granted by RLS (notif_own is select-only)." };

  revalidatePath("/operations");
  return { ok: true };
}
