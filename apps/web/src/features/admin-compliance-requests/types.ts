import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type RequestListRow = {
  id: string;
  request_number: string;
  title: string;
  request_type: string;
  created_at: string;
  current_revision: number;
  status: string;
};

export type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  description: string | null;
  request_type: string;
  owner_id: string;
  created_at: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
  comments: string | null;
  return_reason: string | null;
  correlation_id: string;
  audit_references: unknown;
  publication_audit_reference: number | null;
};

export type Revision = {
  id: string;
  revision_number: number;
  created_by: string;
  created_at: string;
  submitted_at: string | null;
  comments: string | null;
  return_reason: string | null;
};

export type Component = {
  id: string;
  revision_number: number;
  entity_kind: string;
  target_entity_id: string | null;
  component_status: string;
  current_value_snapshot: Record<string, unknown> | null;
  proposed_value_snapshot: Record<string, unknown>;
  component_comments: string | null;
  decision_comments: string | null;
  decided_by: string | null;
  decided_at: string | null;
};

export type Dependency = {
  id: string;
  revision_number: number;
  parent_component_id: string;
  child_component_id: string;
};

export type Decision = {
  id: string;
  revision_number: number;
  component_id: string | null;
  decision: string;
  comments: string | null;
  decided_by: string;
  decided_at: string;
};

export type Publication = {
  id: string;
  revision_number: number;
  component_id: string;
  published_at: string;
  version_id: string;
};

const STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  draft: "neutral",
  pending_review: "pending",
  returned: "warning",
  partially_approved: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? "neutral";
}
