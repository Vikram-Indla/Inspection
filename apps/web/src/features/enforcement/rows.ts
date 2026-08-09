import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type {
  EnforcementActionForm, EnforcementFactory, EnforcementPenaltyRow, EnforcementViolationRow,
} from "./queries";
import type { EnforcementScope } from "./params";

export const INVALIDATED = "invalidated";
export const UNAVAILABLE = "unavailable";

const RECORD_TONES: Readonly<Record<string, StatusTone>> = {
  approved: "success",
  completed: "success",
  submitted: "info",
  under_review: "info",
  in_progress: "warning",
  executing: "warning",
  draft: "neutral",
  pending: "warning",
  returned: "warning",
  rejected: "danger",
  [INVALIDATED]: "danger",
  [UNAVAILABLE]: "neutral",
};

export const recordTone = (status: string): StatusTone => RECORD_TONES[status] ?? "neutral";

/** An action form is open until its own status says otherwise. */
export type ActionState =
  | { readonly kind: "none" }
  | { readonly kind: "open"; readonly forms: readonly EnforcementActionForm[] }
  | { readonly kind: "closed"; readonly forms: readonly EnforcementActionForm[] };

const CLOSED_FORM_STATUSES = new Set(["closed", "completed", "verified", "resolved"]);

export function actionStateOf(forms: readonly EnforcementActionForm[]): ActionState {
  if (!forms.length) return { kind: "none" };
  const open = forms.filter(form => !CLOSED_FORM_STATUSES.has(form.status));
  return open.length ? { kind: "open", forms: open } : { kind: "closed", forms };
}

/**
 * A blocking action form is only complete when every field the contract makes
 * mandatory is present. A non-blocking form carries no such requirement.
 */
export const isActionFormComplete = (form: EnforcementActionForm): boolean =>
  !form.is_blocking || Boolean(
    form.owner_name?.trim() && form.owner_role?.trim() && form.due_at && form.required_correction?.trim(),
  );

export type PenaltySnapshot = {
  readonly penaltyType: string | null;
  readonly penaltyRef: string | null;
  readonly amount: number | null;
  readonly mappingVersion: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
const numeric = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * `mapping_snapshot` is a jsonb copy of the penalty mapping as it stood when
 * the penalty was recorded. Its shape is whatever was written, so it is
 * narrowed once here and every field is allowed to be absent — a missing amount
 * means none was recorded, not that the penalty is free.
 */
export function readPenaltySnapshot(snapshot: unknown): PenaltySnapshot {
  if (!isRecord(snapshot)) {
    return { penaltyType: null, penaltyRef: null, amount: null, mappingVersion: null };
  }
  return {
    penaltyType: text(snapshot.penalty_type),
    penaltyRef: text(snapshot.penalty_ref),
    amount: numeric(snapshot.amount),
    mappingVersion: text(snapshot.mapping_version),
  };
}

export type PenaltyState =
  | { readonly kind: "restricted" }
  | { readonly kind: "none" }
  | { readonly kind: "multiple"; readonly count: number }
  | {
      readonly kind: "one";
      readonly issued: boolean;
      readonly issuedAt: string | null;
      readonly snapshot: PenaltySnapshot;
    };

export function penaltyStateOf(
  linked: readonly EnforcementPenaltyRow[],
  readable: boolean,
): PenaltyState {
  if (!readable) return { kind: "restricted" };
  if (!linked.length) return { kind: "none" };
  if (linked.length > 1) return { kind: "multiple", count: linked.length };
  const penalty = linked[0];
  return {
    kind: "one",
    issued: penalty.status === "issued",
    issuedAt: penalty.issued_at,
    snapshot: readPenaltySnapshot(penalty.mapping_snapshot),
  };
}

export type EnforcementRow = {
  readonly id: string;
  readonly factory: EnforcementFactory | null;
  readonly inspectionReference: string | null;
  readonly visitReference: string | null;
  readonly violationTitle: string | null;
  readonly violationCode: string | null;
  readonly level: string | null;
  readonly inspector: string | null;
  readonly recordStatus: string;
  readonly recordedAt: string | null;
  readonly action: ActionState;
  readonly penalty: PenaltyState;
};

export function toEnforcementRow(
  row: EnforcementViolationRow,
  penalties: readonly EnforcementPenaltyRow[],
  penaltiesReadable: boolean,
): EnforcementRow {
  const inspection = row.inspections;
  const visit = inspection?.visits;
  const assignments = visit?.assignments ?? [];
  const assignment = assignments.find(item => item.status !== "returned") ?? assignments[0];
  const forms = (inspection?.action_forms ?? []).filter(form => form.violation_id === row.id);

  return {
    id: row.id,
    factory: visit?.factories ?? null,
    inspectionReference: inspection?.inspection_no ?? null,
    visitReference: visit?.visit_reference ?? null,
    violationTitle: row.violation_codes?.title ?? null,
    violationCode: row.violation_codes?.code ?? null,
    level: row.violation_codes?.level ?? null,
    inspector: assignment?.profiles?.full_name ?? null,
    recordStatus: row.invalidated_at ? INVALIDATED : inspection?.status ?? UNAVAILABLE,
    recordedAt: inspection?.submitted_at ?? inspection?.started_at ?? null,
    action: actionStateOf(forms),
    penalty: penaltyStateOf(penalties.filter(item => item.violation_id === row.id), penaltiesReadable),
  };
}

export function filterEnforcement(
  rows: readonly EnforcementRow[],
  scope: EnforcementScope,
  nowMs: number,
): readonly EnforcementRow[] {
  const needle = scope.search.toLowerCase();
  const cutoff = scope.range ? nowMs - scope.range * 86_400_000 : 0;
  return rows.filter(row => {
    if (scope.status && row.recordStatus !== scope.status) return false;
    if (scope.region && row.factory?.region !== scope.region) return false;
    if (cutoff && (!row.recordedAt || new Date(row.recordedAt).getTime() < cutoff)) return false;
    if (!needle) return true;
    const haystack = [
      row.factory?.name, row.factory?.license_number, row.inspectionReference,
      row.visitReference, row.violationTitle, row.violationCode,
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}

export const regionsOf = (rows: readonly EnforcementRow[]): readonly string[] =>
  [...new Set(rows.map(row => row.factory?.region).filter((value): value is string => Boolean(value)))].sort();

export const statusesOf = (rows: readonly EnforcementRow[]): readonly string[] =>
  [...new Set(rows.map(row => row.recordStatus))].sort();
