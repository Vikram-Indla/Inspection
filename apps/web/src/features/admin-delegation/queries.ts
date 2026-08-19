import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { effectiveDelegationStatus } from "./strings";
import type { DelegationRow, DelegationView, DelegationViewKey, ScopeOption } from "./types";

const DELEGATION_SELECT = `
  id,delegator_id,delegate_id,scope,reason,starts_at,ends_at,status,created_at,revoked_at,revoked_reason,
  delegator:profiles!delegations_delegator_id_fkey(full_name,email),
  delegate:profiles!delegations_delegate_id_fkey(full_name,email)
`;

function roleTitle(relation: unknown): string | undefined {
  if (Array.isArray(relation)) return roleTitle(relation[0]);
  if (relation && typeof relation === "object" && "title" in relation) {
    const value = (relation as { title: unknown }).title;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export async function loadDelegation(view: DelegationViewKey): Promise<DelegationView> {
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getServerUser();
  if (!user || userError) throw new Error("admin_delegation_auth_unavailable");

  const [rolesRead, myProfile, delegationsRead] = await Promise.all([
    sb.from("user_roles").select("role_key, roles(title)").eq("user_id", user.id),
    sb.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    view === "new"
      ? Promise.resolve({ data: [] as DelegationRow[], error: null })
      : sb.from("delegations").select(DELEGATION_SELECT).order("created_at", { ascending: false }),
  ]);

  const availableScopes: ScopeOption[] = (rolesRead.data ?? []).map(row => ({
    key: row.role_key,
    title: roleTitle(row.roles) ?? row.role_key,
  }));

  const rawDelegations: unknown = delegationsRead.data ?? [];
  const rows = rawDelegations as DelegationRow[];
  const now = Date.now();

  return {
    activeRows: rows.filter(row => row.delegator_id === user.id && effectiveDelegationStatus(row, now) === "active"),
    receivedRows: rows.filter(row => row.delegate_id === user.id && effectiveDelegationStatus(row, now) === "active"),
    historyRows: rows,
    availableScopes,
    delegatorName: myProfile.data?.full_name ?? user.email ?? user.id,
    readFailed: Boolean(delegationsRead.error),
  };
}
