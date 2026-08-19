"use client";

import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { requestRetry } from "@/app/(app)/admin/operations/actions";
import {
  errorStatusLabel,
  errorStatusTone,
  RETRYABLE_ERROR_STATUSES,
  type AdminOperationsMessages,
} from "@/features/admin-operations/strings";
import type { ErrorQueueRow } from "@/features/admin-operations/types";
import type { Locale } from "@/lib/i18n";
import OpsActionForm from "./ops-action-form";
import styles from "./operations.module.css";

export default function OperationsErrorQueue({ errors, strings, locale }: {
  errors: readonly ErrorQueueRow[];
  strings: AdminOperationsMessages;
  locale: Locale;
}) {
  const q = strings.errorQueue;
  const columns: readonly DataColumn<ErrorQueueRow>[] = [
    { key: "source", header: q.source, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{row.source}</Text> },
    { key: "operation", header: q.operation, cell: row => <Text as="span">{row.operation}</Text> },
    { key: "status", header: q.status, cell: row => (
      <span className={styles.statusCell}>
        <StatusPill tone={errorStatusTone(row.status)}>{errorStatusLabel(row.status, strings, locale)}</StatusPill>
        <Text as="span" role="mono" tone="muted">{row.last_error_code ?? "—"}</Text>
      </span>
    ) },
    { key: "attempts", header: q.attempts, cell: row => <Text as="span" role="mono" numeric>{String(row.attempt_count)}</Text> },
    { key: "action", header: q.action, cell: row => RETRYABLE_ERROR_STATUSES.includes(row.status)
      ? <OpsActionForm action={requestRetry} fieldName="errorId" fieldValue={row.id} submitLabel={q.retry} strings={strings} />
      : <Text as="span" tone="muted">—</Text> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={errors}
      getRowId={row => row.id}
      empty={{ icon: "radar", title: q.empty }}
      bleed={false}
    />
  );
}
