import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminSenaiDataMessages } from "@/features/admin-senai-data/strings";
import type { ConnectionView, SenaiDataView } from "@/features/admin-senai-data/types";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./senai-data.module.css";

function statusTone(status: string): StatusTone {
  if (status === "validated") return "success";
  if (status === "configured") return "warning";
  return "neutral";
}

export default function SenaiSources({ data, strings, locale }: {
  data: SenaiDataView;
  strings: AdminSenaiDataMessages;
  locale: Locale;
}) {
  const s = strings.sources;
  const columns: readonly DataColumn<ConnectionView>[] = [
    {
      key: "system",
      header: s.colSystem,
      isRowHeader: true,
      cell: view => (
        <span className={styles.cellStack}>
          <Mono as="span" tone="primary">{view.row.provider_key}</Mono>
          <Mono as="span" tone="muted">{view.row.base_url_origin ?? strings.notConfigured}</Mono>
        </span>
      ),
    },
    { key: "env", header: s.colEnv, cell: view => <Text as="span">{humaniseEnum(view.row.environment, locale)}</Text> },
    {
      key: "contract",
      header: s.colContract,
      cell: view => view.row.contract_version
        ? <Mono as="span">{view.row.contract_version}</Mono>
        : <CellMuted>{strings.notConfigured}</CellMuted>,
    },
    {
      key: "runs",
      header: s.colRuns,
      numeric: true,
      align: "end",
      cell: view => data.runsFailed
        ? <CellMuted>{strings.unavailable}</CellMuted>
        : <Text as="span" numeric>{String(view.callCount)}</Text>,
    },
    {
      key: "freshness",
      header: s.colFreshness,
      cell: view => data.runsFailed
        ? <CellMuted>{strings.unavailable}</CellMuted>
        : view.latestRun
          ? <Text as="time" tone="secondary">{formatDateTime(view.latestRun.created_at, locale)}</Text>
          : <CellMuted>{s.noRun}</CellMuted>,
    },
    {
      key: "status",
      header: s.colStatus,
      cell: view => (
        <span className={styles.cellStack}>
          <StatusPill tone={statusTone(view.row.configuration_status)}>{humaniseEnum(view.row.configuration_status, locale)}</StatusPill>
          {!view.row.enabled ? <Text as="span" role="label" tone="muted">{s.disabled}</Text> : null}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.section}>
      <Text tone="secondary">{s.help}</Text>
      {data.connectionsFailed ? <Text tone="warning" live="alert">{s.error}</Text> : null}
      {data.runsFailed ? <Text tone="warning" live="alert">{s.runsError}</Text> : null}
      <Card as="section">
        <CardBody>
          <DataTable
            caption={s.caption}
            columns={columns}
            empty={{ icon: "organisation", title: s.emptyTitle, description: s.emptyBody }}
            getRowId={view => view.row.id}
            rows={data.connections}
          />
        </CardBody>
      </Card>
      <Text role="label" tone="muted">{data.runsFailed ? s.footerUnavailable : s.footer}</Text>
    </div>
  );
}
