"use client";

import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { EffectiveCapability } from "@/features/admin-access/view";
import { fill } from "@/i18n/messages";
import AccessGrantRow from "./access-grant-row";
import styles from "./access-manager.module.css";

export type CapabilityOption = { readonly capabilityKey: string; readonly label: string };

export default function AccessCapabilities({
  effective, catalogue, strings, disabled, onRevoke, onGrant,
}: {
  effective: readonly EffectiveCapability[];
  catalogue: readonly CapabilityOption[];
  strings: AdminAccessMessages;
  disabled: boolean;
  onRevoke: (capabilityKey: string, label: string) => void;
  onGrant: (capabilityKey: string) => void;
}) {
  const labels = new Map(catalogue.map(entry => [entry.capabilityKey, entry.label]));
  const nameOf = (capabilityKey: string) => labels.get(capabilityKey) || capabilityKey;
  const held = new Set(effective.map(entry => entry.capabilityKey));
  const anyRevocable = effective.some(entry => entry.direct);

  const columns: readonly DataColumn<EffectiveCapability>[] = [
    {
      key: "capability",
      header: strings.manage.capability,
      isRowHeader: true,
      cell: row => <Text as="span" clamp={2} role="bodyStrong">{nameOf(row.capabilityKey)}</Text>,
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
  ];

  const withActions: readonly DataColumn<EffectiveCapability>[] = anyRevocable
    ? [...columns, {
      key: "actions",
      header: strings.manage.actions,
      align: "end",
      width: "min",
      headerHidden: true,
      cell: row => row.direct ? (
        <Button
          disabled={disabled}
          label={fill(strings.manage.revokeCapability, { name: nameOf(row.capabilityKey) })}
          onClick={() => onRevoke(row.capabilityKey, nameOf(row.capabilityKey))}
          size="sm"
          variant="tertiary"
        >
          {strings.manage.revoke}
        </Button>
      ) : null,
    }]
    : columns;

  return (
    <section className={styles.section}>
      <Heading level={3} visual="subheading">{strings.manage.capabilitiesTitle}</Heading>
      <Text tone="secondary">{strings.manage.capabilitiesHint}</Text>
      <DataTable
        columns={withActions}
        density="compact"
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
        options={catalogue
          .filter(entry => !held.has(entry.capabilityKey))
          .map(entry => ({ value: entry.capabilityKey, label: nameOf(entry.capabilityKey) }))}
      />
    </section>
  );
}
