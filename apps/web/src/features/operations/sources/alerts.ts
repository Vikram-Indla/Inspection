import type { PostgrestPage } from "@/lib/supabase-pagination";
import type { OperationsClient } from "./client-type";
import type { EngineRow, EvidenceRow, NotifRow, OverrideRow } from "../types";

const NOTIFICATION_LIMIT = 20;
const CONFIGURED_ENGINES = ["gis", "sla", "field"] as const;

export function loadNotifications(sb: OperationsClient) {
  return sb.from("notifications")
    .select("id, event_key, channel, delivery_state, created_at")
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT) as unknown as PromiseLike<PostgrestPage<NotifRow>>;
}

export function loadEngineSettings(sb: OperationsClient) {
  return sb.from("engine_settings")
    .select("engine, settings")
    .in("engine", [...CONFIGURED_ENGINES]) as unknown as PromiseLike<PostgrestPage<EngineRow>>;
}

export function loadPendingOverrides(sb: OperationsClient, nowIso: string) {
  return sb.from("geo_override_requests")
    .select("id, visit_id, status, reason_label, explanation, safety_security_exception, observed_lat, observed_lng, accuracy_m, distance_m, device_occurred_at, requested_at, expires_at, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: true }) as unknown as PromiseLike<PostgrestPage<OverrideRow>>;
}

export function loadOverrideEvidence(sb: OperationsClient) {
  return sb.from("evidence")
    .select("linked_id, storage_path")
    .eq("linked_type", "geo_override")
    .eq("evidence_type", "photo") as unknown as PromiseLike<PostgrestPage<EvidenceRow>>;
}
