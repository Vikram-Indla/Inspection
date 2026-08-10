import type { DashboardSla } from "@/app/(app)/dashboard/metrics";
import { readSingle } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";
import type { DashboardClient } from "./client-type";

export type SlaResult = { sla: DashboardSla; failed: boolean };

const NO_SLA: DashboardSla = {};

const slaSettings: Shape<DashboardSla> = f => ({
  review_business_days: f.optionalNumber("review_business_days") ?? undefined,
  calendar: f.toOne("calendar", calendar => ({
    days: calendar.optionalText("days") ?? undefined,
    tz: calendar.optionalText("tz") ?? undefined,
  })) ?? undefined,
});

const slaRow: Shape<DashboardSla> = f => f.toOne("settings", slaSettings) ?? NO_SLA;

export async function loadSlaSettings(sb: DashboardClient): Promise<SlaResult> {
  const response = await sb.from("engine_settings")
    .select("settings")
    .eq("engine", "sla")
    .maybeSingle();
  const { row, failed } = readSingle(response, slaRow, "dashboard.engine_settings");
  return { sla: row ?? NO_SLA, failed };
}

export function emptySlaSettings(): SlaResult {
  return { sla: NO_SLA, failed: false };
}
