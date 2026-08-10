import type { InspectionRow, ReviewRow, VisitRow } from "@/app/(app)/dashboard/metrics";
import { collect, type Collected } from "./paginate";
import type { DashboardClient, SourceBounds } from "./client-type";
import { inspectionRow, reviewRow, visitRow } from "./shapes";

export function loadVisits(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<VisitRow>> {
  return collect(visitRow, "dashboard.visits", (from, to) => {
    const base = sb.from("visits").select(`
      id, planning_status, operational_state, window_start, window_end, priority, cancellation_reason, created_at, factory_id,
      assignments(inspector_id, profiles(full_name))
    `);
    const request = bounds.bounded
      ? base.or(`window_start.gte.${bounds.boundIso},created_at.gte.${bounds.boundIso}`)
      : base;
    return request.range(from, to);
  });
}

export function loadInspections(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<InspectionRow>> {
  return collect(inspectionRow, "dashboard.inspections", (from, to) => {
    const base = sb.from("inspections").select(`
      id, visit_id, status, started_at, submitted_at,
      visits(window_start, factory_id)
    `);
    const request = bounds.bounded
      ? base.or(`submitted_at.gte.${bounds.boundIso},started_at.gte.${bounds.boundIso},status.eq.not_started,status.eq.in_progress`)
      : base;
    return request.range(from, to);
  });
}

export function loadReviews(sb: DashboardClient, bounds: SourceBounds): Promise<Collected<ReviewRow>> {
  return collect(reviewRow, "dashboard.reviews", (from, to) => {
    const base = sb.from("reviews").select(`
      id, inspection_id, status, decision, decided_at,
      inspections!inner(submitted_at, visits(window_start, factory_id))
    `);
    const request = bounds.bounded
      ? base.gte("inspections.submitted_at", bounds.boundIso)
      : base;
    return request.range(from, to);
  });
}
