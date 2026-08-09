import type {
  EnforcementFilters,
  EnforcementTone,
  PenaltyRow,
  ViolationRow,
} from "./types";

export type EnforcementRecordStrings = {
  readonly statuses: Readonly<Record<string, string>>;
  readonly penaltyNotIssued: string;
  readonly penaltyMultiple: string;
  readonly missing: string;
  readonly unavailable: string;
};

export type EnforcementDrawerStrings = {
  readonly factorySummary: string;
  readonly inspectionSummary: string;
  readonly violation: string;
  readonly penalty: string;
  readonly evidence: string;
  readonly timeline: string;
  readonly audit: string;
  readonly factory: string;
  readonly license: string;
  readonly inspection: string;
  readonly inspector: string;
  readonly date: string;
  readonly status: string;
  readonly actionForm: string;
  readonly attachments: string;
  readonly issued: string;
  readonly submitted: string;
  readonly notSubmitted: string;
  readonly recordedBy: string;
  readonly sourceViolation: string;
  readonly mappingVersion: string;
};

export type EnforcementRecordView = {
  readonly id: string;
  readonly factory: string;
  readonly license: string;
  readonly inspectionRef: string;
  readonly violation: string;
  readonly penalty: string;
  readonly inspector: string;
  readonly statusLabel: string;
  readonly statusTone: EnforcementTone;
  readonly issuedOn: string;
  readonly issuedDate: string | null;
  readonly actionForm: string;
};

export type EnforcementDetailGroup = {
  readonly label: string;
  readonly items: readonly { readonly label: string; readonly value: string }[];
};

export type EnforcementDetailView = {
  readonly title: string;
  readonly reference: string;
  readonly factoryId: string;
  readonly groups: readonly EnforcementDetailGroup[];
};

const CLOSED_STATUSES = new Set(["approved", "completed"]);
const RETURNED_STATUSES = new Set(["rejected", "returned"]);

export function recordStatusOf(row: ViolationRow): string {
  if (row.invalidated_at) return "invalidated";
  return row.inspections?.status ?? "unavailable";
}

export function recordedAtOf(row: ViolationRow): string | null {
  return row.inspections?.submitted_at ?? row.inspections?.started_at ?? null;
}

export function statusToneOf(status: string): EnforcementTone {
  if (CLOSED_STATUSES.has(status)) return "success";
  if (RETURNED_STATUSES.has(status)) return "warning";
  if (status === "invalidated" || status === "unavailable") return "neutral";
  return "danger";
}

export function availableStatuses(rows: readonly ViolationRow[]): readonly string[] {
  return Array.from(new Set(rows.map(recordStatusOf))).sort();
}

export function availableRegions(rows: readonly ViolationRow[]): readonly string[] {
  return Array.from(new Set(
    rows
      .map(row => row.inspections?.visits?.factories?.region)
      .filter((value): value is string => Boolean(value)),
  )).sort();
}

export function applyEnforcementFilters(
  rows: readonly ViolationRow[],
  filters: EnforcementFilters,
  nowMs: number,
): readonly ViolationRow[] {
  const q = filters.q.toLowerCase();
  const cutoff = filters.range ? nowMs - filters.range * 86_400_000 : 0;
  return rows.filter(row => {
    const inspection = row.inspections;
    const factory = inspection?.visits?.factories;
    const code = row.violation_codes;
    const recordedAt = recordedAtOf(row);
    const haystack = `${factory?.name ?? ""} ${factory?.license_number ?? ""} ${inspection?.id ?? ""} ${code?.title ?? ""} ${code?.code ?? ""}`.toLowerCase();
    return (!q || haystack.includes(q))
      && (!filters.status || recordStatusOf(row) === filters.status)
      && (!filters.region || factory?.region === filters.region)
      && (!cutoff || Boolean(recordedAt) && new Date(recordedAt as string).getTime() >= cutoff);
  });
}

function inspectorOf(row: ViolationRow): string | null {
  const assignments = row.inspections?.visits?.assignments ?? [];
  const active = assignments.find(item => item.status !== "returned") ?? assignments[0];
  return active?.profiles?.full_name ?? null;
}

