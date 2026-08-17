export type MyTasksFactory = {
  id: string;
  name: string;
  factoryCode: string | null;
  crNumber: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

export type MyTasksVisit = {
  id: string;
  planningStatus: string;
  operationalState: string;
  windowStart: string;
  windowEnd: string | null;
  visitType: string;
  executionMode: string;
  priority: string | null;
  packageVersionId: string | null;
  factoryId: string | null;
  factory: MyTasksFactory | null;
  inspectionId: string | null;
  inspectionStatus: string | null;
};

export type MyTasksAssignment = {
  assignmentStatus: string | null;
  returnReason: string | null;
  visit: MyTasksVisit;
};

export const ASSIGNMENT_COLUMNS =
  "visit_id, status, return_reason, visits(id, planning_status, operational_state, window_start, window_end, visit_type, execution_mode, priority, package_version_id, factory_id, factories(id, name, factory_code, cr_number, region, city, official_lat, official_lng), inspections(id, status))";

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

function toFactory(value: unknown): MyTasksFactory | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (id === null || name === null) return null;
  return {
    id,
    name,
    factoryCode: asString(value.factory_code),
    crNumber: asString(value.cr_number),
    region: asString(value.region),
    city: asString(value.city),
    lat: asNumber(value.official_lat),
    lng: asNumber(value.official_lng),
  };
}

function toVisit(value: unknown): MyTasksVisit | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const planningStatus = asString(value.planning_status);
  const operationalState = asString(value.operational_state);
  const windowStart = asString(value.window_start);
  const visitType = asString(value.visit_type);
  const executionMode = asString(value.execution_mode);
  if (id === null || planningStatus === null || operationalState === null) return null;
  if (windowStart === null || visitType === null || executionMode === null) return null;

  const inspection = unwrap(value.inspections);
  const inspectionRecord = isRecord(inspection) ? inspection : null;

  return {
    id,
    planningStatus,
    operationalState,
    windowStart,
    windowEnd: asString(value.window_end),
    visitType,
    executionMode,
    priority: asString(value.priority),
    packageVersionId: asString(value.package_version_id),
    factoryId: asString(value.factory_id),
    factory: toFactory(unwrap(value.factories)),
    inspectionId: inspectionRecord ? asString(inspectionRecord.id) : null,
    inspectionStatus: inspectionRecord ? asString(inspectionRecord.status) : null,
  };
}

export function toAssignments(value: unknown): readonly MyTasksAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(row => {
      if (!isRecord(row)) return null;
      const visit = toVisit(unwrap(row.visits));
      if (visit === null || visit.factory === null) return null;
      return {
        assignmentStatus: asString(row.status),
        returnReason: asString(row.return_reason),
        visit,
      };
    })
    .filter((row): row is MyTasksAssignment => row !== null);
}

export function countUnreadByVisit(value: unknown, isUnread: (row: {
  read_at: string | null;
  delivery_state: string;
}) => boolean): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  if (!Array.isArray(value)) return counts;
  for (const row of value) {
    if (!isRecord(row)) continue;
    const deliveryState = asString(row.delivery_state);
    if (deliveryState === null) continue;
    if (!isUnread({ read_at: asString(row.read_at), delivery_state: deliveryState })) continue;
    const payload = isRecord(row.payload) ? row.payload : null;
    const visitId = payload ? asString(payload.visit_id) : null;
    if (visitId === null) continue;
    counts.set(visitId, (counts.get(visitId) ?? 0) + 1);
  }
  return counts;
}
