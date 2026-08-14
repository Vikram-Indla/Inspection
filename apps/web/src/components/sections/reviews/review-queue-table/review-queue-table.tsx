import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import ReviewReadiness from "@/components/sections/reviews/review-readiness/review-readiness";
import type { ReviewsStrings } from "@/features/reviews/strings";
import type { QueueRow } from "@/features/reviews/types";
import styles from "./review-queue-table.module.css";

export default function ReviewQueueTable({ rows, strings }: {
  rows: readonly QueueRow[];
  strings: ReviewsStrings;
}) {
  const columns: readonly DataColumn<QueueRow>[] = [
    {
      key: "factory",
      header: strings.columns.factory,
      isRowHeader: true,
      cell: row => (
        <span className={styles.stack}>
          <Text role="bodyStrong" as="span" dir="auto">{row.factoryName}</Text>
          <Mono>{row.factoryCode}</Mono>
          <Text role="label" tone="muted" as="span" dir="auto">{row.typeLabel} · {row.modeLabel}</Text>
        </span>
      ),
    },
    {
      key: "inspector",
      header: strings.columns.inspector,
      cell: row => <Text as="span" tone="secondary" dir="auto">{row.inspectorName || "—"}</Text>,
    },
    {
      key: "version",
      header: strings.columns.version,
      numeric: true,
      cell: row => (
        <span className={styles.stack}>
          <Text role="bodyStrong" as="span" numeric>v{row.versionNumber ?? "—"}</Text>
          <Text role="label" tone="muted" as="span" numeric>{row.submittedDisplay}</Text>
        </span>
      ),
    },
    {
      key: "readiness",
      header: strings.columns.readiness,
      cell: row => <ReviewReadiness row={row} strings={strings} />,
    },
    {
      key: "status",
      header: strings.columns.status,
      cell: row => <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>,
    },
    {
      key: "open",
      header: strings.columns.open,
      align: "end",
      width: "min",
      cell: row => (
        <Button variant="secondary" size="sm" href={row.href} label={strings.open} title={strings.openHint}>
          {strings.open}
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      caption={strings.title}
      density="compact"
      empty={{ icon: "review", title: strings.noMatch.title, description: strings.noMatch.body }}
    />
  );
}
