import AdminDestinationFrame from "../_components/AdminDestinationFrame";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import AccessManager, { type UserAccess } from "./AccessManager";
import RoleCapabilityPanel from "./RoleCapabilityPanel";
import styles from "./access.module.css";
import {
  AdminRecordArticle,
  AdminRecordTableRow,
} from "../_components/AdminRecordDrawer";
import { createAdminRecordDrawerLabels } from "../_components/adminRecordDrawerCopy";

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

type AccessView = "users" | "roles";

export default async function Access({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await useT();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const sb = await supabaseServer();
  const params = await searchParams;
  const requestedView = params.view;
  const view: AccessView = requestedView === "roles" ? "roles" : "users";
  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, { data: { user } }] = await Promise.all([
    sb.from("profiles").select("user_id, full_name, email, region, user_roles!user_roles_user_id_fkey(role_key)").order("full_name"),
    sb.from("roles").select("role_key, title, is_admin").order("role_key"),
    getVerifiedUser(sb),
  ]);
  if (profilesError) logProviderError("admin access profiles read", profilesError);
  if (rolesError) logProviderError("admin access roles read", rolesError);

  // The management panel is security_admin-only. The has_role RPC is the same
  // definer helper RLS policies use; the guarded RPCs re-check on every write.
  const { data: isSecurityAdmin, error: gateError } = user
    ? await sb.rpc("has_role", { r: "security_admin" })
    : { data: false, error: null };
  if (gateError) logProviderError("admin access security_admin gate", gateError);
  const canManage = isSecurityAdmin === true;

  // M9 / PLN-REQ-004 — the role-capability editor gates on the PLANNING
  // capability admin.access.manage (explicit-grant-only, seeded to
  // security_admin), checked independently of the legacy has_role gate above.
  const { data: canManageAccessCaps, error: capGateError } = user
    ? await sb.rpc("has_planning_capability", { p_capability: "admin.access.manage" })
    : { data: false, error: null };
  if (capGateError) logProviderError("admin access admin.access.manage gate", capGateError);
  const canManageRoleCaps = canManageAccessCaps === true;

  let access: UserAccess[] = [];
  let capabilityCatalogue: CapabilityRow[] = [];
  let userAccessSourcesUnavailable = false;
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
    userAccessSourcesUnavailable = [userRolesRes, capGrantsRes, roleCapsRes, capsRes].some(result => !!result.error);
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

  // M9 — role capability (role_permissions) editor data: the governed
  // permission catalogue plus every current role→permission grant. Read is
  // authenticated-wide by RLS; writes stay behind the server-action guards.
  let permissionCatalogue: { permission_key: string; title: string; description: string }[] = [];
  let rolePermissionGrants: { role_key: string; permission_key: string; granted_at: string }[] = [];
  let roleCapabilitySourcesUnavailable = false;
  if (canManageRoleCaps) {
    const [permsRes, grantsRes] = await Promise.all([
      sb.from("permissions").select("permission_key, title, description").order("permission_key"),
      sb.from("role_permissions").select("role_key, permission_key, granted_at").order("role_key").order("permission_key"),
    ]);
    if (permsRes.error) logProviderError("admin access permissions read", permsRes.error);
    if (grantsRes.error) logProviderError("admin access role_permissions read", grantsRes.error);
    roleCapabilitySourcesUnavailable = !!permsRes.error || !!grantsRes.error;
    permissionCatalogue = (permsRes.data ?? []) as typeof permissionCatalogue;
    rolePermissionGrants = (grantsRes.data ?? []) as typeof rolePermissionGrants;
  }

  const notConfigured = t("common.notConfigured", copy("Not configured", "غير مُهيّأ"));
  const scopedUsers = profilesError ? notConfigured : (profiles ?? []).length;
  const governedRoles = rolesError ? notConfigured : (roles ?? []).length;
  const directOverrides = canManage && !userAccessSourcesUnavailable
    ? access.reduce((total, item) => total + item.directGrants.length, 0)
    : notConfigured;
  const targetUserId = typeof params.target === "string"
    && (profiles ?? []).some(profile => profile.user_id === params.target)
    ? params.target
    : "";
  const drawerLabels = createAdminRecordDrawerLabels(t, locale);
  const accessGovernance = [
    t("admin.revamp.access.governance.rls", copy("Row Level Security limits the roster before it reaches this page.", "يقيّد أمن الصفوف القائمة قبل وصولها إلى هذه الصفحة.")),
    t("admin.revamp.access.governance.audit", copy("Role and capability changes use guarded server actions and append audit evidence.", "تستخدم تغييرات الأدوار والصلاحيات إجراءات خادم محمية وتضيف أدلة التدقيق.")),
    t("admin.revamp.access.governance.refresh", copy("Changes take effect on the target user’s next authorized request.", "تسري التغييرات عند الطلب المصرّح التالي للمستخدم المستهدف.")),
  ];
  const accessEditUnavailable = t(
    "admin.recordDrawer.access.editUnavailable",
    copy(
      "Your session does not have the governed access-management permission.",
      "لا تملك جلستك صلاحية إدارة الوصول المحكومة.",
    ),
  );

  return (
    <AdminDestinationFrame
      current="/admin/access"
      title={t("admin.revamp.access.title", copy("Users & Roles", "المستخدمون والأدوار"))}
      subtitle={t("admin.revamp.access.subtitle", copy("Accounts, role assignment and access review", "الحسابات وتعيين الأدوار ومراجعة الوصول"))}
      hub={t("admin.revamp.hub.people", copy("People & access", "الأشخاص والوصول"))}
      routeLabel="/admin/access"
      designId="frame-19-admin-users-roles"
      drawerLabels={drawerLabels}
      labels={{
        administration: t("navigation.administration", copy("Administration", "الإدارة")),
        breadcrumb: t("common.breadcrumb", copy("Breadcrumb", "مسار التنقل")),
        governance: t("admin.revamp.governance", copy("Governance on this surface", "الحوكمة في هذه الواجهة")),
        reconstruction: t("admin.revamp.reconstruction", copy("Reconstruction note", "ملاحظة إعادة البناء")),
      }}
      metrics={[
        {
          label: t("admin.revamp.access.metric.users", copy("Accounts in scope", "الحسابات ضمن النطاق")),
          value: scopedUsers,
          note: t("admin.revamp.access.metric.users.note", copy("RLS-visible profiles only", "الملفات المرئية حسب أمن الصفوف فقط")),
        },
        {
          label: t("admin.revamp.access.metric.roles", copy("Governed role keys", "مفاتيح الأدوار المحكومة")),
          value: governedRoles,
          note: t("admin.revamp.access.metric.roles.note", copy("Read from the role catalogue", "مقروءة من كتالوج الأدوار")),
        },
        {
          label: t("admin.revamp.access.metric.overrides", copy("Direct overrides", "منح الوصول المباشرة")),
          value: directOverrides,
          note: t("admin.revamp.access.metric.overrides.note", copy("Verified grants, or not configured", "منح متحققة أو غير مهيأة")),
        },
      ]}
      tabs={[
        { label: t("admin.access.views.users", copy("Users", "المستخدمون")), href: "/admin/access?view=users", current: view === "users" },
        { label: t("admin.access.views.roles", copy("Roles", "الأدوار")), href: "/admin/access?view=roles", current: view === "roles" },
        { label: t("admin.revamp.access.tabs.review", copy("Access review", "مراجعة الوصول")), href: "/admin/security-access" },
        { label: t("admin.revamp.access.tabs.devices", copy("Trusted devices", "الأجهزة الموثوقة")), href: "/admin/devices" },
      ]}
      gate={{
        title: t("admin.revamp.access.gate.title", copy("Role changes are guarded and audited", "تغييرات الأدوار محمية ومدققة")),
        body: t("admin.revamp.access.gate.body", copy(
          "Every write is re-authorized on the server. Self-elevation and removal of the last security administrator are refused by governed RPCs; backend role keys remain unchanged until an approved mapping migration exists.",
          "يُعاد التحقق من صلاحية كل كتابة على الخادم. ترفض إجراءات قاعدة البيانات المحكومة رفع المستخدم لصلاحياته أو إزالة آخر مسؤول أمان؛ وتبقى مفاتيح الأدوار الخلفية دون تغيير إلى أن تُعتمد ترحيلة للربط.",
        )),
      }}
      governance={accessGovernance}
      reconstructionNote={t("admin.revamp.access.note", copy(
        "The design’s three presentation roles sit above the existing governed role catalogue. This route does not collapse or rename backend roles without an approved data and RLS migration.",
        "توجد أدوار العرض الثلاثة في التصميم فوق كتالوج الأدوار المحكوم الحالي. لا تدمج هذه الوجهة أدوار النظام الخلفي ولا تعيد تسميتها دون ترحيلة معتمدة للبيانات وأمن الصفوف.",
      ))}
      context={<span className="sq-lozenge sq-lozenge--info">SCR-ADM-090 · RBAC-001..014 · EXE-ACCESS</span>}
    >
      <div className="sq-banner"><div><strong>{t("admin.access.banner.title", "Access is enforced by Row Level Security, not UI.")}</strong> {t("admin.access.banner.body", "54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).")}</div></div>
      {(gateError || capGateError) && (
        <div className="sq-banner sq-banner--warning" role="alert"><div>
          <strong>{t("admin.access.permissions.error.title", "Permissions unavailable.")}</strong>{" "}
          {t("admin.access.permissions.error.body", "Your access-management permissions could not be verified. All write controls are unavailable; retry the page.")}
        </div></div>
      )}

      {view === "users" && (
        <>
          {profilesError && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("admin.access.error.title", "Couldn’t load the authorized user roster. Nothing was changed. Try again.")}</strong></div></div>}
          {rolesError && !profilesError && <div className="sq-banner sq-banner--warning" role="alert"><div><strong>{t("admin.access.roles.error.title", "Role details are unavailable.")}</strong> {t("admin.access.roles.error.body", "The authorized user roster remains visible, but role labels and all access changes are unavailable.")}</div></div>}
          {!profilesError && (
            <div className="sq-tablewrap"><table className="sq-table">
              <thead><tr><th scope="col">{t("admin.access.table.user", "User")}</th><th scope="col">{t("admin.access.table.email", "Email")}</th><th scope="col">{t("admin.access.table.region", "Region")}</th><th scope="col">{t("admin.access.table.roles", "Roles")}</th></tr></thead>
              <tbody>
                {(profiles ?? []).map(p => {
                  const roleKeys = ((p.user_roles ?? []) as { role_key: string }[]).map(role => role.role_key);
                  const roleValue = rolesError
                    ? t("common.unavailable", "Unavailable")
                    : roleKeys.join(", ") || notConfigured;
                  return (
                    <AdminRecordTableRow
                      key={p.user_id}
                      record={{
                        title: p.full_name,
                        subtitle: t("admin.revamp.hub.people", copy("People & access", "الأشخاص والوصول")),
                        record: [
                          { label: t("admin.access.table.email", "Email"), value: p.email ?? notConfigured },
                          { label: t("admin.access.table.region", "Region"), value: p.region ?? notConfigured },
                          { label: t("admin.access.table.roles", "Roles"), value: roleValue },
                          { label: t("admin.recordDrawer.identifier", copy("Record identifier", "معرّف السجل")), value: p.user_id },
                        ],
                        governance: accessGovernance,
                        auditHref: `/admin/audit?case=${encodeURIComponent(p.user_id)}`,
                        editHref: canManage
                          ? `/admin/access?view=users&target=${encodeURIComponent(p.user_id)}#access-manager-h`
                          : undefined,
                        editUnavailableReason: accessEditUnavailable,
                      }}
                    >
                      <td><strong>{p.full_name}</strong></td>
                      <td className="sq-caption">{p.email}</td>
                      <td>{p.region}</td>
                      <td>{rolesError ? t("common.unavailable", "Unavailable") : roleKeys.map(roleKey =>
                        <span key={roleKey} className={`sq-lozenge ${(roles ?? []).find(x => x.role_key === roleKey)?.is_admin ? "sq-lozenge--warning" : "sq-lozenge--info"}`} style={{ marginInlineEnd: 6 }}>{roleKey}</span>)}</td>
                    </AdminRecordTableRow>
                  );
                })}
              </tbody>
            </table></div>
          )}
          <p className="sq-caption" style={{ marginBlockStart: "var(--space-3)" }}>
            {canManage
              ? t("admin.access.rlsNote.manage", "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. Access changes use only governed server actions.")
              : t("admin.access.rlsNote", "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. This screen is read-only.")}
          </p>
        </>
      )}

      {view === "users" && canManage && user && !profilesError && !rolesError && !userAccessSourcesUnavailable && (
        <AccessManager
          users={(profiles ?? []).map(p => ({ userId: p.user_id, name: p.full_name, email: p.email }))}
          roles={((roles ?? []) as RoleRow[]).map(r => ({ roleKey: r.role_key, title: r.title, isAdmin: r.is_admin }))}
          capabilities={capabilityCatalogue.map(c => ({ capabilityKey: c.capability_key, description: c.description }))}
          access={access}
          currentUserId={user.id}
          initialSelectedUserId={targetUserId}
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

      {view === "users" && canManage && user && userAccessSourcesUnavailable && (
        <div className="sq-banner sq-banner--warning" role="alert"><div>
          <strong>{t("admin.access.manage.error.title", "Access details are partially unavailable.")}</strong>{" "}
          {t("admin.access.manage.error.body", "The user roster remains visible, but access changes are unavailable because one or more governed sources could not be read.")}
        </div></div>
      )}

      {view === "roles" && rolesError && (
        <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("admin.access.roles.catalogue.error", "Couldn’t load the authorized role catalogue. No controls are available.")}</strong></div></div>
      )}
      {view === "roles" && !rolesError && (
        <section className={styles.roleCatalogue} aria-labelledby="role-catalogue-title">
          <div>
            <h2 id="role-catalogue-title">{t("admin.access.roles.catalogue.title", "Role catalogue")}</h2>
            <p className="sq-caption">{t("admin.access.roles.catalogue.body", "Only roles visible to your session through Row Level Security are listed.")}</p>
          </div>
          <div className={styles.roleCards}>
            {((roles ?? []) as RoleRow[]).map(role => (
              <AdminRecordArticle
                className="sq-surface"
                key={role.role_key}
                record={{
                  title: role.title || role.role_key,
                  subtitle: t("admin.access.roles.catalogue.title", "Role catalogue"),
                  record: [
                    { label: t("admin.recordDrawer.roleKey", copy("Role key", "مفتاح الدور")), value: role.role_key },
                    { label: t("common.title", copy("Title", "العنوان")), value: role.title || notConfigured },
                    {
                      label: t("admin.recordDrawer.roleType", copy("Access class", "فئة الوصول")),
                      value: role.is_admin
                        ? t("admin.access.roles.admin", "Administrator role")
                        : t("admin.recordDrawer.roleStandard", copy("Standard governed role", "دور محكوم قياسي")),
                    },
                  ],
                  governance: accessGovernance,
                  auditHref: `/admin/audit?q=${encodeURIComponent(role.role_key)}`,
                  editHref: canManageRoleCaps ? "/admin/access?view=roles#role-cap-h" : undefined,
                  editUnavailableReason: accessEditUnavailable,
                }}
              >
                <strong>{role.title || role.role_key}</strong>
                <bdi className="sq-caption" dir="ltr">{role.role_key}</bdi>
                {role.is_admin && <span className="sq-lozenge sq-lozenge--warning">{t("admin.access.roles.admin", "Administrator role")}</span>}
              </AdminRecordArticle>
            ))}
          </div>
        </section>
      )}

      {view === "roles" && canManageRoleCaps && user && !rolesError && !roleCapabilitySourcesUnavailable && (
        <RoleCapabilityPanel
          roles={((roles ?? []) as RoleRow[]).map(r => ({ roleKey: r.role_key, title: r.title, isAdmin: r.is_admin }))}
          permissions={permissionCatalogue.map(p => ({ permissionKey: p.permission_key, title: p.title, description: p.description }))}
          grants={rolePermissionGrants.map(g => ({ roleKey: g.role_key, permissionKey: g.permission_key, grantedAt: g.granted_at }))}
          labels={{
            panelTitle: t("admin.access.rolecaps.title", "Role capabilities (governed permission map)"),
            panelIntro: t("admin.access.rolecaps.intro", "Grant or revoke a capability for an entire role. The self-escalation guard blocks granting, to a role you hold, any capability you lack — and admin.access.manage can never be granted to or revoked from a role you hold. RLS (security_admin) remains the write authority."),
            selectRole: t("admin.access.rolecaps.selectRole", "Select a role"),
            grantedTitle: t("admin.access.rolecaps.granted", "Granted capabilities"),
            noGrants: t("admin.access.rolecaps.none", "This role currently has no capability grants."),
            revoke: t("admin.access.manage.revoke", "Revoke"),
            grantCapability: t("admin.access.rolecaps.grant", "Grant capability to role"),
            confirmRevoke: t("admin.access.rolecaps.confirmRevoke", "Revoke “{permission}” from every user with role “{role}”? The change takes effect on their next request."),
            confirmGrantSod: t("admin.access.rolecaps.confirmGrantSod", "Grant the separation-of-duties capability admin.access.manage to role “{role}”? Any holder of that role could then change access."),
            confirm: t("admin.access.manage.confirm", "Confirm"),
            cancel: t("common.cancel", "Cancel"),
            working: t("admin.access.manage.working", "Applying…"),
            auditNote: t("admin.access.rolecaps.auditNote", "Audit note: user_roles changes are recorded by the existing audit trigger; role_permissions audit coverage is migration 20260722120000 (authored, pending apply)."),
          }}
        />
      )}
      {view === "roles" && canManageRoleCaps && user && roleCapabilitySourcesUnavailable && (
        <div className="sq-banner sq-banner--warning" role="alert"><div>
          <strong>{t("admin.access.rolecaps.error.title", "Role capability details are unavailable.")}</strong>{" "}
          {t("admin.access.rolecaps.error.body", "The role catalogue remains visible, but capability changes are unavailable because a governed source could not be read.")}
        </div></div>
      )}
    </AdminDestinationFrame>
  );
}
