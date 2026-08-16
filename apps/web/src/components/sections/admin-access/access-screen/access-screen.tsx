import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { AdminAccessData } from "@/features/admin-access/queries";
import { adminAccessMessages } from "@/features/admin-access/strings";
import { countDirectOverrides, type AccessView } from "@/features/admin-access/view";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import AccessCatalogue from "../access-catalogue/access-catalogue";
import AccessFrame, { type FrameMetric, type FrameTab } from "../access-frame/access-frame";
import AccessGovernance from "../access-governance/access-governance";
import AccessManager from "../access-manager/access-manager";
import AccessRoleCaps from "../access-role-caps/access-role-caps";
import AccessRoster from "../access-roster/access-roster";

export default function AccessScreen({ data, view, targetUserId, locale }: {
  data: AdminAccessData;
  view: AccessView;
  targetUserId: string;
  locale: Locale;
}) {
  const strings = adminAccessMessages(locale);
  const count = (value: number) => formatCount(value, locale);

  const metrics: readonly FrameMetric[] = [
    {
      key: "accounts",
      label: strings.metrics.accounts,
      value: data.rosterUnavailable ? strings.notConfigured : count(data.profiles.length),
      note: strings.metrics.accountsNote,
    },
    {
      key: "roles",
      label: strings.metrics.roles,
      value: data.rolesUnavailable ? strings.notConfigured : count(data.roles.length),
      note: strings.metrics.rolesNote,
    },
    {
      key: "overrides",
      label: strings.metrics.overrides,
      value: data.canManage && !data.manageSourcesUnavailable
        ? count(countDirectOverrides(data.access))
        : strings.notConfigured,
      note: strings.metrics.overridesNote,
    },
  ];

  const tabs: readonly FrameTab[] = [
    { key: "users", label: strings.tabs.users, href: "/admin/access?view=users", current: view === "users" },
    { key: "roles", label: strings.tabs.roles, href: "/admin/access?view=roles", current: view === "roles" },
    { key: "review", label: strings.tabs.review, href: "/admin/security-access" },
    { key: "devices", label: strings.tabs.devices, href: "/admin/devices" },
  ];

  return (
    <AccessFrame metrics={metrics} strings={strings} tabs={tabs}>
      {data.permissionCheckUnavailable ? (
        <EmptyState
          description={strings.error.permissionsBody}
          icon="risk"
          title={strings.error.permissionsTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      {view === "users" ? <UsersView data={data} locale={locale} targetUserId={targetUserId} /> : null}
      {view === "roles" ? <RolesView data={data} locale={locale} /> : null}

      <AccessGovernance readOnly={!data.canManage} strings={adminAccessMessages(locale)} />
    </AccessFrame>
  );
}

function UsersView({ data, targetUserId, locale }: {
  data: AdminAccessData;
  targetUserId: string;
  locale: Locale;
}) {
  const strings = adminAccessMessages(locale);

  if (data.rosterUnavailable) {
    return (
      <EmptyState
        description={strings.error.rosterBody}
        icon="risk"
        title={strings.error.rosterTitle}
        tone="danger"
      />
    );
  }

  return (
    <>
      {data.rolesUnavailable ? (
        <EmptyState
          description={strings.error.rolesBody}
          icon="risk"
          title={strings.error.rolesTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      <AccessRoster
        profiles={data.profiles}
        roles={data.roles}
        rolesUnavailable={data.rolesUnavailable}
        strings={strings}
      />

      {data.canManage && data.currentUserId && !data.rolesUnavailable && !data.manageSourcesUnavailable ? (
        <AccessManager
          access={data.access}
          capabilities={data.capabilities.map(entry => ({ capabilityKey: entry.capability_key }))}
          currentUserId={data.currentUserId}
          initialUserId={targetUserId}
          locale={locale}
          roles={data.roles}
          strings={strings}
          users={data.profiles.map(profile => ({
            userId: profile.user_id,
            name: profile.full_name,
            email: profile.email,
          }))}
        />
      ) : null}

      {data.canManage && data.manageSourcesUnavailable ? (
        <EmptyState
          description={strings.error.manageBody}
          icon="risk"
          title={strings.error.manageTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}
    </>
  );
}

function RolesView({ data, locale }: { data: AdminAccessData; locale: Locale }) {
  const strings = adminAccessMessages(locale);

  if (data.rolesUnavailable) {
    return (
      <EmptyState
        description={strings.error.catalogueBody}
        icon="risk"
        title={strings.error.catalogueTitle}
        tone="danger"
      />
    );
  }

  return (
    <>
      <AccessCatalogue roles={data.roles} strings={strings} />

      {data.canManageRoleCaps && data.currentUserId && !data.roleCapSourcesUnavailable ? (
        <AccessRoleCaps
          grants={data.rolePermissions.map(grant => ({
            roleKey: grant.role_key,
            permissionKey: grant.permission_key,
          }))}
          permissions={data.permissions.map(permission => ({
            permissionKey: permission.permission_key,
            title: permission.title,
          }))}
          roles={data.roles}
          strings={strings}
        />
      ) : null}

      {data.canManageRoleCaps && data.roleCapSourcesUnavailable ? (
        <EmptyState
          description={strings.error.roleCapsBody}
          icon="risk"
          title={strings.error.roleCapsTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}
    </>
  );
}
