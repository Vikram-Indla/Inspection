import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import { roleKeysOf, type ProfileRow, type RoleRow } from "@/features/admin-access/view";
import styles from "./access-roster.module.css";

export default function AccessRoster({ profiles, roles, strings, rolesUnavailable }: {
  profiles: readonly ProfileRow[];
  roles: readonly RoleRow[];
  strings: AdminAccessMessages;
  rolesUnavailable: boolean;
}) {
  const isAdminRole = (roleKey: string) => roles.find(role => role.role_key === roleKey)?.is_admin === true;
  const roleTitle = (roleKey: string) => roles.find(role => role.role_key === roleKey)?.title || roleKey;

  const columns: readonly DataColumn<ProfileRow>[] = [
    {
      key: "user",
      header: strings.roster.user,
      isRowHeader: true,
      cell: row => <Text as="span" role="bodyStrong">{row.full_name}</Text>,
    },
    {
      key: "email",
      header: strings.roster.email,
      cell: row => row.email
        ? <CellMuted>{row.email}</CellMuted>
        : <CellMuted>{strings.notConfigured}</CellMuted>,
    },
    {
      key: "region",
      header: strings.roster.region,
      cell: row => <Text as="span">{row.region ?? strings.notConfigured}</Text>,
    },
    {
      key: "roles",
      header: strings.roster.roles,
      cell: row => rolesUnavailable
        ? <Text as="span" tone="muted">{strings.unavailable}</Text>
        : <RoleKeys keys={roleKeysOf(row)} isAdminRole={isAdminRole} roleTitle={roleTitle} strings={strings} />,
    },
  ];

  return (
    <Card>
      <CardHeader level="h2" title={strings.breadcrumb.hub} description={strings.roster.caption} />
      <CardBody>
        <DataTable
          columns={columns}
          empty={{ icon: "restricted", title: strings.roster.emptyTitle, description: strings.roster.emptyBody }}
          getRowId={row => row.user_id}
          rows={profiles}
        />
      </CardBody>
    </Card>
  );
}

function RoleKeys({ keys, isAdminRole, roleTitle, strings }: {
  keys: readonly string[];
  isAdminRole: (roleKey: string) => boolean;
  roleTitle: (roleKey: string) => string;
  strings: AdminAccessMessages;
}) {
  if (!keys.length) return <Text as="span" tone="muted">{strings.notConfigured}</Text>;

  return (
    <span className={styles.roleKeys}>
      {keys.map(roleKey => (
        <StatusPill
          key={roleKey}
          ping={false}
          title={isAdminRole(roleKey) ? strings.roster.adminRole : strings.roster.standardRole}
          tone={isAdminRole(roleKey) ? "accent" : "neutral"}
        >
          {roleTitle(roleKey)}
        </StatusPill>
      ))}
    </span>
  );
}
