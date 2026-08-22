"use client";

import { useState, useTransition } from "react";
import InfoNote from "@/components/saqeel/info-note/info-note";
import {
  grantRoleCapability,
  revokeRoleCapability,
  type RoleCapabilityResult,
} from "@/app/(app)/admin/access/role-capability-actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { RoleRow } from "@/features/admin-access/view";
import { fill } from "@/i18n/messages";
import AccessConfirm from "../access-manager/access-confirm";
import AccessGrantRow from "../access-manager/access-grant-row";
import styles from "./access-role-caps.module.css";

const SEPARATION_OF_DUTIES = "admin.access.manage";

type Pending = { readonly kind: "revoke" | "grantSod"; readonly permissionKey: string; readonly name: string };

export type PermissionOption = { readonly permissionKey: string; readonly label: string };

export default function AccessRoleCaps({ roles, permissions, grants, strings }: {
  roles: readonly RoleRow[];
  permissions: readonly PermissionOption[];
  grants: readonly { roleKey: string; permissionKey: string }[];
  strings: AdminAccessMessages;
}) {
  const [roleKey, setRoleKey] = useState("");
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [feedback, setFeedback] = useState<RoleCapabilityResult>({});
  const [pending, startTransition] = useTransition();

  const held = grants.filter(grant => grant.roleKey === roleKey);
  const heldKeys = new Set(held.map(grant => grant.permissionKey));
  const labels = new Map(permissions.map(permission => [permission.permissionKey, permission.label]));
  const nameOf = (permissionKey: string) => labels.get(permissionKey) || permissionKey;
  const roleNameOf = (key: string) => roles.find(role => role.role_key === key)?.title || key;

  const columns: readonly DataColumn<{ permissionKey: string }>[] = [
    {
      key: "capability",
      header: strings.roleCaps.capability,
      isRowHeader: true,
      cell: grant => (
        <span className={styles.name}>
          <Text as="span" clamp={2} role="bodyStrong">{nameOf(grant.permissionKey)}</Text>
          {grant.permissionKey === SEPARATION_OF_DUTIES ? (
            <StatusPill ping={false} tone="accent">{strings.roleCaps.separationOfDuties}</StatusPill>
          ) : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: strings.roleCaps.actions,
      align: "end",
      width: "min",
      headerHidden: true,
      cell: grant => (
        <Button
          disabled={pending}
          label={fill(strings.roleCaps.revokeGrant, { name: nameOf(grant.permissionKey) })}
          onClick={() => setConfirming({ kind: "revoke", permissionKey: grant.permissionKey, name: nameOf(grant.permissionKey) })}
          size="sm"
          variant="tertiary"
        >
          {strings.roleCaps.revoke}
        </Button>
      ),
    },
  ];

  const run = (action: (data: FormData) => Promise<RoleCapabilityResult>, permissionKey: string) => {
    const data = new FormData();
    data.set("role_key", roleKey);
    data.set("permission_key", permissionKey);
    setConfirming(null);
    setFeedback({});
    startTransition(async () => setFeedback(await action(data)));
  };

  const requestGrant = (permissionKey: string) => {
    if (permissionKey === SEPARATION_OF_DUTIES) {
      setConfirming({ kind: "grantSod", permissionKey, name: nameOf(permissionKey) });
      return;
    }
    run(grantRoleCapability, permissionKey);
  };

  const onConfirm = () => {
    if (!confirming) return;
    if (confirming.kind === "revoke") run(revokeRoleCapability, confirming.permissionKey);
    else run(grantRoleCapability, confirming.permissionKey);
  };

  return (
    <Card>
      <CardHeader level="h2" title={strings.roleCaps.title}
        trailing={<InfoNote label={strings.roleCaps.title}>{strings.roleCaps.intro}</InfoNote>} />
      <CardBody>
        <div className={styles.picker}>
          <SaqeelSelect
            emptyLabel={strings.roleCaps.noRoles}
            label={strings.roleCaps.selectRole}
            onChange={value => {
              setRoleKey(value);
              setConfirming(null);
              setFeedback({});
            }}
            options={roles.map(role => ({ value: role.role_key, label: role.title || role.role_key }))}
            placeholder={strings.roleCaps.selectRolePlaceholder}
            value={roleKey}
          />
        </div>

        {roleKey ? (
          <>
            <Heading level={3} visual="subheading">{strings.roleCaps.grantedTitle}</Heading>
            <DataTable
              columns={columns}
              density="compact"
              empty={{ icon: "access", title: strings.roleCaps.noGrants }}
              getRowId={grant => grant.permissionKey}
              rows={held}
            />

            <AccessGrantRow
              action={requestGrant}
              actionLabel={strings.roleCaps.grantCapability}
              disabled={pending}
              emptyLabel={strings.roleCaps.noGrantableCapabilities}
              label={strings.roleCaps.selectCapabilityToGrant}
              options={permissions
                .filter(permission => !heldKeys.has(permission.permissionKey))
                .map(permission => ({
                  value: permission.permissionKey,
                  label: nameOf(permission.permissionKey),
                }))}
            />
          </>
        ) : null}

        <AccessConfirm
          cancelLabel={strings.roleCaps.cancel}
          confirmLabel={strings.roleCaps.confirm}
          message={confirmMessage(confirming, roleNameOf(roleKey), strings)}
          onCancel={() => setConfirming(null)}
          onConfirm={onConfirm}
          pending={pending}
          workingLabel={strings.roleCaps.working}
        />

        {feedback.ok ? <StatusPill tone="success">{feedback.ok}</StatusPill> : null}
        {feedback.error ? (
          <EmptyState icon="risk" title={feedback.error} tone="danger" variant="inline" />
        ) : null}
      </CardBody>
    </Card>
  );
}

function confirmMessage(pending: Pending | null, role: string, strings: AdminAccessMessages): string {
  if (!pending) return "";
  if (pending.kind === "revoke") {
    return fill(strings.roleCaps.confirmRevoke, { permission: pending.name, role });
  }
  return fill(strings.roleCaps.confirmGrantSod, { role });
}
