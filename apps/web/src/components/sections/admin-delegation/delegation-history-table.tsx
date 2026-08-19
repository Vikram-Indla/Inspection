"use client";

import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import {
  effectiveDelegationStatus,
  scopeLabel,
  statusLabel,
  type AdminDelegationMessages,
} from "@/features/admin-delegation/strings";
import type { DelegationRow, EffectiveStatus } from "@/features/admin-delegation/types";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const STATUS_TONE: Readonly<Record<EffectiveStatus, StatusTone>> = {
  active: "success",
  expired: "warning",
  revoked: "neutral",
};

export default function DelegationHistoryTable({ rows, now, locale, strings }: {
  rows: readonly DelegationRow[];
  now: number;
  locale: Locale;
  strings: AdminDelegationMessages;
}) {
  const t = strings.table;
  const columns: readonly DataColumn<DelegationRow>[] = [
    { key: "delegator", header: t.delegator, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{row.delegator?.full_name ?? "—"}</Text> },
    { key: "delegate", header: t.delegate, cell: row => <Text as="span">{row.delegate?.full_name ?? "—"}</Text> },
    { key: "scope", header: t.scope, cell: row => <Text as="span">{scopeLabel(row.scope, locale)}</Text> },
    { key: "window", header: t.window, cell: row => <Text as="span" role="mono" dir="ltr">{formatDateRange(row.starts_at, row.ends_at, locale)}</Text> },
    { key: "status", header: t.status, cell: row => {
      const status = effectiveDelegationStatus(row, now);
      return <StatusPill tone={STATUS_TONE[status]}>{statusLabel(status, strings)}</StatusPill>;
    } },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={row => row.id}
      caption={t.caption}
      empty={{ icon: "elapsed", title: strings.empty.historyTitle, description: strings.empty.historyBody }}
      bleed={false}
    />
  );
}
