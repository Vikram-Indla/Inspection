export type FieldFactory = {
  id: string;
  name: string;
  factoryCode: string | null;
  region: string | null;
  city: string | null;
  riskScore: number | null;
  riskBand: string | null;
  lat: number | null;
  lng: number | null;
};

export type FieldVisit = {
  id: string;
  planningStatus: string;
  operationalState: string;
  visitType: string | null;
  windowStart: string;
  factory: FieldFactory | null;
  inspectionId: string | null;
  inspectionStatus: string | null;
  returnedForCorrection: boolean;
};

export type FieldProfile = {
  fullName: string | null;
  region: string | null;
};

export const ASSIGNMENT_COLUMNS =
  "visit_id, visits(id, planning_status, operational_state, visit_type, window_start, window_end, factory_id, factories(id, name, factory_code, region, city, risk_score, risk_band, official_lat, official_lng), inspections(id, status, reviews(returned_sections)))";

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

function toFactory(value: unknown): FieldFactory | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (id === null || name === null) return null;
  return {
    id,
    name,
    factoryCode: asString(value.factory_code),
    region: asString(value.region),
    city: asString(value.city),
    riskScore: asNumber(value.risk_score),
    riskBand: asString(value.risk_band),
    lat: asNumber(value.official_lat),
    lng: asNumber(value.official_lng),
  };
}

function hasReturnedSections(value: unknown): boolean {
  const rows = Array.isArray(value) ? value : [value];
  return rows.some(row => isRecord(row) && Array.isArray(row.returned_sections) && row.returned_sections.length > 0);
}

function toVisit(value: unknown): FieldVisit | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const planningStatus = asString(value.planning_status);
  const operationalState = asString(value.operational_state);
  const windowStart = asString(value.window_start);
  if (id === null || planningStatus === null || operationalState === null || windowStart === null) return null;

  const inspection = unwrap(value.inspections);
  const inspectionRecord = isRecord(inspection) ? inspection : null;

  return {
    id,
    planningStatus,
    operationalState,
    visitType: asString(value.visit_type),
    windowStart,
    factory: toFactory(unwrap(value.factories)),
    inspectionId: inspectionRecord ? asString(inspectionRecord.id) : null,
    inspectionStatus: inspectionRecord ? asString(inspectionRecord.status) : null,
    returnedForCorrection: inspectionRecord ? hasReturnedSections(inspectionRecord.reviews) : false,
  };
}

export function toAssignedVisits(value: unknown): readonly FieldVisit[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(row => (isRecord(row) ? toVisit(unwrap(row.visits)) : null))
    .filter((visit): visit is FieldVisit => visit !== null);
}

export function toProfile(value: unknown): FieldProfile {
  if (!isRecord(value)) return { fullName: null, region: null };
  return { fullName: asString(value.full_name), region: asString(value.region) };
}

export function countUnread(
  value: unknown,
  isUnread: (row: { read_at: string | null; delivery_state: string }) => boolean,
): boolean {
  if (!Array.isArray(value)) return false;
  return value.some(row => {
    if (!isRecord(row)) return false;
    const deliveryState = asString(row.delivery_state);
    if (deliveryState === null) return false;
    return isUnread({ read_at: asString(row.read_at), delivery_state: deliveryState });
  });
}
