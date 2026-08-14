import type { SupabaseClient } from "@supabase/supabase-js";

export type DuplicateVisit = { id: string; visit_type: string; planning_status: string };
export type DuplicateVisitRead = { visits: DuplicateVisit[]; unavailable: boolean };

const ACTIVE_PLANNING_STATUSES = ["draft", "pending_supervision", "published", "returned"];
const DUPLICATE_READ_LIMIT = 5;

/**
 * The same read for a whole candidate list, in one round trip.
 *
 * The search path called the single-factory version once per result, so a
 * 50-row page cost 51 queries. That was survivable only while the search
 * demanded three characters and rarely filled the page; searching from the
 * first character fills it on nearly every keystroke.
 */
export async function findDuplicateActiveVisitsFor(
  sb: SupabaseClient,
  factoryIds: readonly string[],
): Promise<{ byFactory: Record<string, DuplicateVisit[]>; unavailable: boolean }> {
  if (!factoryIds.length) return { byFactory: {}, unavailable: false };
  const { data, error } = await sb.from("visits")
    .select("id, visit_type, planning_status, factory_id")
    .in("factory_id", [...new Set(factoryIds)])
    .in("planning_status", ACTIVE_PLANNING_STATUSES)
    .limit(factoryIds.length * DUPLICATE_READ_LIMIT);
  if (error) {
    console.error("[duplicate-active-visit batch read]", error.message, error.code);
    return { byFactory: {}, unavailable: true };
  }
  const byFactory: Record<string, DuplicateVisit[]> = {};
  for (const row of (data ?? []) as (DuplicateVisit & { factory_id: string })[]) {
    const bucket = byFactory[row.factory_id] ?? [];
    // Keep the per-factory cap the single read applied, so a factory with many
    // active visits cannot crowd the page.
    if (bucket.length < DUPLICATE_READ_LIMIT) {
      bucket.push({ id: row.id, visit_type: row.visit_type, planning_status: row.planning_status });
    }
    byFactory[row.factory_id] = bucket;
  }
  return { byFactory, unavailable: false };
}

export async function findDuplicateActiveVisits(
  sb: SupabaseClient,
  factoryId: string,
  visitType?: string,
): Promise<DuplicateVisitRead> {
  const base = sb.from("visits").select("id, visit_type, planning_status")
    .eq("factory_id", factoryId)
    .in("planning_status", ACTIVE_PLANNING_STATUSES);
  const scoped = visitType ? base.eq("visit_type", visitType) : base;
  const { data, error } = await scoped.limit(DUPLICATE_READ_LIMIT);
  if (error) {
    console.error("[duplicate-active-visit read]", error.message, error.code);
    return { visits: [], unavailable: true };
  }
  return { visits: (data ?? []) as DuplicateVisit[], unavailable: false };
}
