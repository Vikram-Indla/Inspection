"use client";

import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { publishFlag } from "@/app/(app)/admin/operations/actions";
import { flagStatusLabel, flagStatusTone, type AdminOperationsMessages } from "@/features/admin-operations/strings";
import type { FeatureFlagRow } from "@/features/admin-operations/types";
import type { Locale } from "@/lib/i18n";
import OpsActionForm from "./ops-action-form";
import styles from "./operations.module.css";

export default function OperationsFlagVersions({ flags, strings, locale }: {
  flags: readonly FeatureFlagRow[];
  strings: AdminOperationsMessages;
  locale: Locale;
}) {
  const f = strings.flags;
  const columns: readonly DataColumn<FeatureFlagRow>[] = [
    { key: "name", header: f.name, isRowHeader: true, cell: row => (
      <span className={styles.nameCell}>
        <Text as="span" role="bodyStrong">{row.flag_key}</Text>
        <Text as="span" tone="muted">{row.description}</Text>
      </span>
    ) },
    { key: "version", header: f.version, cell: row => <Text as="span" role="mono" numeric>{String(row.version)}</Text> },
    { key: "state", header: f.state, cell: row => <StatusPill tone={flagStatusTone(row.status)}>{flagStatusLabel(row.status, strings, locale)}</StatusPill> },
    { key: "value", header: f.value, cell: row => <Text as="span">{row.enabled ? f.enabled : f.disabled}</Text> },
    { key: "action", header: f.action, cell: row => row.status === "draft"
      ? <OpsActionForm action={publishFlag} fieldName="flagId" fieldValue={row.id} submitLabel={f.publish} strings={strings} />
      : <Text as="span" tone="muted">—</Text> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={flags}
      getRowId={row => row.id}
      empty={{ icon: "workflow", title: f.empty }}
      bleed={false}
    />
  );
}
