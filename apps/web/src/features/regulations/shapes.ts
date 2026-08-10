import type { Shape } from "@/lib/postgrest/shape";
import type { RegulationClause, RegulationLibraryRow } from "./queries";
import type {
  WorkspaceItem, WorkspacePenalty, WorkspaceRegulation, WorkspaceVersion, WorkspaceViolation,
} from "./workspace-source";
import type { RecordAttachment, RecordClause, RecordRegulation } from "./record-source";

function verificationStatus(value: string): "verified" | "verified_unknown" {
  return value === "verified" ? "verified" : "verified_unknown";
}

const libraryClause: Shape<RegulationClause> = f => ({
  id: f.text("id"),
  clause_ref: f.optionalText("clause_ref"),
  title: f.optionalText("title"),
  inspection_items: f.optionalToMany("inspection_items", item => ({
    id: item.text("id"),
    code: item.optionalText("code"),
  })),
});

export const regulationLibraryRow: Shape<RegulationLibraryRow> = f => ({
  entity_id: f.text("entity_id"),
  code: f.optionalText("code"),
  title: f.optionalText("title"),
  issuing_authority: f.optionalText("issuing_authority"),
  version_label: f.optionalText("version_label"),
  operational_status: f.text("operational_status"),
  release_date: f.optionalText("release_date"),
  published_at: f.optionalText("published_at"),
  clauses: f.optionalToMany("clauses", libraryClause),
  clauses_status: verificationStatus(f.text("clauses_status")),
});

export const workspaceRegulationRow: Shape<WorkspaceRegulation> = f => ({
  entity_id: f.text("entity_id"),
  current_version_id: f.optionalText("current_version_id"),
  version_number: f.optionalNumber("version_number"),
  request_id: f.optionalText("request_id"),
  code: f.optionalText("code"),
  title: f.optionalText("title"),
  issuing_authority: f.optionalText("issuing_authority"),
  operational_status: f.text("operational_status"),
  version_label: f.optionalText("version_label"),
  release_date: f.optionalText("release_date"),
  published_at: f.optionalText("published_at"),
  clauses_status: verificationStatus(f.text("clauses_status")),
  clauses: f.optionalToMany("clauses", clause => ({
    id: clause.text("id"),
    clause_ref: clause.optionalText("clause_ref"),
    legal_source: clause.optionalText("legal_source"),
  })),
});

export const workspaceViolationRow: Shape<WorkspaceViolation> = f => ({
  id: f.text("id"),
  code: f.text("code"),
  title: f.text("title"),
  level: f.text("level"),
  status: f.text("status"),
  category: f.optionalText("category"),
  applicability: f.optionalText("applicability"),
  corrective_action: f.optionalText("corrective_action"),
  grace_period_days: f.optionalNumber("grace_period_days"),
});

export const workspacePenaltyRow: Shape<WorkspacePenalty> = f => ({
  id: f.text("id"),
  violation_code_id: f.text("violation_code_id"),
  penalty_ref: f.text("penalty_ref"),
  penalty_type: f.optionalText("penalty_type"),
  amount: f.optionalNumber("amount"),
  grace_period_days: f.optionalNumber("grace_period_days"),
  due_period_days: f.optionalNumber("due_period_days"),
  legal_basis: f.optionalText("legal_basis"),
  mapping_version: f.text("mapping_version"),
  status: f.text("status"),
});

export const workspaceVersionRow: Shape<WorkspaceVersion> = f => ({
  id: f.text("id"),
  version_number: f.number("version_number"),
  published_at: f.optionalText("published_at"),
  request_id: f.optionalText("request_id"),
});

export const workspaceItemRow: Shape<Omit<WorkspaceItem, "clauseRef"> & { clause_id: string }> = f => ({
  id: f.text("id"),
  code: f.text("code"),
  title: f.text("title"),
  clause_id: f.text("clause_id"),
  active: f.flag("active"),
  response_model: f.toOne("response_model", model => ({
    responses: model.optionalTextList("responses") ?? undefined,
    mapping: mappingOf(model.optionalRecord("mapping")),
    requirement: model.optionalText("requirement") ?? undefined,
  })),
  evidence_rule: f.toOne("evidence_rule", rule => ({
    on: rule.optionalText("on") ?? undefined,
    type: rule.optionalText("type") ?? undefined,
    min: rule.optionalNumber("min") ?? undefined,
    mandatory: rule.optionalFlag("mandatory") ?? undefined,
  })),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mappingOf(
  raw: Record<string, unknown> | null,
): Record<string, { result?: string; violation?: string; action_form?: string }> | undefined {
  if (!raw) return undefined;
  const text = (value: unknown) => typeof value === "string" ? value : undefined;
  return Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => isRecord(value)
    ? [[key, {
        result: text(value.result),
        violation: text(value.violation),
        action_form: text(value.action_form),
      }] as const]
    : []));
}

export const recordClauseRow: Shape<RecordClause> = f => ({
  id: f.text("id"),
  clause_ref: f.optionalText("clause_ref"),
  title: f.optionalText("title"),
  applicability: f.optionalText("applicability"),
  legal_source: f.optionalText("legal_source"),
  inspection_items: f.optionalToMany("inspection_items", item => ({
    id: item.text("id"),
    code: item.text("code"),
  })),
});

export const recordRegulationRow: Shape<
  RecordRegulation & {
    clauses: RecordClause[] | null;
    attachments: Omit<RecordAttachment, "signedUrl">[] | null;
  }
> = f => ({
  entity_id: f.text("entity_id"),
  code: f.optionalText("code"),
  title: f.optionalText("title"),
  issuing_authority: f.optionalText("issuing_authority"),
  version_label: f.optionalText("version_label"),
  operational_status: f.text("operational_status"),
  release_date: f.optionalText("release_date"),
  deactivation_reason: f.optionalText("deactivation_reason"),
  clauses_status: verificationStatus(f.text("clauses_status")),
  attachments_status: verificationStatus(f.text("attachments_status")),
  clauses: f.optionalToMany("clauses", recordClauseRow),
  attachments: f.optionalToMany("attachments", attachment => ({
    id: attachment.text("id"),
    file_name: attachment.text("file_name"),
    storage_path: attachment.text("storage_path"),
    media_type: attachment.optionalText("media_type"),
    sha256: attachment.optionalText("sha256"),
  })),
});
