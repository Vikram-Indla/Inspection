import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioCounts = {
  readonly openViolations: ReadonlyMap<string, number>;
  readonly activePenalties: ReadonlyMap<string, number>;
  readonly openViolationsAvailable: boolean;
  readonly activePenaltiesAvailable: boolean;
};

export const ACTIVE_PENALTY_STATUSES = ["issued", "served"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

function tally(entries: readonly (string | null)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of entries) {
    if (id === null) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function factoryIdOf(row: Record<string, unknown>): string | null {
  const inspection = row.inspections;
  if (!isRecord(inspection)) return null;
  const visit = inspection.visits;
  return isRecord(visit) ? text(visit, "factory_id") : null;
}

export const EMPTY_PORTFOLIO_COUNTS: PortfolioCounts = {
  openViolations: new Map(),
  activePenalties: new Map(),
  openViolationsAvailable: false,
  activePenaltiesAvailable: false,
};

export async function queryPortfolioCounts(
  sb: SupabaseClient,
  factoryIds: readonly string[],
): Promise<PortfolioCounts> {
  if (factoryIds.length === 0) {
    return { ...EMPTY_PORTFOLIO_COUNTS, openViolationsAvailable: true, activePenaltiesAvailable: true };
  }

  const ids = [...factoryIds];
  const [violationRead, penaltyRead] = await Promise.all([
    sb.from("violations")
      .select("id, inspections!inner(visits!inner(factory_id))")
      .is("invalidated_at", null)
      .in("inspections.visits.factory_id", ids),
    sb.from("penalty_notices")
      .select("id, factory_id")
      .in("factory_id", ids)
      .in("status", [...ACTIVE_PENALTY_STATUSES]),
  ]);

  if (violationRead.error) console.error(`[factories.counts] violations failed: ${violationRead.error.message}`);
  if (penaltyRead.error) console.error(`[factories.counts] penalties failed: ${penaltyRead.error.message}`);

  return {
    openViolations: violationRead.error ? new Map() : tally(rows(violationRead.data).map(factoryIdOf)),
    activePenalties: penaltyRead.error ? new Map() : tally(rows(penaltyRead.data).map(row => text(row, "factory_id"))),
    openViolationsAvailable: !violationRead.error,
    activePenaltiesAvailable: !penaltyRead.error,
  };
}
