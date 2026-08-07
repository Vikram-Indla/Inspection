import type { ResolvedPolicy, ResolvedPolicyGates } from "@/lib/dashboard-kpi/loader";
import type {
  AuditRow, ChecklistItemRow, DashboardSla, FactoryRef, GeoRow,
  InspectionRow, ResponseRow, ReviewRow, ViolationRow, VisitRow,
} from "@/app/(app)/dashboard/metrics";

export const SOURCE_KEYS = [
  "visits", "inspections", "reviews", "responses", "checklistItems",
  "violations", "geo", "factories", "audit", "sla",
] as const;

export type SourceKey = (typeof SOURCE_KEYS)[number];

export type DashboardSnapshot = {
  readonly visits: VisitRow[];
  readonly inspections: InspectionRow[];
  readonly reviews: ReviewRow[];
  readonly responses: ResponseRow[];
  readonly checklistItems: ChecklistItemRow[];
  readonly violations: ViolationRow[];
  readonly geo: GeoRow[];
  readonly factories: FactoryRef[];
  readonly audit: AuditRow[];
  readonly sla: DashboardSla;
  readonly policy: ResolvedPolicy;
  readonly gates: ResolvedPolicyGates;
  readonly failedSources: SourceKey[];
};
