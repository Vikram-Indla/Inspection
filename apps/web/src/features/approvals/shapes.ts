import type { Shape } from "@/lib/postgrest/shape";
import type {
  ApprovalComponentRow, ApprovalDecisionRow, ApprovalDependencyRow,
  ApprovalPublicationRow, ApprovalRequestRow, ApprovalRevisionRow,
} from "./queries";

export const approvalRequestRow: Shape<ApprovalRequestRow> = f => ({
  id: f.text("id"),
  request_number: f.text("request_number"),
  title: f.text("title"),
  description: f.optionalText("description"),
  request_type: f.text("request_type"),
  owner_id: f.text("owner_id"),
  submitted_at: f.optionalText("submitted_at"),
  current_revision: f.number("current_revision"),
  status: f.text("status"),
  correlation_id: f.text("correlation_id"),
  audit_references: f.raw("audit_references"),
  publication_audit_reference: f.optionalNumber("publication_audit_reference"),
});

export const approvalComponentRow: Shape<ApprovalComponentRow> = f => ({
  id: f.text("id"),
  request_id: f.text("request_id"),
  revision_number: f.number("revision_number"),
  entity_kind: f.text("entity_kind"),
  component_status: f.text("component_status"),
  target_entity_id: f.optionalText("target_entity_id"),
  current_value_snapshot: f.optionalRecord("current_value_snapshot"),
  proposed_value_snapshot: f.optionalRecord("proposed_value_snapshot") ?? {},
  component_comments: f.optionalText("component_comments"),
  decision_comments: f.optionalText("decision_comments"),
  decided_at: f.optionalText("decided_at"),
});

export const approvalDependencyRow: Shape<ApprovalDependencyRow> = f => ({
  parent_component_id: f.text("parent_component_id"),
  child_component_id: f.text("child_component_id"),
});

export const approvalDecisionRow: Shape<ApprovalDecisionRow> = f => ({
  id: f.text("id"),
  component_id: f.optionalText("component_id"),
  decision: f.text("decision"),
  comments: f.optionalText("comments"),
  decided_by: f.text("decided_by"),
  decided_at: f.text("decided_at"),
});

export const approvalPublicationRow: Shape<ApprovalPublicationRow> = f => ({
  id: f.text("id"),
  component_id: f.text("component_id"),
  version_id: f.text("version_id"),
  published_at: f.text("published_at"),
});

export const approvalRevisionRow: Shape<ApprovalRevisionRow> = f => ({
  revision_number: f.number("revision_number"),
  created_at: f.text("created_at"),
  submitted_at: f.optionalText("submitted_at"),
  created_by: f.text("created_by"),
  return_reason: f.optionalText("return_reason"),
});
