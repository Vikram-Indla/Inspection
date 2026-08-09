import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import {
  DECIDED_STATUSES,
  type ApprovalsScope,
  type ApprovalsView,
  type AuditEventRow,
  type ComponentRow,
  type DecisionRow,
  type DependencyRow,
  type InspectionItemEntry,
  type LibraryScope,
  type LibraryView,
  type PenaltyMappingRow,
  type PublicationRow,
  type RegulationClause,
  type RegulationRow,
  type RequestRow,
  type VersionRow,
  type ViolationCodeRow,
} from "./types";

const REGULATION_COLUMNS =
  "entity_id,target_legacy_id,current_version_id,version_number,request_id,code,title,issuing_authority,operational_status,version_label,release_date,published_at,clauses,clauses_status";

const REQUEST_COLUMNS =
  "id,request_number,title,request_type,owner_id,submitted_at,current_revision,status,correlation_id,audit_references,publication_audit_reference";

const COMPONENT_COLUMNS =
  "id,request_id,revision_number,entity_kind,component_status,target_entity_id,current_value_snapshot,proposed_value_snapshot,component_comments,decision_comments,decided_by,decided_at";

export function verifiedClauses(row: RegulationRow | null): readonly RegulationClause[] | null {
  if (!row || row.clauses_status !== "verified" || !Array.isArray(row.clauses)) return null;
  return row.clauses;
}

export function regulationItemCount(row: RegulationRow): number | null {
  const clauses = verifiedClauses(row);
  if (!clauses || !clauses.every(clause => Array.isArray(clause.inspection_items))) return null;
  return clauses.reduce((total, clause) => total + (clause.inspection_items ?? []).length, 0);
}

export async function getLibraryView(scope: LibraryScope): Promise<LibraryView> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from("compliance_regulation_library")
    .select(REGULATION_COLUMNS)
    .order("title");
  const correlationId = error ? crypto.randomUUID() : null;
  if (error) console.error(`[compliance-library:${correlationId}]`, error.message, error.code);
  const rows = (data ?? []) as unknown as RegulationRow[];
  const authorities = Array.from(new Set(rows.map(row => row.issuing_authority ?? "Other"))).sort();
  const statuses = Array.from(new Set(rows.map(row => row.operational_status))).sort();
  const filtered = rows.filter(row => {
    const matchesAuthority = !scope.authority || (row.issuing_authority ?? "Other") === scope.authority;
    const matchesStatus = !scope.status || row.operational_status === scope.status;
    const haystack = `${row.code} ${row.title} ${row.issuing_authority ?? ""}`.toLowerCase();
    return matchesAuthority && matchesStatus && (!scope.query || haystack.includes(scope.query));
  }).sort((a, b) => a.title.localeCompare(b.title) || a.code.localeCompare(b.code));
  const selected = rows.find(row => row.entity_id === scope.selectedId) ?? filtered[0] ?? null;
  const clauses = verifiedClauses(selected);
  const clauseIds = (clauses ?? []).map(clause => clause.id);
  const [violationRead, auditRead, versionRead] = selected ? await Promise.all([
    clauses && clauseIds.length
      ? sb.from("violation_codes").select("id,code,title,level,clause_id").in("clause_id", clauseIds)
      : Promise.resolve({ data: [] as ViolationCodeRow[], error: clauses ? null : { message: "CLAUSES_UNAVAILABLE" } }),
    sb.rpc("compliance_regulation_audit", { p_entity_id: selected.entity_id }),
    sb.from("compliance_entity_versions")
      .select("id,version_number,published_at,request_id")
      .eq("entity_kind", "regulation")
      .eq("entity_id", selected.entity_id)
      .order("version_number", { ascending: false }),
  ]) : [
    { data: [] as ViolationCodeRow[], error: null },
    { data: [] as AuditEventRow[], error: null },
    { data: [] as VersionRow[], error: null },
  ];
  const violationCodes = (violationRead.data ?? []) as unknown as ViolationCodeRow[];
  const violationCodeIds = violationCodes.map(violation => violation.id);
  const penaltyRead = violationCodeIds.length
    ? await sb.from("penalty_mappings").select("id,violation_code_id,penalty_ref,mapping_version").in("violation_code_id", violationCodeIds)
    : { data: [] as PenaltyMappingRow[], error: null };
  const canonicalVersions = (versionRead.data ?? []) as unknown as VersionRow[];
  const versions = !versionRead.error && canonicalVersions.length === 0 && selected?.version_number
    ? [{
        id: selected.current_version_id ?? selected.entity_id,
        version_number: selected.version_number,
        published_at: selected.published_at,
        request_id: selected.request_id,
      }]
    : canonicalVersions;
  const inspectionItems: InspectionItemEntry[] = (clauses ?? []).flatMap(clause =>
    (clause.inspection_items ?? []).map(item => ({ ...item, clauseRef: clause.clause_ref })));
  const violationsUnavailable = !!violationRead.error;
  return {
    scope,
    rows,
    filtered,
    authorities,
    statuses,
    selected,
    clauseCount: clauses ? clauses.length : null,
    itemCount: selected ? regulationItemCount(selected) : null,
    inspectionItems,
    violationCodes,
    penalties: (penaltyRead.data ?? []) as unknown as PenaltyMappingRow[],
    auditEvents: (auditRead.data ?? []) as unknown as AuditEventRow[],
    versions,
    violationsUnavailable,
    penaltiesUnavailable: violationsUnavailable || !!penaltyRead.error,
    auditUnavailable: !!auditRead.error,
    versionsUnavailable: !!versionRead.error,
    readFailed: !!error,
    correlationId,
  };
}

