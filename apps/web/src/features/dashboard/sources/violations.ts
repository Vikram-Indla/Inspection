import type { ViolationRow } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected } from "./paginate";
import type { DashboardClient, SourceBounds } from "./client-type";
import { violationRow } from "./shapes";

export function loadViolations(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<ViolationRow>> {
  return collect(violationRow, "dashboard.violations", (from, to) => sb.from("violations").select(`
      id, inspection_id,
      inspections!inner(submitted_at, visits(factory_id)),
      violation_codes(title, level, regulation_clauses(regulations(title, issuing_authority)))
    `)
    .gte("inspections.submitted_at", bounds.boundIso)
    .range(from, to));
}
