import type { SupabaseClient } from "@supabase/supabase-js";
import type { FactoryRiskDriver } from "@/components/sections/factories/factory-risk/factory-risk";

export type RiskSnapshot = {
  readonly score: number;
  readonly band: string | null;
  readonly modelVersion: string | null;
  readonly calculatedAt: string | null;
};

export type FactoryRiskMovement = {
  readonly latest: RiskSnapshot;
  readonly previous: RiskSnapshot | null;
  /** Oldest first, so a chart reads left to right. Only recorded calculations. */
  readonly series: readonly RiskSnapshot[];
};

const SNAPSHOTS_PER_FACTORY = 6;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const numeric = (value: unknown): number | null =>
  (typeof value === "number" && Number.isFinite(value) ? value : null);

/**
 * The most recent recorded snapshots per factory, newest first from the query
 * and reversed into `series` for display. Nothing is interpolated: a factory
 * with two calculations gets two bars, not a smoothed line.
 */
export async function queryFactoryRiskMovement(
  sb: SupabaseClient,
  factoryIds: readonly string[],
): Promise<ReadonlyMap<string, FactoryRiskMovement>> {
  if (factoryIds.length === 0) return new Map();

  const read = await sb.from("factory_risk_snapshots")
    .select("factory_id, score, band, model_version, calculated_at")
    .in("factory_id", [...factoryIds])
    .order("calculated_at", { ascending: false });

  if (read.error) {
    console.error(`[factories.risk-movement] read failed: ${read.error.message}`);
    return new Map();
  }

  const byFactory = new Map<string, RiskSnapshot[]>();
  for (const row of rows(read.data)) {
    const factoryId = text(row, "factory_id");
    const score = numeric(row.score);
    if (!factoryId || score === null) continue;
    const kept = byFactory.get(factoryId) ?? [];
    if (kept.length >= SNAPSHOTS_PER_FACTORY) continue;
    kept.push({
      score,
      band: text(row, "band"),
      modelVersion: text(row, "model_version"),
      calculatedAt: text(row, "calculated_at"),
    });
    byFactory.set(factoryId, kept);
  }

  const movement = new Map<string, FactoryRiskMovement>();
  for (const [factoryId, snapshots] of byFactory) {
    const latest = snapshots[0];
    if (!latest) continue;
    movement.set(factoryId, {
      latest,
      previous: snapshots[1] ?? null,
      series: [...snapshots].reverse(),
    });
  }
  return movement;
}

/**
 * Recorded driver breakdown, exactly as the risk engine stored it. Keys
 * prefixed with `_` are engine metadata, not drivers. Nothing is computed here
 * — an absent value stays absent rather than being reconstructed.
 */
export function toDriverLines(
  drivers: unknown,
  missing: string,
): readonly FactoryRiskDriver[] {
  if (!isRecord(drivers)) return [];
  return Object.entries(drivers)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, raw]) => {
      const detail = isRecord(raw) ? raw : null;
      const value = numeric(detail?.value) ?? missing;
      const weight = numeric(detail?.weight) ?? missing;
      const contribution = numeric(detail?.contribution) ?? missing;
      return { key, text: `${key.replaceAll("_", " ")}: ${value} × ${weight} = ${contribution}` };
    });
}
