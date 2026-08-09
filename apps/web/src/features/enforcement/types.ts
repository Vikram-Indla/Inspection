export type EnforcementFactory = {
  readonly id: string;
  readonly name: string;
  readonly factory_code: string | null;
  readonly license_number: string | null;
  readonly region: string | null;
  readonly city: string | null;
};

export type EnforcementAssignment = {
  readonly status: string;
  readonly profiles: { readonly full_name: string } | null;
};

export type EnforcementActionForm = {
  readonly id: string;
  readonly violation_id: string | null;
  readonly form_type: string;
  readonly status: string;
};

export type EnforcementEvidence = {
  readonly id: string;
  readonly linked_id: string;
  readonly content_sha256: string | null;
};

export type EnforcementInspection = {
  readonly id: string;
  readonly status: string;
  readonly started_at: string | null;
  readonly submitted_at: string | null;
  readonly visits: {
    readonly id: string;
    readonly factories: EnforcementFactory | null;
    readonly assignments: readonly EnforcementAssignment[];
  } | null;
  readonly action_forms: readonly EnforcementActionForm[];
  readonly evidence: readonly EnforcementEvidence[];
};

export type ViolationRow = {
  readonly id: string;
  readonly mapping_version: string;
  readonly invalidated_at: string | null;
  readonly inspections: EnforcementInspection | null;
  readonly violation_codes: {
    readonly title: string;
    readonly code: string;
    readonly level: string;
    readonly corrective_action: string | null;
  } | null;
};

export type PenaltyRow = {
  readonly violation_id: string;
  readonly status: string;
  readonly mapping_snapshot: {
    readonly penalty_type?: string;
    readonly penalty_ref?: string;
    readonly mapping_version?: string;
  } | null;
};

export type EnforcementFilters = {
  readonly q: string;
  readonly status: string;
  readonly range: number;
  readonly region: string;
  readonly violation: string;
};

export type EnforcementTone = "neutral" | "success" | "warning" | "danger";
