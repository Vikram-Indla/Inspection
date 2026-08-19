import { supabaseServer } from "@/lib/supabase-server";
import type { ErrorQueueRow, FeatureFlagRow, OperationsView, StatusCount } from "./types";

const OPEN_ERROR_STATUSES = ["failed", "retry_requested", "dependency_blocked", "dead_letter"];

function countByStatus(rows: readonly ErrorQueueRow[]): StatusCount[] {
  const tally = new Map<string, number>();
  for (const row of rows) tally.set(row.status, (tally.get(row.status) ?? 0) + 1);
  return [...tally.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export async function loadOperations(): Promise<OperationsView> {
  const sb = await supabaseServer();
  const [errorsRead, flagsRead, endpointsRead] = await Promise.all([
    sb.from("mvp3_error_queue")
      .select("id,source,operation,status,attempt_count,last_error_code,created_at")
      .order("created_at", { ascending: false }).limit(50),
    sb.from("mvp3_feature_flags")
      .select("id,flag_key,version,description,enabled,status,created_by,approved_by")
      .order("flag_key"),
    sb.from("mvp3_integration_endpoints").select("id,status"),
  ]);

  const errors = (errorsRead.data ?? []) as ErrorQueueRow[];
  const flags = (flagsRead.data ?? []) as FeatureFlagRow[];
  const endpoints = (endpointsRead.data ?? []) as { id: string; status: string }[];

  return {
    errors,
    flags,
    endpointCount: endpoints.length,
    configuredCount: endpoints.filter(row => row.status === "configured").length,
    openErrorCount: errors.filter(row => OPEN_ERROR_STATUSES.includes(row.status)).length,
    publishedFlagCount: flags.filter(row => row.status === "published").length,
    errorStatusCounts: countByStatus(errors),
    errorsError: Boolean(errorsRead.error),
    flagsError: Boolean(flagsRead.error),
    endpointsError: Boolean(endpointsRead.error),
  };
}
