import type { AssignmentTask } from "@/app/(app)/field/my-tasks/assignment-task-model";

export type FieldVisit = AssignmentTask & {
  visitReference: string | null;
  factory: AssignmentTask["factory"] & {
    crNumber: string | null;
    licenseNumber: string | null;
    officialLat: number | null;
    officialLng: number | null;
  };
};

export const ASSIGNMENT_COLUMNS =
  "status, return_reason, visits(id, visit_reference, planning_status, operational_state, window_start, window_end, visit_type, execution_mode, priority, package_version_id, factories(name, factory_code, cr_number, license_number, region, city, official_lat, official_lng), inspections(id, status))";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function unwrap(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

export function toVisit(row: unknown): FieldVisit | null {
  if (!isRecord(row)) return null;
  const visit = unwrap(row.visits);
  if (!isRecord(visit)) return null;
  const factory = unwrap(visit.factories);
  if (!isRecord(factory)) return null;

  const id = asString(visit.id);
  const planningStatus = asString(visit.planning_status);
  const operationalState = asString(visit.operational_state);
  const windowStart = asString(visit.window_start);
  const visitType = asString(visit.visit_type);
  const executionMode = asString(visit.execution_mode);
  const name = asString(factory.name);
  if (id === null || planningStatus === null || operationalState === null) return null;
  if (windowStart === null || visitType === null || executionMode === null || name === null) return null;

  const inspection = unwrap(visit.inspections);
  const inspectionRecord = isRecord(inspection) ? inspection : null;

  return {
    id,
    visitReference: asString(visit.visit_reference),
    assignmentStatus: asString(row.status),
    returnReason: asString(row.return_reason),
    planningStatus,
    operationalState,
    windowStart,
    windowEnd: asString(visit.window_end),
    visitType,
    executionMode,
    priority: asString(visit.priority),
    packageVersionId: asString(visit.package_version_id),
    inspectionId: inspectionRecord ? asString(inspectionRecord.id) : null,
    inspectionStatus: inspectionRecord ? asString(inspectionRecord.status) : null,
    unreadAlertCount: 0,
    factory: {
      name,
      code: asString(factory.factory_code),
      region: asString(factory.region),
      city: asString(factory.city),
      crNumber: asString(factory.cr_number),
      licenseNumber: asString(factory.license_number),
      officialLat: asNumber(factory.official_lat),
      officialLng: asNumber(factory.official_lng),
    },
  };
}

export function toVisits(value: unknown): readonly FieldVisit[] {
  if (!Array.isArray(value)) return [];
  return value.map(toVisit).filter((visit): visit is FieldVisit => visit !== null);
}
