import type { SupabaseClient } from "@supabase/supabase-js";

// CD-022 — M02-012 duplicate-active-visit read, shared verbatim between the
// dossier (selection-time warning) and publishSingleVisit (publish-time
// block). Same table/status logic, same function: "one query, two call
// sites" — dossier omits the visit_type filter (not chosen yet at selection
// time, so it surfaces ANY active visit for the factory as a warning);
// publish passes the actual chosen visit_type (the existing hard block,
// unchanged).
export type DuplicateVisit = { id: string; visit_type: string };

export async function findDuplicateActiveVisits(
  sb: SupabaseClient,
  factoryId: string,
  visitType?: string,
): Promise<DuplicateVisit[]> {
  let q = sb.from("visits").select("id, visit_type")
    .eq("factory_id", factoryId)
    .in("planning_status", ["draft", "published", "returned"]);
  if (visitType) q = q.eq("visit_type", visitType);
  const { data } = await q.limit(5);
  return (data ?? []) as DuplicateVisit[];
}
