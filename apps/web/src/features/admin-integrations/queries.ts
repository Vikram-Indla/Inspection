import { supabaseServer } from "@/lib/supabase-server";
import type { ApiEventRow, EndpointRow, ExportJobRow, IntegrationsView } from "./types";

export async function loadIntegrations(): Promise<IntegrationsView> {
  const sb = await supabaseServer();
  const [endpointsRead, eventsRead, exportsRead] = await Promise.all([
    sb.from("mvp3_integration_endpoints")
      .select("id,endpoint_key,display_name,endpoint_kind,contract_version,status,updated_at")
      .order("display_name"),
    sb.from("mvp3_api_events")
      .select("id,event_kind,direction,outcome,correlation_id,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(20),
    sb.from("mvp3_export_jobs")
      .select("id,export_kind,purpose,status,artifact_hash,requested_at,completed_at")
      .order("requested_at", { ascending: false })
      .limit(20),
  ]);

  const endpoints = (endpointsRead.data ?? []) as EndpointRow[];
  const events = (eventsRead.data ?? []) as ApiEventRow[];
  const exports = (exportsRead.data ?? []) as ExportJobRow[];

  return {
    endpoints,
    events,
    exports,
    configuredCount: endpoints.filter(row => row.status === "configured").length,
    endpointsFailed: Boolean(endpointsRead.error),
    eventsFailed: Boolean(eventsRead.error),
    exportsFailed: Boolean(exportsRead.error),
  };
}
