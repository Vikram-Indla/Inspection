"use client";

import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { EffectiveCapability } from "@/features/admin-access/view";
import { fill } from "@/i18n/messages";
import AccessGrantRow from "./access-grant-row";
import styles from "./access-manager.module.css";

export default function AccessCapabilities({
  effective, grantable, strings, disabled, onRevoke, onGrant,
}: {
  effective: readonly EffectiveCapability[];
  grantable: readonly string[];
  strings: AdminAccessMessages;
  disabled: boolean;
  onRevoke: (capabilityKey: string) => void;
  onGrant: (capabilityKey: string) => void;
}) {
  const columns: readonly DataColumn<EffectiveCapability>[] = [
    {
      key: "capability",
      header: strings.manage.capability,
      isRowHeader: true,
      cell: row => <Mono tone="primary">{row.capabilityKey}</Mono>,
    },
    {
      key: "source",
      header: strings.manage.source,
      cell: row => (
        <span className={styles.sources}>
          {row.viaRoles.map(role => (
            <StatusPill key={role} ping={false} tone="info">
              {fill(strings.manage.viaRole, { role })}
            </StatusPill>
          ))}
          {row.direct ? <StatusPill ping={false} tone="accent">{strings.manage.directGrant}</StatusPill> : null}
        </span>
      ),
    },
    {
      key: "actions",
      header: strings.manage.actions,
      align: "end",
      width: "min",
      headerHidden: true,
      cell: row => row.direct ? (
        <Button
          disabled={disabled}
          label={fill(strings.manage.revokeCapability, { key: row.capabilityKey })}
          onClick={() => onRevoke(row.capabilityKey)}
          size="sm"
          variant="danger"
        >
          {strings.manage.revoke}
        </Button>
      ) : null,
    },
  ];

  return (
    <section className={styles.section}>
      <Heading level={3} visual="subheading">{strings.manage.capabilitiesTitle}</Heading>
      <Text tone="secondary">{strings.manage.capabilitiesHint}</Text>
      <DataTable
        columns={columns}
        empty={{ icon: "access", title: strings.manage.noCapabilities }}
        getRowId={row => row.capabilityKey}
        rows={effective}
      />
      <AccessGrantRow
        action={onGrant}
        actionLabel={strings.manage.grantCapability}
        disabled={disabled}
        emptyLabel={strings.manage.noGrantableCapabilities}
        label={strings.manage.selectCapabilityToGrant}
        options={grantable.map(capabilityKey => ({ value: capabilityKey, label: capabilityKey }))}
      />
    </section>
  );
}
