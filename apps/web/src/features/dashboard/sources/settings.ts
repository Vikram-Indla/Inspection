import type { DashboardSla } from "@/app/(app)/dashboard/metrics";
import type { DashboardClient } from "./client-type";

export type SlaResult = { sla: DashboardSla; failed: boolean };

export async function loadSlaSettings(sb: DashboardClient): Promise<SlaResult> {
  const { data, error } = await sb.from("engine_settings")
    .select("settings")
    .eq("engine", "sla")
    .maybeSingle();
  return { sla: (data?.settings ?? {}) as DashboardSla, failed: Boolean(error) };
}

export function emptySlaSettings(): SlaResult {
  return { sla: {} as DashboardSla, failed: false };
}
