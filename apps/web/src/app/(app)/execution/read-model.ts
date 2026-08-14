import type { Locale } from "@/lib/i18n";
import type { ExecutionRow } from "@/features/execution/types";
import { executionMessages } from "@/features/execution/strings";

type JsonRecord = Record<string, unknown>;

export type ExecutionWorkspaceRead = {
  status: "ok" | "degraded" | "invalid";
  rows: ExecutionRow[];
  visibleCount: number;
  bounded: boolean;
  omittedRows: number;
};

export type ExecutionVisitDetail = ExecutionRow & {
  notes: string | null;
  planningVersion: number | null;
  packageStatus: string | null;
};

export type ExecutionVisitDetailRead =
  | { status: "ok"; visit: ExecutionVisitDetail }
  | { status: "not_found_or_denied" }
  | { status: "invalid" };

const record = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const nullableText = (value: unknown): string | null =>
  value === null || value === undefined ? null : text(value);

const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined
    ? null
    : typeof value === "number" && Number.isFinite(value)
      ? value
      : null;

const parseRow = (value: unknown, locale: Locale): ExecutionRow | null => {
  const row = record(value);
  const factory = record(row?.factory);
  const assignment = record(row?.assignment);
  const packageVersion = record(row?.package);
  const journey = record(row?.latest_journey);
  const id = text(row?.id);
  const planningStatus = text(row?.planning_status);
  const operationalState = text(row?.operational_state);
  const windowStart = text(row?.window_start);
  const windowEnd = text(row?.window_end);
  if (!row || !factory || !id || !planningStatus || !operationalState || !windowStart || !windowEnd) {
    return null;
  }
  const factoryName = text(factory.name);
  return {
    id,
    visitReference: text(row.visit_reference) ?? id.slice(0, 8),
    factoryId: text(factory.id),
    factory: factoryName ?? executionMessages(locale).table.factoryUnavailable,
    factoryCode: nullableText(factory.factory_code),
    crNumber: nullableText(factory.cr_number),
    windowStart,
    windowEnd,
    executionDate: nullableText(row.execution_date),
    reportType: nullableText(packageVersion?.title),
    packageCode: nullableText(packageVersion?.code),
    packageVersion: nullableText(packageVersion?.version_label),
    visitType: nullableText(row.visit_type),
    visitMode: nullableText(row.execution_mode),
    risk: nullableText(factory.risk_band),
    priority: nullableText(row.priority),
    inspectorId: nullableText(assignment?.inspector_id),
    inspector: nullableText(assignment?.full_name),
    assignmentMethod: nullableText(assignment?.method),
    assignmentStatus: nullableText(assignment?.status),
    region: nullableText(factory.region),
    city: nullableText(factory.city),
    operationalState,
    planningStatus,
    lat: nullableNumber(factory.official_lat),
    lng: nullableNumber(factory.official_lng),
    journeyStatus: nullableText(journey?.status),
    journeyStartedAt: nullableText(journey?.started_at),
    journeyEndedAt: nullableText(journey?.ended_at),
  };
};

export const parseExecutionWorkspaceRead = (
  value: unknown,
  locale: Locale,
): ExecutionWorkspaceRead => {
  const payload = record(value);
  const sourceRows = Array.isArray(payload?.rows) ? payload.rows : null;
  const visibleCount = payload?.visible_count;
  const bounded = payload?.bounded;
  if (
    payload?.status !== "ok"
    || !sourceRows
    || typeof visibleCount !== "number"
    || !Number.isInteger(visibleCount)
    || visibleCount < 0
    || typeof bounded !== "boolean"
  ) {
    return { status: "invalid", rows: [], visibleCount: 0, bounded: false, omittedRows: 0 };
  }
  const rows = sourceRows
    .map(row => parseRow(row, locale))
    .filter((row): row is ExecutionRow => row !== null);
  const omittedRows = sourceRows.length - rows.length;
  return {
    status: omittedRows ? "degraded" : "ok",
    rows,
    visibleCount,
    bounded,
    omittedRows,
  };
};

export const parseExecutionVisitDetailRead = (
  value: unknown,
  locale: Locale,
): ExecutionVisitDetailRead => {
  const payload = record(value);
  if (payload?.status === "not_found_or_denied") return { status: "not_found_or_denied" };
  if (payload?.status !== "ok") return { status: "invalid" };
  const visitPayload = record(payload.visit);
  const visit = parseRow(visitPayload, locale);
  if (!visit || !visitPayload) return { status: "invalid" };
  const packageVersion = record(visitPayload.package);
  const planningVersion = visitPayload.planning_version;
  return {
    status: "ok",
    visit: {
      ...visit,
      notes: nullableText(visitPayload.notes),
      planningVersion: typeof planningVersion === "number" && Number.isInteger(planningVersion)
        ? planningVersion
        : null,
      packageStatus: nullableText(packageVersion?.status),
    },
  };
};
