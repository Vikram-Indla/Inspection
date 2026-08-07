import type { ChecklistItemRow, ResponseRow } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected, type SourcePage } from "./paginate";
import type { DashboardClient, SourceBounds } from "./client-type";

export function loadResponses(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<ResponseRow>> {
  return collect<ResponseRow>((from, to) => sb.from("checklist_responses").select(`
      inspection_id, is_complete, response,
      inspections!inner(submitted_at, visits(factory_id)),
      inspection_items(regulation_clauses(regulations(title, issuing_authority)))
    `)
    .gte("inspections.submitted_at", bounds.boundIso)
    .range(from, to) as unknown as PromiseLike<SourcePage<ResponseRow>>);
}

export function loadChecklistItems(sb: DashboardClient): Promise<Collected<ChecklistItemRow>> {
  return collect<ChecklistItemRow>((from, to) => sb.from("inspection_items").select(`
      id, active,
      regulation_clauses!inner(regulations!inner(issuing_authority, status))
    `)
    .eq("active", true)
    .eq("regulation_clauses.regulations.status", "published")
    .range(from, to) as unknown as PromiseLike<SourcePage<ChecklistItemRow>>);
}
