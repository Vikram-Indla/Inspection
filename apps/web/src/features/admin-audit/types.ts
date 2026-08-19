import type { ExpectedAuditEvent, ReplayEvent } from "@/lib/audit-replay";

export const AUDIT_MODES = ["recorder", "reconstruct", "compare", "ledger", "custody", "print"] as const;
export type AuditMode = typeof AUDIT_MODES[number];

export type AuditParams = {
  caseRef: string;
  query: string;
  mode: AuditMode;
  at: string | null;
  vs: string | null;
};

export type GenericRow = {
  id: number; actor: string | null; object_type: string; object_id: string | null;
  action: string; before_state: unknown; after_state: unknown; occurred_at: string;
};

export type SemanticRow = {
  id: string; event_type: string; occurred_at: string; recorded_at: string;
  actor_id: string | null; aggregate_type: string; aggregate_id: string | null;
  correlation_id: string; causation_id: string | null; before_state: unknown;
  after_state: unknown; semantic_payload: unknown; integrity_status: string;
  chain_status: string; ingestion_status: string; case_ref: string;
};

export type AuditView = {
  authorized: boolean;
  partialScope: boolean;
  semanticUnavailable: boolean;
  sourceError: boolean;
  sourceErrorMessage: string;
  historyTruncated: boolean;
  ontologyLoaded: boolean;
  roles: readonly string[];
  events: readonly ReplayEvent[];
  expected: readonly ExpectedAuditEvent[];
};
