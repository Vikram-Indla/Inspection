import type { SupabaseClient } from "@supabase/supabase-js";

export type DuplicateVisit = { id: string; visit_type: string; planning_status: string };
export type DuplicateVisitRead = { visits: DuplicateVisit[]; unavailable: boolean };

const ACTIVE_PLANNING_STATUSES = ["draft", "pending_supervision", "published", "returned"];
const DUPLICATE_READ_LIMIT = 5;

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
