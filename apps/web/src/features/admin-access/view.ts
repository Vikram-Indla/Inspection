export type RoleRow = { role_key: string; title: string; is_admin: boolean };
export type ProfileRow = {
  user_id: string;
  full_name: string;
  email: string | null;
  region: string | null;
  user_roles: readonly { role_key: string }[] | null;
};

export type RoleGrant = { roleKey: string; grantedAt: string };
export type CapabilityGrant = { capabilityKey: string; grantedAt: string };
export type EffectiveCapability = { capabilityKey: string; viaRoles: readonly string[]; direct: boolean };

export type UserAccess = {
  userId: string;
  roles: readonly RoleGrant[];
  directGrants: readonly CapabilityGrant[];
  effective: readonly EffectiveCapability[];
};

export type AccessView = "users" | "roles";

export function parseAccessView(value: string | readonly string[] | undefined): AccessView {
  return value === "roles" ? "roles" : "users";
}

export function parseTargetUser(
  value: string | readonly string[] | undefined,
  profiles: readonly ProfileRow[],
): string {
  return typeof value === "string" && profiles.some(profile => profile.user_id === value) ? value : "";
}

export function roleKeysOf(profile: ProfileRow): readonly string[] {
  return (profile.user_roles ?? []).map(role => role.role_key);
}

export function buildUserAccess(
  profiles: readonly ProfileRow[],
  userRoles: readonly { user_id: string; role_key: string; granted_at: string }[],
  capabilityGrants: readonly { user_id: string; capability_key: string; granted_at: string }[],
  roleCapabilities: readonly { role_key: string; capability_key: string }[],
): readonly UserAccess[] {
  const capabilitiesByRole = new Map<string, string[]>();
  for (const row of roleCapabilities) {
    const known = capabilitiesByRole.get(row.role_key) ?? [];
    known.push(row.capability_key);
    capabilitiesByRole.set(row.role_key, known);
  }

  return profiles.map(profile => {
    const held = userRoles.filter(row => row.user_id === profile.user_id);
    const direct = capabilityGrants.filter(row => row.user_id === profile.user_id);
    const effective = new Map<string, { viaRoles: string[]; direct: boolean }>();

    for (const role of held) {
      for (const capability of capabilitiesByRole.get(role.role_key) ?? []) {
        const entry = effective.get(capability) ?? { viaRoles: [], direct: false };
        entry.viaRoles.push(role.role_key);
        effective.set(capability, entry);
      }
    }
    for (const grant of direct) {
      const entry = effective.get(grant.capability_key) ?? { viaRoles: [], direct: false };
      entry.direct = true;
      effective.set(grant.capability_key, entry);
    }

    return {
      userId: profile.user_id,
      roles: held.map(row => ({ roleKey: row.role_key, grantedAt: row.granted_at })),
      directGrants: direct.map(row => ({ capabilityKey: row.capability_key, grantedAt: row.granted_at })),
      effective: Array.from(effective.entries())
        .map(([capabilityKey, entry]) => ({ capabilityKey, viaRoles: entry.viaRoles, direct: entry.direct }))
        .sort((left, right) => left.capabilityKey.localeCompare(right.capabilityKey)),
    };
  });
}

export function countDirectOverrides(access: readonly UserAccess[]): number {
  return access.reduce((total, entry) => total + entry.directGrants.length, 0);
}
