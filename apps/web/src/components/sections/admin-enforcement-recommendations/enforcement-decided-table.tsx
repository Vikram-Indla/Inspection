"use client";

import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import {
  decisionStatusLabel,
  decisionStatusTone,
  measureLabel,
  type EnforcementRecommendationsMessages,
} from "@/features/admin-enforcement-recommendations/strings";
import type { DecidedRow } from "@/features/admin-enforcement-recommendations/types";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

export default function EnforcementDecidedTable({ decided, strings, locale }: {
  decided: readonly DecidedRow[];
  strings: EnforcementRecommendationsMessages;
  locale: Locale;
}) {
  const t = strings.decidedTable;
  const columns: readonly DataColumn<DecidedRow>[] = [
    { key: "factory", header: t.factory, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{row.factoryName ?? "—"}</Text> },
    { key: "measure", header: t.measure, cell: row => <Text as="span">{measureLabel(row.recommended_action, strings)}</Text> },
    { key: "decision", header: t.decision, cell: row => <StatusPill tone={decisionStatusTone(row.status)}>{decisionStatusLabel(row.status, strings)}</StatusPill> },
    { key: "decided", header: t.decided, cell: row => row.decided_at
      ? <Text as="span" role="mono" tone="muted" dir="ltr">{formatDateTime(row.decided_at, locale)}</Text>
      : <Text as="span" tone="muted">—</Text> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={decided}
      getRowId={row => row.id}
      empty={{ icon: "review", title: strings.noneDecided }}
      bleed={false}
    />
  );
}
