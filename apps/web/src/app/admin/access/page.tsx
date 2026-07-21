import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import AccessManager, { type UserAccess } from "./AccessManager";

// TASK-EXECUTION-MODULE-001 · Phase 2B — governed role/capability grants.
// The roster below stays read-only and exactly as before. For security_admin
// the two former not-yet seams are now real: a governed grant/revoke panel
// (four guarded RPCs — self-escalation guard, sole-security_admin guard,
// EXE-ACCESS audit) and an effective-access explainer per user (role-derived
// vs direct grants, computed from role_capabilities + user_capability_grants
// read through RLS). Non-security_admin viewers keep the read-only roster
// only. RLS and the RPCs remain the authority; this page never writes grant
// tables directly.
export const dynamic = "force-dynamic";

type RoleRow = { role_key: string; title: string; is_admin: boolean };
type UserRoleRow = { user_id: string; role_key: string; granted_by: string | null; granted_at: string };
type CapGrantRow = { user_id: string; capability_key: string; granted_by: string | null; granted_at: string };
type RoleCapRow = { role_key: string; capability_key: string };
type CapabilityRow = { capability_key: string; description: string };

export default async function Access() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: profiles, error }, { data: roles }, { data: { user } }] = await Promise.all([
    sb.from("profiles").select("user_id, full_name, email, region, user_roles!user_roles_user_id_fkey(role_key)").order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
    getVerifiedUser(sb),
  ]);
  if (error) console.error("[admin access] load failed", error);

  // The management panel is security_admin-only. The has_role RPC is the same
  // definer helper RLS policies use; the guarded RPCs re-check on every write.
  const { data: isSecurityAdmin, error: gateError } = user
    ? await sb.rpc("has_role", { r: "security_admin" })
    : { data: false, error: null };
  if (gateError) logProviderError("admin access security_admin gate", gateError);
  const canManage = isSecurityAdmin === true;

  let access: UserAccess[] = [];
  let capabilityCatalogue: CapabilityRow[] = [];
  if (canManage) {
    const [userRolesRes, capGrantsRes, roleCapsRes, capsRes] = await Promise.all([
      sb.from("user_roles").select("user_id, role_key, granted_by, granted_at"),
      sb.from("user_capability_grants").select("user_id, capability_key, granted_by, granted_at"),
      sb.from("role_capabilities").select("role_key, capability_key"),
      sb.from("capabilities").select("capability_key, description").order("capability_key"),
    ]);
    for (const [scope, res] of [["user_roles", userRolesRes], ["user_capability_grants", capGrantsRes], ["role_capabilities", roleCapsRes], ["capabilities", capsRes]] as const) {
      if (res.error) logProviderError(`admin access ${scope} read`, res.error);
    }
    const allUserRoles = (userRolesRes.data ?? []) as UserRoleRow[];
    const allCapGrants = (capGrantsRes.data ?? []) as CapGrantRow[];
    capabilityCatalogue = (capsRes.data ?? []) as CapabilityRow[];

    const roleCapMap = new Map<string, string[]>();
    for (const rc of (roleCapsRes.data ?? []) as RoleCapRow[]) {
      const list = roleCapMap.get(rc.role_key) ?? [];
      list.push(rc.capability_key);
      roleCapMap.set(rc.role_key, list);
    }

    access = (profiles ?? []).map(p => {
      const userRoles = allUserRoles.filter(ur => ur.user_id === p.user_id);
      const directGrants = allCapGrants.filter(g => g.user_id === p.user_id);
      const effective = new Map<string, { viaRoles: string[]; direct: boolean }>();
      for (const ur of userRoles) {
        for (const cap of roleCapMap.get(ur.role_key) ?? []) {
          const entry = effective.get(cap) ?? { viaRoles: [], direct: false };
          entry.viaRoles.push(ur.role_key);
          effective.set(cap, entry);
        }
      }
      for (const g of directGrants) {
        const entry = effective.get(g.capability_key) ?? { viaRoles: [], direct: false };
        entry.direct = true;
        effective.set(g.capability_key, entry);
      }
      return {
        userId: p.user_id,
        roles: userRoles.map(ur => ({ roleKey: ur.role_key, grantedBy: ur.granted_by, grantedAt: ur.granted_at })),
        directGrants: directGrants.map(g => ({ capabilityKey: g.capability_key, grantedBy: g.granted_by, grantedAt: g.granted_at })),
        effective: Array.from(effective.entries())
          .map(([capabilityKey, v]) => ({ capabilityKey, viaRoles: v.viaRoles, direct: v.direct }))
          .sort((a, b) => a.capabilityKey.localeCompare(b.capabilityKey)),
      };
    });
  }

  return (
    <Shell current="/admin/access" title={t("admin.access.title", "Roles & permissions")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-090 · RBAC-001..014 · EXE-ACCESS</span>}>
      <div className="ax-banner"><div><strong>{t("admin.access.banner.title", "Access is enforced by Row Level Security, not UI.")}</strong> {t("admin.access.banner.body", "54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).")}</div></div>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("admin.access.error.title", "Couldn’t load roster. Nothing was changed. Try again.")}</strong></div></div>}
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th scope="col">{t("admin.access.table.user", "User")}</th><th scope="col">{t("admin.access.table.email", "Email")}</th><th scope="col">{t("admin.access.table.region", "Region")}</th><th scope="col">{t("admin.access.table.roles", "Roles")}</th></tr></thead>
        <tbody>
          {(profiles ?? []).map(p => (
            <tr key={p.user_id}>
              <td><strong>{p.full_name}</strong></td>
              <td className="ax-caption">{p.email}</td>
              <td>{p.region}</td>
              <td>{(p.user_roles as { role_key: string }[]).map(r =>
                <span key={r.role_key} className={`ax-lozenge ${(roles ?? []).find(x => x.role_key === r.role_key)?.is_admin ? "ax-lozenge--warning" : "ax-lozenge--info"}`} style={{ marginInlineEnd: 6 }}>{r.role_key}</span>)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>
        {canManage
          ? t("admin.access.rlsNote.manage", "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. The management panel below changes access only through the governed RPCs.")
          : t("admin.access.rlsNote", "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. This screen is read-only.")}
      </p>

      {canManage && user && (
        <AccessManager
          users={(profiles ?? []).map(p => ({ userId: p.user_id, name: p.full_name, email: p.email }))}
          roles={((roles ?? []) as RoleRow[]).map(r => ({ roleKey: r.role_key, title: r.title, isAdmin: r.is_admin }))}
          capabilities={capabilityCatalogue.map(c => ({ capabilityKey: c.capability_key, description: c.description }))}
          access={access}
          currentUserId={user.id}
          labels={{
            panelTitle: t("admin.access.manage.title", "Access management"),
            panelIntro: t("admin.access.manage.intro", "Grant or revoke roles and direct capability overrides. Every change runs through the governed RPCs: the self-escalation guard blocks changes to your own access, the last remaining security administrator cannot be revoked, and every change is recorded in the activity log."),
            selectUser: t("admin.access.manage.selectUser", "Select a user"),
            rolesTitle: t("admin.access.manage.roles", "Roles"),
            grantedAt: t("admin.access.manage.grantedAt", "granted"),
            grantRole: t("admin.access.manage.grantRole", "Grant role"),
            revoke: t("admin.access.manage.revoke", "Revoke"),
            confirmRevokeRole: t("admin.access.manage.confirmRevokeRole", "Revoke the role “{key}” from this user? The change is recorded and takes effect on their next request."),
            confirmGrantAdminRole: t("admin.access.manage.confirmGrantAdminRole", "Grant the administrator role “{key}” to this user? This gives them admin-level access and is recorded."),
            confirmRevokeCapability: t("admin.access.manage.confirmRevokeCapability", "Revoke the direct capability override “{key}” from this user? Role-derived access is unaffected."),
            confirm: t("admin.access.manage.confirm", "Confirm"),
            cancel: t("common.cancel", "Cancel"),
            capabilitiesTitle: t("admin.access.manage.capabilities", "Effective capabilities"),
            capabilitiesHint: t("admin.access.manage.capabilitiesHint", "The user's effective access: capabilities derived from their roles plus direct grant overrides, each labelled with its source."),
            viaRole: t("admin.access.manage.viaRole", "via role:"),
            directGrant: t("admin.access.manage.directGrant", "direct grant"),
            grantCapability: t("admin.access.manage.grantCapability", "Grant capability override"),
            noCapabilities: t("admin.access.manage.noCapabilities", "This user currently has no effective capabilities — no roles and no direct grants."),
            selfTarget: t("admin.access.manage.selfTarget", "This is your own user. The self-escalation guard refuses access changes you make to yourself — another security administrator must make them."),
            effectNote: t("admin.access.manage.effectNote", "Role and capability changes take effect on the target's next request. Nothing is applied silently: every change is confirmed here and recorded in the activity log with the actor, before/after state and requirement reference EXE-ACCESS."),
            working: t("admin.access.manage.working", "Applying…"),
            saved: t("admin.access.manage.saved", "saved — effective on the user's next request"),
          }}
        />
      )}
    </Shell>
  );
}
