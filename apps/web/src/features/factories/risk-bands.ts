import type { SupabaseClient } from "@supabase/supabase-js";

export type RiskBands = {
  readonly ceiling: number;
  readonly lowMax: number;
  readonly mediumMax: number;
  readonly versionLabel: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function pair(bands: unknown, key: string): readonly [number, number] | null {
  if (!isRecord(bands)) return null;
  const range = bands[key];
  if (!Array.isArray(range) || range.length < 2) return null;
  const from = Number(range[0]);
  const to = Number(range[1]);
  return Number.isFinite(from) && Number.isFinite(to) ? [from, to] : null;
}

export async function queryRiskBands(sb: SupabaseClient): Promise<RiskBands | null> {
  const { data, error } = await sb
    .from("engine_settings")
    .select("settings, version_label")
    .eq("engine", "risk")
    .maybeSingle();

  if (error) {
    console.error("[factories.riskBands] engine_settings read failed", error);
    return null;
  }
  if (!isRecord(data) || !isRecord(data.settings)) return null;

  const low = pair(data.settings.bands, "low");
  const medium = pair(data.settings.bands, "medium");
  const high = pair(data.settings.bands, "high");
  if (!low || !medium || !high) return null;

  const versionLabel = typeof data.version_label === "string" ? data.version_label : null;
  return { ceiling: high[1], lowMax: low[1], mediumMax: medium[1], versionLabel };
}
