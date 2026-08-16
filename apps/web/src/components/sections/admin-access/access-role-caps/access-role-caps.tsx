"use client";

import { useState, useTransition } from "react";
import {
  grantRoleCapability,
  revokeRoleCapability,
  type RoleCapabilityResult,
} from "@/app/(app)/admin/access/role-capability-actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { RoleRow } from "@/features/admin-access/view";
import { fill } from "@/i18n/messages";
import AccessConfirm from "../access-manager/access-confirm";
import AccessGrantRow from "../access-manager/access-grant-row";
import styles from "./access-role-caps.module.css";

const SEPARATION_OF_DUTIES = "admin.access.manage";

type Pending = { readonly kind: "revoke" | "grantSod"; readonly permissionKey: string };

export default function AccessRoleCaps({ roles, permissions, grants, strings }: {
  roles: readonly RoleRow[];
  permissions: readonly { permissionKey: string; title: string }[];
  grants: readonly { roleKey: string; permissionKey: string }[];
  strings: AdminAccessMessages;
}) {
  const [roleKey, setRoleKey] = useState("");
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [feedback, setFeedback] = useState<RoleCapabilityResult>({});
  const [pending, startTransition] = useTransition();

  const held = grants.filter(grant => grant.roleKey === roleKey);
  const heldKeys = new Set(held.map(grant => grant.permissionKey));

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
      setConfirming({ kind: "grantSod", permissionKey });
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
      <CardHeader level="h2" title={strings.roleCaps.title} description={strings.roleCaps.intro} />
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
            {held.length ? (
              <ul className={styles.pills}>
                {held.map(grant => (
                  <li className={styles.pill} key={grant.permissionKey}>
                    <StatusPill
                      ping={false}
                      tone={grant.permissionKey === SEPARATION_OF_DUTIES ? "accent" : "neutral"}
                    >
                      <Mono tone="inherit">{grant.permissionKey}</Mono>
                    </StatusPill>
                    <Button
                      disabled={pending}
                      label={fill(strings.roleCaps.revokeGrant, { key: grant.permissionKey })}
                      onClick={() => setConfirming({ kind: "revoke", permissionKey: grant.permissionKey })}
                      size="sm"
                      variant="danger"
                    >
                      {strings.roleCaps.revoke}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Text tone="secondary">{strings.roleCaps.noGrants}</Text>
            )}

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
                  label: `${permission.permissionKey} — ${permission.title}`,
                }))}
            />
          </>
        ) : null}

        <AccessConfirm
          cancelLabel={strings.roleCaps.cancel}
          confirmLabel={strings.roleCaps.confirm}
          message={confirmMessage(confirming, roleKey, strings)}
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
    return fill(strings.roleCaps.confirmRevoke, { permission: pending.permissionKey, role });
  }
  return fill(strings.roleCaps.confirmGrantSod, { role });
}
