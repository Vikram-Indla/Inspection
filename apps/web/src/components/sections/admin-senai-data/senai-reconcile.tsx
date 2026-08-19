import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Button from "@/components/saqeel/button/button";
import { Metric, Mono, Overline, Text } from "@/components/saqeel/type";
import type { AdminSenaiDataMessages } from "@/features/admin-senai-data/strings";
import type { ReconciliationRow, SenaiDataView } from "@/features/admin-senai-data/types";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./senai-data.module.css";

type Kpi = { readonly key: string; readonly label: string; readonly value: string; readonly note: string };

export default function SenaiReconcile({ data, strings, locale }: {
  data: SenaiDataView;
  strings: AdminSenaiDataMessages;
  locale: Locale;
}) {
  const s = strings.reconcile;
  const na = strings.unavailable;
  const kpis: readonly Kpi[] = [
    {
      key: "lastSync",
      label: s.lastSync,
      value: data.runsFailed ? na : data.latestRun ? formatDateTime(data.latestRun.created_at, locale) : strings.dash,
      note: data.runsFailed ? na : data.latestRun ? humaniseEnum(data.latestRun.status, locale) : s.noRun,
    },
    {
      key: "accepted",
      label: s.accepted,
      value: data.runsFailed ? na : String(data.reconciledRows),
      note: data.runsFailed ? s.runUnavailable : fill(s.acceptedDelta, { received: data.receivedRows }),
    },
    {
      key: "rejected",
      label: s.rejected,
      value: data.runsFailed ? na : String(data.rejectedRows),
      note: data.runsFailed ? s.runUnavailable : s.rejectedDelta,
    },
    {
      key: "unvalidated",
      label: s.unvalidated,
      value: data.connectionsFailed ? na : String(data.partialConnections),
      note: data.connectionsFailed ? s.registryUnavailable : fill(s.unvalidatedDelta, { total: data.totalConnections }),
    },
  ];

  const columns: readonly DataColumn<ReconciliationRow>[] = [
    { key: "entity", header: s.colEntity, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{humaniseEnum(row.entity_type, locale)}</Text> },
    { key: "external", header: s.colExternal, cell: row => row.external_id ? <Mono as="span">{row.external_id}</Mono> : <CellMuted>{strings.dash}</CellMuted> },
    { key: "outcome", header: s.colOutcome, cell: row => <StatusPill tone="warning">{humaniseEnum(row.outcome, locale)}</StatusPill> },
    { key: "reason", header: s.colReason, cell: row => <CellMuted>{(row.safe_reason_codes ?? []).join(", ") || s.noReason}</CellMuted> },
    { key: "at", header: s.colAt, cell: row => <Text as="time" tone="secondary">{formatDateTime(row.reconciled_at, locale)}</Text> },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.metrics}>
        {kpis.map(kpi => (
          <div className={styles.metric} key={kpi.key}>
            <Overline tone="secondary">{kpi.label}</Overline>
            <Metric>{kpi.value}</Metric>
            <Text role="label" tone="muted">{kpi.note}</Text>
          </div>
        ))}
      </div>
      {data.runsFailed ? <Text tone="warning" live="alert">{s.runsError}</Text> : null}
      {data.connectionsFailed ? <Text tone="warning" live="alert">{s.connectionsError}</Text> : null}
      {data.reconciliationFailed ? <Text tone="warning" live="alert">{s.error}</Text> : null}
      <Card as="section">
        <CardBody>
          <DataTable
            caption={s.caption}
            columns={columns}
            empty={{ icon: "radar", title: s.emptyTitle, description: s.emptyBody }}
            getRowId={row => row.id}
            rows={data.divergences}
          />
        </CardBody>
      </Card>
      <Text role="label" tone="muted">{s.footer}</Text>
      <Button href="/admin/integrations/factory-data" variant="secondary">{s.openHistory}</Button>
    </div>
  );
}