export async function getApprovalsView(scope: ApprovalsScope): Promise<ApprovalsView> {
  const sb = await supabaseServer();
  const userRead = await getServerUser();
  const user = userRead.data.user;
  const [requestRead, roleRead] = user
    ? await Promise.all([
        sb.from("compliance_configuration_requests")
          .select(REQUEST_COLUMNS)
          .in("status", ["pending_review", "partially_approved", "approved"])
          .order("submitted_at", { ascending: true }),
        sb.from("user_roles").select("role_key").eq("user_id", user.id),
      ])
    : [{ data: [], error: userRead.error ?? new Error("approval_queue_unauthorized") }, { data: [], error: null }];
  const scopedRows = (requestRead.data ?? []) as RequestRow[];
  const rows = user ? scopedRows.filter(row => row.owner_id !== user.id) : [];
  const requestIds = rows.map(row => row.id);
  const componentRead = requestIds.length
    ? await sb.from("compliance_request_components").select(COMPONENT_COLUMNS).in("request_id", requestIds)
    : { data: [], error: null };
  const components = (componentRead.data ?? []) as ComponentRow[];
  const selectedRequest = rows.find(row => row.id === scope.requestId) ?? rows[0] ?? null;
  const selectedComponents = selectedRequest
    ? components.filter(component =>
        component.request_id === selectedRequest.id
        && component.revision_number === selectedRequest.current_revision)
    : [];
  const [dependencyRead, decisionRead, publicationRead] = selectedRequest
    ? await Promise.all([
        sb.from("compliance_request_component_dependencies")
          .select("parent_component_id,child_component_id")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision),
        sb.from("compliance_request_decisions")
          .select("id,component_id,decision,comments,decided_by,decided_at")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision)
          .order("decided_at", { ascending: false }),
        sb.from("compliance_request_publications")
          .select("id,component_id,version_id,published_at")
          .eq("request_id", selectedRequest.id)
          .eq("revision_number", selectedRequest.current_revision)
          .order("published_at", { ascending: false }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const canReview = !!user
    && !!selectedRequest
    && selectedRequest.owner_id !== user.id
    && (roles.has("admin") || roles.has("supervisor"));
  const readError = requestRead.error ?? roleRead.error ?? componentRead.error;
  const selectedReadError = dependencyRead.error ?? decisionRead.error ?? publicationRead.error;
  const allDecided = selectedComponents.length > 0
    && selectedComponents.every(component => DECIDED_STATUSES.has(component.component_status));
  const correlationId = readError ? crypto.randomUUID() : null;
  if (readError) console.error(`[compliance-approval-queue:${correlationId}]`, readError.message);
  return {
    scope,
    signedIn: !!user,
    rows,
    components,
    selectedRequest,
    selectedComponents,
    dependencies: (dependencyRead.data ?? []) as DependencyRow[],
    decisions: (decisionRead.data ?? []) as DecisionRow[],
    publications: (publicationRead.data ?? []) as PublicationRow[],
    canReview,
    readFailed: !!readError,
    selectedReadFailed: !!selectedReadError,
    allDecided,
    publishable: canReview && !readError && !selectedReadError && allDecided
      && !!selectedRequest && ["approved", "partially_approved"].includes(selectedRequest.status),
    packageReviewable: canReview && !readError && !selectedReadError
      && !!selectedRequest && ["pending_review", "partially_approved"].includes(selectedRequest.status),
    correlationId,
  };
}
