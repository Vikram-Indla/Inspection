import { readRows, type ReadResult } from "@/lib/postgrest/read";
import type { OperationsClient } from "./client-type";
import type { EngineRow, EvidenceRow, NotifRow, OverrideRow } from "../types";
import { engineRow, evidenceRow, notifRow, overrideRow } from "./shapes";

const NOTIFICATION_LIMIT = 20;
const CONFIGURED_ENGINES = ["gis", "sla", "field"] as const;

export async function loadNotifications(sb: OperationsClient): Promise<ReadResult<NotifRow>> {
  const response = await sb.from("notifications")
    .select("id, event_key, channel, delivery_state, created_at")
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);
  return readRows(response, notifRow, "operations.notifications");
}

export async function loadEngineSettings(sb: OperationsClient): Promise<ReadResult<EngineRow>> {
  const response = await sb.from("engine_settings")
    .select("engine, settings")
    .in("engine", [...CONFIGURED_ENGINES]);
  return readRows(response, engineRow, "operations.engine_settings");
}

export async function loadPendingOverrides(sb: OperationsClient, nowIso: string): Promise<ReadResult<OverrideRow>> {
  const response = await sb.from("geo_override_requests")
    .select("id, visit_id, status, reason_label, explanation, safety_security_exception, observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at, requested_at, expires_at, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: true });
  return readRows(response, overrideRow, "operations.geo_override_requests");
}

export async function loadOverrideEvidence(sb: OperationsClient): Promise<ReadResult<EvidenceRow>> {
  const response = await sb.from("evidence")
    .select("linked_id, storage_path")
    .eq("linked_type", "geo_override")
    .eq("evidence_type", "photo");
  return readRows(response, evidenceRow, "operations.override_evidence");
}
