import { supabaseServer } from "@/lib/supabase-server";
import {
  SENAEI_CONTRACT_ENDPOINTS,
  SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS,
} from "@/lib/integrations/senaei/contract";
import type { CallRow, ConnectionRow, ReconciliationRow, RunRow, SenaiDataView } from "./types";

export async function loadSenaiData(): Promise<SenaiDataView> {
  const sb = await supabaseServer();
  const [connectionsRead, runsRead, callsRead, reconciliationRead] = await Promise.all([
    sb.from("external_source_connections")
      .select("id,provider_key,environment,contract_version,base_url_origin,auth_mode,configuration_status,enabled,last_validated_at")
      .order("provider_key"),
    sb.from("senaei_sync_runs")
      .select("id,connection_id,mode,status,correlation_id,contract_version,rows_received,rows_accepted,rows_rejected,started_at,completed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("senaei_sync_calls")
      .select("id,endpoint_key,http_method,outcome,http_status,safe_error_code,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(200),
    sb.from("senaei_reconciliation_records")
      .select("id,entity_type,external_id,outcome,safe_reason_codes,reconciled_at")
      .in("outcome", ["conflict", "rejected", "dependency_blocked"])
      .order("reconciled_at", { ascending: false })
      .limit(30),
  ]);

  const connections = (connectionsRead.data ?? []) as ConnectionRow[];
  const runs = (runsRead.data ?? []) as RunRow[];
  const calls = (callsRead.data ?? []) as CallRow[];
  const divergences = (reconciliationRead.data ?? []) as ReconciliationRow[];

  const latestCall = new Map<string, CallRow>();
  for (const call of calls) if (!latestCall.has(call.endpoint_key)) latestCall.set(call.endpoint_key, call);

  const callsByConnection = new Map<string, number>();
  const latestRunByConnection = new Map<string, RunRow>();
  for (const run of runs) {
    if (!run.connection_id) continue;
    callsByConnection.set(run.connection_id, (callsByConnection.get(run.connection_id) ?? 0) + 1);
    if (!latestRunByConnection.has(run.connection_id)) latestRunByConnection.set(run.connection_id, run);
  }

  const sum = (pick: (run: RunRow) => number | null) =>
    runs.reduce((total, run) => total + (pick(run) ?? 0), 0);

  return {
    connections: connections.map(row => ({
      row,
      latestRun: latestRunByConnection.get(row.id) ?? null,
      callCount: callsByConnection.get(row.id) ?? 0,
    })),
    endpoints: SENAEI_CONTRACT_ENDPOINTS.map(endpoint => ({
      endpoint,
      call: latestCall.get(endpoint.key) ?? null,
    })),
    divergences,
    verifiedEndpoints: SENAEI_CONTRACT_ENDPOINTS.filter(endpoint => latestCall.has(endpoint.key)).length,
    totalEndpoints: SENAEI_CONTRACT_ENDPOINTS.length,
    writeBackEndpoints: SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS.length,
    latestRun: runs[0] ?? null,
    reconciledRows: sum(run => run.rows_accepted),
    receivedRows: sum(run => run.rows_received),
    rejectedRows: sum(run => run.rows_rejected),
    partialConnections: connections.filter(row => row.configuration_status !== "validated").length,
    totalConnections: connections.length,
    connectionsFailed: Boolean(connectionsRead.error),
    runsFailed: Boolean(runsRead.error),
    callsFailed: Boolean(callsRead.error),
    reconciliationFailed: Boolean(reconciliationRead.error),
  };
}
