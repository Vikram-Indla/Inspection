import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { VIEW_STATUSES, type ApprovalScope } from "./params";

export type ApprovalRequestRow = {
  id: string;
  request_number: string;
  title: string;
  description: string | null;
  request_type: string;
  owner_id: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
  correlation_id: string;
  audit_references: unknown;
  publication_audit_reference: number | null;
};

export type ApprovalComponentRow = {
  id: string;
  request_id: string;
  revision_number: number;
  entity_kind: string;
  component_status: string;
  target_entity_id: string | null;
  current_value_snapshot: Record<string, unknown> | null;
  proposed_value_snapshot: Record<string, unknown>;
  component_comments: string | null;
  decision_comments: string | null;
  decided_at: string | null;
};

export type ApprovalDependencyRow = { parent_component_id: string; child_component_id: string };
export type ApprovalDecisionRow = {
  id: string; component_id: string | null; decision: string;
  comments: string | null; decided_by: string; decided_at: string;
};
export type ApprovalPublicationRow = { id: string; component_id: string; version_id: string; published_at: string };
export type ApprovalRevisionRow = {
  revision_number: number; created_at: string; submitted_at: string | null;
  created_by: string; return_reason: string | null;
};

export type ApprovalAccess =
  | { readonly kind: "signed-out" }
  | { readonly kind: "reviewer" }
  | { readonly kind: "observer" };

export type ApprovalQueue = {
  readonly access: ApprovalAccess;
  readonly requests: readonly ApprovalRequestRow[];
  readonly components: readonly ApprovalComponentRow[];
  readonly names: ReadonlyMap<string, string>;
  readonly namesReadable: boolean;
  readonly queueReadable: boolean;
};

export type ApprovalDetail = {
  readonly dependencies: readonly ApprovalDependencyRow[];
  readonly decisions: readonly ApprovalDecisionRow[];
  readonly publications: readonly ApprovalPublicationRow[];
  readonly revisions: readonly ApprovalRevisionRow[];
  readonly detailReadable: boolean;
};

const REVIEWER_ROLES = ["admin", "supervisor"];
const OPEN_STATUSES = ["pending_review", "partially_approved", "approved"];

const REQUEST_COLUMNS =
  "id,request_number,title,description,request_type,owner_id,submitted_at,current_revision,status,correlation_id,audit_references,publication_audit_reference";
const COMPONENT_COLUMNS =
  "id,request_id,revision_number,entity_kind,component_status,target_entity_id,current_value_snapshot,proposed_value_snapshot,component_comments,decision_comments,decided_at";

/**
 * The reviewer's queue.
 *
 * Maker-checker is enforced in the database, and mirrored here by dropping the
 * reviewer's own requests — showing them only to have every action refused
 * would be a worse experience than not listing them.
 *
 * `profiles` is readable by security_admin / ops / planner / supervisor, but
 * this queue also admits `admin`. A plain admin therefore gets an empty name
 * read, which `namesReadable` reports so a missing name never renders as an
 * anonymous blank.
 */
export async function queryApprovalQueue(scope: ApprovalScope): Promise<ApprovalQueue> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  if (!user) {
    return { access: { kind: "signed-out" }, requests: [], components: [], names: new Map(), namesReadable: false, queueReadable: false };
  }

  const statuses = scope.view ? VIEW_STATUSES[scope.view] : OPEN_STATUSES;
  const [requestRead, roleRead] = await Promise.all([
    sb.from("compliance_configuration_requests").select(REQUEST_COLUMNS)
      .in("status", statuses).order("submitted_at", { ascending: true }),
    sb.from("user_roles").select("role_key").eq("user_id", user.id),
  ]);

  if (requestRead.error) console.error(`[approvals.queue] request read failed: ${requestRead.error.message}`);

  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const access: ApprovalAccess = REVIEWER_ROLES.some(role => roles.has(role))
    ? { kind: "reviewer" }
    : { kind: "observer" };

  const requests = ((requestRead.data ?? []) as unknown as ApprovalRequestRow[])
    .filter(row => row.owner_id !== user.id);
  const requestIds = requests.map(row => row.id);

  const [componentRead, profileRead] = await Promise.all([
    requestIds.length
      ? sb.from("compliance_request_components").select(COMPONENT_COLUMNS).in("request_id", requestIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? sb.from("profiles").select("user_id, full_name").in("user_id", [...new Set(requests.map(row => row.owner_id))])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (componentRead.error) console.error(`[approvals.queue] component read failed: ${componentRead.error.message}`);

  const profiles = (profileRead.data ?? []) as { user_id: string; full_name: string | null }[];
  return {
    access,
    requests,
    components: (componentRead.data ?? []) as unknown as ApprovalComponentRow[],
    names: new Map(profiles.filter(row => row.full_name).map(row => [row.user_id, row.full_name ?? ""])),
    namesReadable: !profileRead.error && profiles.length > 0,
    queueReadable: !requestRead.error && !componentRead.error,
  };
}

/**
 * Dependencies, decisions, publications and the revision history for the
 * selected request. The revision rows are what let the timeline show submission
 * and return, which the decision log alone cannot.
 */
export async function queryApprovalDetail(requestId: string, revision: number): Promise<ApprovalDetail> {
  const sb = await supabaseServer();
  const [dependencyRead, decisionRead, publicationRead, revisionRead] = await Promise.all([
    sb.from("compliance_request_component_dependencies").select("parent_component_id,child_component_id")
      .eq("request_id", requestId).eq("revision_number", revision),
    sb.from("compliance_request_decisions").select("id,component_id,decision,comments,decided_by,decided_at")
      .eq("request_id", requestId).eq("revision_number", revision).order("decided_at", { ascending: false }),
    sb.from("compliance_request_publications").select("id,component_id,version_id,published_at")
      .eq("request_id", requestId).eq("revision_number", revision).order("published_at", { ascending: false }),
    sb.from("compliance_request_revisions").select("revision_number,created_at,submitted_at,created_by,return_reason")
      .eq("request_id", requestId).order("revision_number", { ascending: false }),
  ]);

  const failed = dependencyRead.error ?? decisionRead.error ?? publicationRead.error ?? revisionRead.error;
  if (failed) console.error(`[approvals.detail] read failed: ${failed.message}`);

  return {
    dependencies: (dependencyRead.data ?? []) as unknown as ApprovalDependencyRow[],
    decisions: (decisionRead.data ?? []) as unknown as ApprovalDecisionRow[],
    publications: (publicationRead.data ?? []) as unknown as ApprovalPublicationRow[],
    revisions: (revisionRead.data ?? []) as unknown as ApprovalRevisionRow[],
    detailReadable: !failed,
  };
}
