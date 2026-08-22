import { getVerifiedUser } from "@/lib/verified-user";
import type { supabaseServer } from "@/lib/supabase-server";

type Client = Awaited<ReturnType<typeof supabaseServer>>;

export type RequestRow = {
  id: string; request_number: string; title: string; owner_id: string;
  submitted_at: string | null; current_revision: number; status: string;
};
export type ComponentRow = { request_id: string; revision_number: number; entity_kind: string };
export type AuditRow = { id: number; actor: string | null; object_id: string | null; action: string; occurred_at: string | null };

export type AdminHomeRead = {
  roleError: boolean;
  canReview: boolean;
  canAudit: boolean;
  requests: readonly RequestRow[];
  requestsError: boolean;
  components: readonly ComponentRow[];
  componentsError: boolean;
  audit: readonly AuditRow[];
  auditError: boolean;
  names: Readonly<Record<string, string>>;
  requestRefs: Readonly<Record<string, string>>;
};

export async function loadAdminHome(sb: Client): Promise<AdminHomeRead> {
  const { data: { user } } = await getVerifiedUser(sb);
  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const canReview = !roleRead.error && Boolean(user);
  const canAudit = !roleRead.error && Boolean(user);

  const requestRead = canReview && user
    ? await sb.from("compliance_configuration_requests")
      .select("id,request_number,title,owner_id,submitted_at,current_revision,status")
      .in("status", ["pending_review", "partially_approved", "approved"])
      .neq("owner_id", user.id)
      .order("submitted_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(8)
    : { data: [] as RequestRow[], error: null };
  const requests = (requestRead.data ?? []) as RequestRow[];
  const requestIds = requests.map(row => row.id);

  const componentRead = requestIds.length
    ? await sb.from("compliance_request_components")
      .select("request_id,revision_number,entity_kind")
      .in("request_id", requestIds)
    : { data: [] as ComponentRow[], error: null };

  const auditRead = canAudit
    ? await sb.from("audit_events")
      .select("id,actor,object_id,action,occurred_at")
      .eq("object_type", "compliance_configuration_request")
      .eq("action", "CCR_PUBLISHED")
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(8)
    : { data: [] as AuditRow[], error: null };

  const audit = (auditRead.data ?? []) as AuditRow[];

  const userIds = Array.from(new Set<string>([
    ...requests.map(row => row.owner_id),
    ...audit.map(row => row.actor).filter((value): value is string => Boolean(value)),
  ]));
  const nameRead = userIds.length
    ? await sb.rpc("display_names", { p_user_ids: userIds })
    : { data: [] as { user_id: string; full_name: string | null }[] };
  const names: Record<string, string> = {};
  for (const row of nameRead.data ?? []) {
    if (row?.full_name) names[row.user_id] = row.full_name;
  }

  const objectIds = Array.from(new Set<string>(
    audit.map(row => row.object_id).filter((value): value is string => Boolean(value)),
  ));
  const refRead = objectIds.length
    ? await sb.from("compliance_configuration_requests").select("id, request_number").in("id", objectIds)
    : { data: [] as { id: string; request_number: string }[] };
  const requestRefs: Record<string, string> = {};
  for (const row of refRead.data ?? []) requestRefs[row.id] = row.request_number;

  return {
    roleError: Boolean(roleRead.error),
    canReview,
    canAudit,
    requests,
    requestsError: Boolean(requestRead.error),
    components: (componentRead.data ?? []) as ComponentRow[],
    componentsError: Boolean(componentRead.error),
    audit,
    auditError: Boolean(auditRead.error),
    names,
    requestRefs,
  };
}
