import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import type {
  Component, Decision, Dependency, Publication, RequestListRow, RequestRow, Revision,
} from "./types";

export type ComplianceRequestsListData = {
  rows: readonly RequestListRow[];
  canCreate: boolean;
  readFailed: boolean;
};

export async function loadComplianceRequests(): Promise<ComplianceRequestsListData> {
  const sb = await supabaseServer();
  const [{ data, error }, roleRead] = await Promise.all([
    sb.from("compliance_configuration_requests")
      .select("id,request_number,title,request_type,created_at,current_revision,status")
      .order("created_at", { ascending: false }),
    sb.from("user_roles").select("role_key"),
  ]);

  return {
    rows: (data ?? []) as RequestListRow[],
    canCreate: !roleRead.error && (roleRead.data ?? []).some(row => row.role_key === "admin"),
    readFailed: Boolean(error),
  };
}

export type ComplianceRequestDetail = {
  userId: string | null;
  request: RequestRow;
  revisions: readonly Revision[];
  components: readonly Component[];
  dependencies: readonly Dependency[];
  decisions: readonly Decision[];
  publications: readonly Publication[];
  isOwner: boolean;
  canWrite: boolean;
  canReview: boolean;
  editable: boolean;
  reviewable: boolean;
  publishable: boolean;
};

export type ComplianceRequestResult =
  | { status: "ok"; detail: ComplianceRequestDetail }
  | { status: "not-found" }
  | { status: "read-failed" };

export async function loadComplianceRequest(id: string): Promise<ComplianceRequestResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const [requestRead, revisionRead, componentRead, dependencyRead, decisionRead, publicationRead, roleRead] = await Promise.all([
    sb.from("compliance_configuration_requests").select("id,request_number,title,description,request_type,owner_id,created_at,submitted_at,current_revision,status,comments,return_reason,correlation_id,audit_references,publication_audit_reference").eq("id", id).maybeSingle(),
    sb.from("compliance_request_revisions").select("id,revision_number,created_by,created_at,submitted_at,comments,return_reason").eq("request_id", id).order("revision_number", { ascending: false }),
    sb.from("compliance_request_components").select("id,revision_number,entity_kind,target_entity_id,component_status,current_value_snapshot,proposed_value_snapshot,component_comments,decision_comments,decided_by,decided_at").eq("request_id", id).order("created_at"),
    sb.from("compliance_request_component_dependencies").select("id,revision_number,parent_component_id,child_component_id").eq("request_id", id),
    sb.from("compliance_request_decisions").select("id,revision_number,component_id,decision,comments,decided_by,decided_at").eq("request_id", id).order("decided_at", { ascending: false }),
    sb.from("compliance_request_publications").select("id,revision_number,component_id,published_at,version_id").eq("request_id", id).order("published_at", { ascending: false }),
    user ? sb.from("user_roles").select("role_key").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
  ]);

  const readFailed = [requestRead.error, revisionRead.error, componentRead.error, dependencyRead.error, decisionRead.error, publicationRead.error, roleRead.error].some(Boolean);
  if (readFailed) return { status: "read-failed" };

  const request = requestRead.data as RequestRow | null;
  if (!request) return { status: "not-found" };

  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const isOwner = Boolean(user) && request.owner_id === user?.id;
  const canWrite = roles.has("admin");
  const canReview = Boolean(user) && (roles.has("admin") || roles.has("supervisor")) && !isOwner;

  return {
    status: "ok",
    detail: {
      userId: user?.id ?? null,
      request,
      revisions: (revisionRead.data ?? []) as Revision[],
      components: (componentRead.data ?? []) as Component[],
      dependencies: (dependencyRead.data ?? []) as Dependency[],
      decisions: (decisionRead.data ?? []) as Decision[],
      publications: (publicationRead.data ?? []) as Publication[],
      isOwner,
      canWrite,
      canReview,
      editable: isOwner && canWrite && request.status === "draft",
      reviewable: canReview && ["pending_review", "partially_approved"].includes(request.status),
      publishable: canReview && ["approved", "partially_approved"].includes(request.status),
    },
  };
}
