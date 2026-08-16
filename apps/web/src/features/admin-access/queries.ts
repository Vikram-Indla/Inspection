import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";
import {
  buildUserAccess,
  type ProfileRow,
  type RoleRow,
  type UserAccess,
} from "./view";

export type CapabilityRow = { capability_key: string; description: string };
export type PermissionRow = { permission_key: string; title: string; description: string };
export type RolePermissionRow = { role_key: string; permission_key: string; granted_at: string };

export type AdminAccessData = {
  readonly currentUserId: string | null;
  readonly profiles: readonly ProfileRow[];
  readonly roles: readonly RoleRow[];
  readonly access: readonly UserAccess[];
  readonly capabilities: readonly CapabilityRow[];
  readonly permissions: readonly PermissionRow[];
  readonly rolePermissions: readonly RolePermissionRow[];
  readonly canManage: boolean;
  readonly canManageRoleCaps: boolean;
  readonly rosterUnavailable: boolean;
  readonly rolesUnavailable: boolean;
  readonly permissionCheckUnavailable: boolean;
  readonly manageSourcesUnavailable: boolean;
  readonly roleCapSourcesUnavailable: boolean;
};

export async function loadAdminAccess(): Promise<AdminAccessData> {
  const sb = await supabaseServer();
  const [profilesRead, rolesRead, { data: { user } }] = await Promise.all([
    sb.from("profiles")
      .select("user_id, full_name, email, region, user_roles!user_roles_user_id_fkey(role_key)")
      .order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
    getVerifiedUser(sb),
  ]);
  if (profilesRead.error) logProviderError("admin access profiles read", profilesRead.error);
  if (rolesRead.error) logProviderError("admin access roles read", rolesRead.error);

  const canonical = user
    ? await sb.rpc("has_internal_role", { p_role: "admin" })
    : { data: false, error: null };
  if (canonical.error) logProviderError("admin access canonical-admin gate", canonical.error);

  const accessCapability = user
    ? await sb.rpc("has_planning_capability", { p_capability: "admin.access.manage" })
    : { data: false, error: null };
  if (accessCapability.error) logProviderError("admin access admin.access.manage gate", accessCapability.error);

  const canManage = canonical.data === true;
  const canManageRoleCaps = accessCapability.data === true;
  const profiles = (profilesRead.data ?? []) as ProfileRow[];
  const roles = (rolesRead.data ?? []) as RoleRow[];

  const managed = canManage ? await loadManagedAccess(sb, profiles) : EMPTY_MANAGED;
  const roleCaps = canManageRoleCaps ? await loadRolePermissions(sb) : EMPTY_ROLE_CAPS;

  return {
    currentUserId: user?.id ?? null,
    profiles,
    roles,
    access: managed.access,
    capabilities: managed.capabilities,
    permissions: roleCaps.permissions,
    rolePermissions: roleCaps.rolePermissions,
    canManage,
    canManageRoleCaps,
    rosterUnavailable: !!profilesRead.error,
    rolesUnavailable: !!rolesRead.error,
    permissionCheckUnavailable: !!canonical.error || !!accessCapability.error,
    manageSourcesUnavailable: managed.unavailable,
    roleCapSourcesUnavailable: roleCaps.unavailable,
  };
}

type AccessClient = Awaited<ReturnType<typeof supabaseServer>>;

const EMPTY_MANAGED = {
  access: [] as readonly UserAccess[],
  capabilities: [] as readonly CapabilityRow[],
  unavailable: false,
};

const EMPTY_ROLE_CAPS = {
  permissions: [] as readonly PermissionRow[],
  rolePermissions: [] as readonly RolePermissionRow[],
  unavailable: false,
};

async function loadManagedAccess(sb: AccessClient, profiles: readonly ProfileRow[]) {
  const [userRoles, capabilityGrants, roleCapabilities, capabilities] = await Promise.all([
    sb.from("user_roles").select("user_id, role_key, granted_at"),
    sb.from("user_capability_grants").select("user_id, capability_key, granted_at"),
    sb.from("role_capabilities").select("role_key, capability_key"),
    sb.from("capabilities").select("capability_key, description").order("capability_key"),
  ]);

  const reads = [
    ["user_roles", userRoles],
    ["user_capability_grants", capabilityGrants],
    ["role_capabilities", roleCapabilities],
    ["capabilities", capabilities],
  ] as const;
  for (const [scope, read] of reads) {
    if (read.error) logProviderError(`admin access ${scope} read`, read.error);
  }

  return {
    access: buildUserAccess(
      profiles,
      userRoles.data ?? [],
      capabilityGrants.data ?? [],
      roleCapabilities.data ?? [],
    ),
    capabilities: (capabilities.data ?? []) as CapabilityRow[],
    unavailable: reads.some(([, read]) => !!read.error),
  };
}

async function loadRolePermissions(sb: AccessClient) {
  const [permissions, grants] = await Promise.all([
    sb.from("permissions").select("permission_key, title, description").order("permission_key"),
    sb.from("role_permissions").select("role_key, permission_key, granted_at").order("role_key").order("permission_key"),
  ]);
  if (permissions.error) logProviderError("admin access permissions read", permissions.error);
  if (grants.error) logProviderError("admin access role_permissions read", grants.error);

  return {
    permissions: (permissions.data ?? []) as PermissionRow[],
    rolePermissions: (grants.data ?? []) as RolePermissionRow[],
    unavailable: !!permissions.error || !!grants.error,
  };
}
