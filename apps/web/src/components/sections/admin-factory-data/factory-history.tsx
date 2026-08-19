import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { FactoryDataView, RunWithBatch } from "@/features/admin-factory-data/types";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./factory-data.module.css";

function runTone(status: string): StatusTone {
  if (status === "completed" || status === "validated") return "success";
  if (status === "partial" || status === "queued" || status === "running") return "warning";
  return "danger";
}

export default function FactoryHistory({ data, strings, locale }: {
  data: FactoryDataView;
  strings: AdminFactoryDataMessages;
  locale: Locale;
}) {
  const h = strings.history;
  const columns: readonly DataColumn<RunWithBatch>[] = [
    { key: "created", header: h.colCreated, isRowHeader: true, cell: ({ run }) => <Text as="time" tone="secondary">{formatDateTime(run.created_at, locale)}</Text> },
    {
      key: "mode",
      header: h.colModeSource,
      cell: ({ run }) => (
        <span className={styles.cellStack}>
          <Text as="span">{humaniseEnum(run.mode, locale)}</Text>
          <Mono as="span" tone="muted">{run.source_file_name ?? h.providerSource}</Mono>
        </span>
      ),
    },
    {
      key: "status",
      header: h.colStatus,
      cell: ({ run, batch }) => (
        <span className={styles.cellStack}>
          <StatusPill tone={runTone(run.status)}>{humaniseEnum(run.status, locale)}</StatusPill>
          {batch ? <Text as="span" role="label" tone="muted">{fill(h.batchLabel, { status: humaniseEnum(batch.status, locale) })}</Text> : null}
        </span>
      ),
    },
    {
      key: "custody",
      header: h.colCustody,
      cell: ({ run, batch }) => (
        <span className={styles.cellStack}>
          <Mono as="span" tone="muted">{run.correlation_id ?? strings.dash}</Mono>
          <Mono as="span" tone="muted">{batch ? `SHA-256 ${batch.file_sha256.slice(0, 12)}…` : h.noBatchProvenance}</Mono>
        </span>
      ),
    },
    {
      key: "counts",
      header: h.colCounts,
      numeric: true,
      align: "end",
      cell: ({ run }) => <Mono as="span">{`${run.rows_received ?? 0} / ${run.rows_accepted ?? 0} / ${run.rows_rejected ?? 0}`}</Mono>,
    },
  ];

  return (
    <div className={styles.stack}>
      <Card as="section">
        <CardHeader level="h3" title={h.title} />
        <CardBody>
          {data.runsFailed ? <Text tone="warning" live="alert">{h.runsError}</Text> : null}
          {data.batchesFailed ? <Text tone="warning" live="alert">{h.batchesError}</Text> : null}
          <DataTable
            caption={h.title}
            columns={columns}
            empty={{ icon: "refresh", title: h.emptyTitle, description: h.emptyBody }}
            getRowId={({ run }) => run.id}
            rows={data.runs}
          />
        </CardBody>
      </Card>

      <div className={styles.split}>
        <Card as="section">
          <CardHeader level="h3" title={h.rejected.title} />
          <CardBody>
            {data.rejectedFailed ? (
              <Text tone="warning" live="alert">{h.rejected.error}</Text>
            ) : data.rejectedRows.length ? (
              <div className={styles.repList}>
                {data.rejectedRows.map(row => (
                  <div className={styles.cellStack} key={row.id}>
                    <span className={styles.selectedRow}>
                      <Text as="span" role="bodyStrong">{fill(h.rejected.row, { n: row.row_number })}</Text>
                      <StatusPill tone="danger">{humaniseEnum(row.status, locale)}</StatusPill>
                    </span>
                    <Mono as="span" tone="muted">{row.safe_error_codes.join(", ")}</Mono>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="inspect" title={h.rejected.emptyTitle} description={h.rejected.emptyBody} size="sm" />
            )}
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h3" title={h.reconciliation.title} />
          <CardBody>
            {data.reconciliationFailed ? (
              <Text tone="warning" live="alert">{h.reconciliation.error}</Text>
            ) : data.reconciliations.length ? (
              <div className={styles.repList}>
                {data.reconciliations.map(row => (
                  <div className={styles.cellStack} key={row.id}>
                    <span className={styles.selectedRow}>
                      <Text as="span" role="bodyStrong">{humaniseEnum(row.entity_type, locale)}</Text>
                      <StatusPill tone="warning">{humaniseEnum(row.outcome, locale)}</StatusPill>
                    </span>
                    <Mono as="span" tone="muted">{row.external_id ?? strings.dash}</Mono>
                    <Mono as="span" tone="muted">{row.safe_reason_codes.join(", ") || h.reconciliation.noReason}</Mono>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="radar" title={h.reconciliation.emptyTitle} description={h.reconciliation.emptyBody} size="sm" />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
