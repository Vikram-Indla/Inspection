export type RegulationClause = {
  readonly id: string;
  readonly clause_ref: string;
  readonly inspection_items: readonly { id: string; code: string; title: string }[] | null;
};

export type RegulationRow = {
  readonly entity_id: string;
  readonly target_legacy_id: string | null;
  readonly current_version_id: string | null;
  readonly version_number: number | null;
  readonly request_id: string | null;
  readonly code: string;
  readonly title: string;
  readonly issuing_authority: string | null;
  readonly operational_status: string;
  readonly version_label: string;
  readonly release_date: string | null;
  readonly published_at: string | null;
  readonly clauses_status: "verified" | "verified_unknown";
  readonly clauses: readonly RegulationClause[] | null;
};

export type ViolationCodeRow = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly level: string;
  readonly clause_id: string | null;
};

export type PenaltyMappingRow = {
  readonly id: string;
  readonly violation_code_id: string;
  readonly penalty_ref: string;
  readonly mapping_version: string;
};

export type AuditEventRow = {
  readonly id: number;
  readonly action: string;
  readonly occurred_at: string;
  readonly actor: string | null;
};

export type VersionRow = {
  readonly id: string;
  readonly version_number: number;
  readonly published_at: string | null;
  readonly request_id: string | null;
};

export type InspectionItemEntry = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly clauseRef: string;
};

export const LIBRARY_TABS = ["overview", "items", "violations", "penalties", "versions", "audit"] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];

export type LibraryScope = {
  readonly routeBase: string;
  readonly query: string;
  readonly rawQuery: string;
  readonly authority: string;
  readonly status: string;
  readonly selectedId: string;
  readonly tab: LibraryTab;
};

export type LibraryView = {
  readonly scope: LibraryScope;
  readonly rows: readonly RegulationRow[];
  readonly filtered: readonly RegulationRow[];
  readonly authorities: readonly string[];
  readonly statuses: readonly string[];
  readonly selected: RegulationRow | null;
  readonly clauseCount: number | null;
  readonly itemCount: number | null;
  readonly inspectionItems: readonly InspectionItemEntry[];
  readonly violationCodes: readonly ViolationCodeRow[];
  readonly penalties: readonly PenaltyMappingRow[];
  readonly auditEvents: readonly AuditEventRow[];
  readonly versions: readonly VersionRow[];
  readonly violationsUnavailable: boolean;
  readonly penaltiesUnavailable: boolean;
  readonly auditUnavailable: boolean;
  readonly versionsUnavailable: boolean;
  readonly readFailed: boolean;
  readonly correlationId: string | null;
};

export type RequestRow = {
  readonly id: string;
  readonly request_number: string;
  readonly title: string;
  readonly request_type: string;
  readonly owner_id: string;
  readonly submitted_at: string | null;
  readonly current_revision: number;
  readonly status: string;
  readonly correlation_id: string;
  readonly audit_references: unknown;
  readonly publication_audit_reference: number | null;
};

export type ComponentRow = {
  readonly id: string;
  readonly request_id: string;
  readonly revision_number: number;
  readonly entity_kind: string;
  readonly component_status: string;
  readonly target_entity_id: string | null;
  readonly current_value_snapshot: Record<string, unknown> | null;
  readonly proposed_value_snapshot: Record<string, unknown>;
  readonly component_comments: string | null;
  readonly decision_comments: string | null;
  readonly decided_by: string | null;
  readonly decided_at: string | null;
};

export type DependencyRow = {
  readonly parent_component_id: string;
  readonly child_component_id: string;
};

export type DecisionRow = {
  readonly id: string;
  readonly component_id: string | null;
  readonly decision: string;
  readonly comments: string | null;
  readonly decided_by: string;
  readonly decided_at: string;
};

export type PublicationRow = {
  readonly id: string;
  readonly component_id: string;
  readonly version_id: string;
  readonly published_at: string;
};

export const APPROVAL_STEPS = ["overview", "regulation", "inspection_item", "violation", "penalty", "summary"] as const;
export type ApprovalStep = (typeof APPROVAL_STEPS)[number];

export const DECIDED_STATUSES: ReadonlySet<string> = new Set(["approved", "rejected", "auto_rejected", "published"]);

export type ApprovalsScope = {
  readonly routeBase: string;
  readonly requestId: string | null;
  readonly step: ApprovalStep;
};

export type ApprovalsView = {
  readonly scope: ApprovalsScope;
  readonly signedIn: boolean;
  readonly rows: readonly RequestRow[];
  readonly components: readonly ComponentRow[];
  readonly selectedRequest: RequestRow | null;
  readonly selectedComponents: readonly ComponentRow[];
  readonly dependencies: readonly DependencyRow[];
  readonly decisions: readonly DecisionRow[];
  readonly publications: readonly PublicationRow[];
  readonly canReview: boolean;
  readonly readFailed: boolean;
  readonly selectedReadFailed: boolean;
  readonly allDecided: boolean;
  readonly publishable: boolean;
  readonly packageReviewable: boolean;
  readonly correlationId: string | null;
};
