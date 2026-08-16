"use client";

import { useState, useTransition } from "react";
import {
  grantCapability,
  grantRole,
  revokeCapability,
  revokeRole,
  type AccessActionResult,
} from "@/app/(app)/admin/access/actions";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SaqeelSelect from "@/components/saqeel/select/select";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { RoleRow, UserAccess } from "@/features/admin-access/view";
import { fill } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import AccessCapabilities from "./access-capabilities";
import AccessConfirm, { type PendingChange } from "./access-confirm";
import AccessGrantRow from "./access-grant-row";
import styles from "./access-manager.module.css";

export default function AccessManager({
  users, roles, capabilities, access, currentUserId, initialUserId, strings, locale,
}: {
  users: readonly { userId: string; name: string; email: string | null }[];
  roles: readonly RoleRow[];
  capabilities: readonly { capabilityKey: string }[];
  access: readonly UserAccess[];
  currentUserId: string;
  initialUserId: string;
  strings: AdminAccessMessages;
  locale: Locale;
}) {
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [confirming, setConfirming] = useState<PendingChange | null>(null);
  const [feedback, setFeedback] = useState<AccessActionResult>({});
  const [pending, startTransition] = useTransition();

  const selected = access.find(entry => entry.userId === selectedUserId) ?? null;
  const isSelf = selectedUserId !== "" && selectedUserId === currentUserId;
  const disabled = pending || isSelf;

  const run = (action: (data: FormData) => Promise<AccessActionResult>, field: string, key: string) => {
    const data = new FormData();
    data.set("user_id", selectedUserId);
    data.set(field, key);
    setConfirming(null);
    setFeedback({});
    startTransition(async () => setFeedback(await action(data)));
  };

  const onSelectUser = (value: string) => {
    setSelectedUserId(value);
    setConfirming(null);
    setFeedback({});
  };

  const requestGrantRole = (roleKey: string) => {
    if (roles.find(role => role.role_key === roleKey)?.is_admin) {
      setConfirming({ kind: "grantAdminRole", key: roleKey });
      return;
    }
    run(grantRole, "role_key", roleKey);
  };

  const onConfirm = () => {
    if (!confirming) return;
    if (confirming.kind === "revokeRole") run(revokeRole, "role_key", confirming.key);
    else if (confirming.kind === "grantAdminRole") run(grantRole, "role_key", confirming.key);
    else run(revokeCapability, "capability_key", confirming.key);
  };

  const heldRoles = new Set(selected?.roles.map(grant => grant.roleKey) ?? []);
  const heldGrants = new Set(selected?.directGrants.map(grant => grant.capabilityKey) ?? []);

  return (
    <Card>
      <CardHeader level="h2" title={strings.manage.title} description={strings.manage.intro} />
      <CardBody>
        <div className={styles.picker}>
          <SaqeelSelect
            emptyLabel={strings.manage.noUsers}
            label={strings.manage.selectUser}
            onChange={onSelectUser}
            options={users.map(user => ({
              value: user.userId,
              label: user.email ? `${user.name} · ${user.email}` : user.name,
            }))}
            placeholder={strings.manage.selectUserPlaceholder}
            value={selectedUserId}
          />
        </div>

        {isSelf ? (
          <EmptyState icon="restricted" title={strings.manage.selfTarget} tone="warning" variant="inline" />
        ) : null}

        {selected ? (
          <>
            <section className={styles.section}>
              <Heading level={3} visual="subheading">{strings.manage.rolesTitle}</Heading>
              <ul className={styles.pills}>
                {selected.roles.map(grant => (
                  <li className={styles.pill} key={grant.roleKey}>
                    <StatusPill ping={false} tone="neutral">
                      <Mono tone="inherit">{grant.roleKey}</Mono>
                    </StatusPill>
                    <Text as="span" role="label" tone="muted">
                      {fill(strings.manage.grantedAt, { date: formatDate(grant.grantedAt, locale) })}
                    </Text>
                    <Button
                      disabled={disabled}
                      label={fill(strings.manage.revokeRole, { key: grant.roleKey })}
                      onClick={() => setConfirming({ kind: "revokeRole", key: grant.roleKey })}
                      size="sm"
                      variant="danger"
                    >
                      {strings.manage.revoke}
                    </Button>
                  </li>
                ))}
              </ul>
              <AccessGrantRow
                action={requestGrantRole}
                actionLabel={strings.manage.grantRole}
                disabled={disabled}
                emptyLabel={strings.manage.noGrantableRoles}
                label={strings.manage.selectRoleToGrant}
                options={roles
                  .filter(role => !heldRoles.has(role.role_key))
                  .map(role => ({
                    value: role.role_key,
                    label: role.is_admin
                      ? fill(strings.manage.adminSuffix, { key: role.role_key })
                      : role.role_key,
                  }))}
              />
            </section>

            <AccessCapabilities
              disabled={disabled}
              effective={selected.effective}
              grantable={capabilities
                .map(entry => entry.capabilityKey)
                .filter(key => !heldGrants.has(key))}
              onGrant={key => run(grantCapability, "capability_key", key)}
              onRevoke={key => setConfirming({ kind: "revokeCapability", key })}
              strings={strings}
            />
          </>
        ) : null}

        <AccessConfirm
          cancelLabel={strings.manage.cancel}
          confirmLabel={strings.manage.confirm}
          message={confirmMessage(confirming, strings)}
          onCancel={() => setConfirming(null)}
          onConfirm={onConfirm}
          pending={pending}
          workingLabel={strings.manage.working}
        />

        {feedback.ok && !pending ? (
          <StatusPill tone="success">{strings.manage.saved}</StatusPill>
        ) : null}
        {feedback.error ? (
          <EmptyState icon="risk" title={feedback.error} tone="danger" variant="inline" />
        ) : null}
      </CardBody>
    </Card>
  );
}

function confirmMessage(pending: PendingChange | null, strings: AdminAccessMessages): string {
  if (!pending) return "";
  if (pending.kind === "revokeRole") return fill(strings.manage.confirmRevokeRole, { key: pending.key });
  if (pending.kind === "grantAdminRole") return fill(strings.manage.confirmGrantAdminRole, { key: pending.key });
  return fill(strings.manage.confirmRevokeCapability, { key: pending.key });
}