function penaltyLabelOf(linked: readonly PenaltyRow[], strings: EnforcementRecordStrings): string {
  if (!linked.length) return strings.penaltyNotIssued;
  if (linked.length > 1) return strings.penaltyMultiple;
  return linked[0].mapping_snapshot?.penalty_type ?? linked[0].status ?? strings.unavailable;
}

function statusLabelOf(status: string, strings: EnforcementRecordStrings): string {
  return strings.statuses[status] ?? status.replaceAll("_", " ");
}

function actionFormLabelOf(row: ViolationRow, strings: EnforcementRecordStrings): string {
  const forms = (row.inspections?.action_forms ?? []).filter(form => form.violation_id === row.id);
  if (!forms.length) return strings.missing;
  return forms.map(form => form.form_type.replaceAll("_", " ")).join(", ");
}

export function buildEnforcementRecords(
  rows: readonly ViolationRow[],
  penalties: readonly PenaltyRow[],
  strings: EnforcementRecordStrings,
): readonly EnforcementRecordView[] {
  return rows.map(row => {
    const factory = row.inspections?.visits?.factories;
    const status = recordStatusOf(row);
    return {
      id: row.id,
      factory: factory?.name ?? strings.unavailable,
      license: factory?.license_number ?? strings.missing,
      inspectionRef: row.inspections?.id.slice(0, 8) ?? strings.missing,
      violation: row.violation_codes?.title ?? strings.unavailable,
      penalty: penaltyLabelOf(penalties.filter(item => item.violation_id === row.id), strings),
      inspector: inspectorOf(row) ?? strings.missing,
      statusLabel: statusLabelOf(status, strings),
      statusTone: statusToneOf(status),
      issuedOn: recordedAtOf(row)?.slice(0, 10) ?? strings.missing,
      issuedDate: recordedAtOf(row)?.slice(0, 10) ?? null,
      actionForm: actionFormLabelOf(row, strings),
    };
  });
}

export function buildEnforcementDetail(
  row: ViolationRow,
  penalties: readonly PenaltyRow[],
  strings: EnforcementRecordStrings,
  drawer: EnforcementDrawerStrings,
): EnforcementDetailView | null {
  const inspection = row.inspections;
  const factory = inspection?.visits?.factories;
  if (!inspection || !factory) return null;
  const status = recordStatusOf(row);
  const linked = penalties.filter(item => item.violation_id === row.id);
  const evidenceCount = inspection.evidence.filter(item => item.linked_id === row.id).length;
  const inspector = inspectorOf(row) ?? strings.missing;
  const issued = recordedAtOf(row)?.slice(0, 10) ?? strings.missing;
  return {
    title: row.violation_codes?.title ?? strings.unavailable,
    reference: `${row.violation_codes?.code ?? row.id} · ${factory.name}`,
    factoryId: factory.id,
    groups: [
      { label: drawer.factorySummary, items: [
        { label: drawer.factory, value: factory.name },
        { label: drawer.license, value: factory.license_number ?? strings.missing },
      ] },
      { label: drawer.inspectionSummary, items: [
        { label: drawer.inspection, value: inspection.id },
        { label: drawer.inspector, value: inspector },
        { label: drawer.date, value: issued },
      ] },
      { label: drawer.violation, items: [
        { label: drawer.violation, value: row.violation_codes?.title ?? strings.unavailable },
        { label: drawer.status, value: statusLabelOf(status, strings) },
      ] },
      { label: drawer.penalty, items: [
        { label: drawer.penalty, value: penaltyLabelOf(linked, strings) },
        { label: drawer.actionForm, value: actionFormLabelOf(row, strings) },
      ] },
      { label: drawer.evidence, items: [
        { label: drawer.attachments, value: String(evidenceCount) },
      ] },
      { label: drawer.timeline, items: [
        { label: drawer.issued, value: issued },
        { label: drawer.submitted, value: inspection.submitted_at?.slice(0, 10) ?? drawer.notSubmitted },
      ] },
      { label: drawer.audit, items: [
        { label: drawer.recordedBy, value: inspector },
        { label: drawer.sourceViolation, value: row.id },
        { label: drawer.mappingVersion, value: row.mapping_version },
      ] },
    ],
  };
}
