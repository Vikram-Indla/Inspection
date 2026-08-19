import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminIntegrationsMessages } from "@/features/admin-integrations/strings";
import type { EndpointRow } from "@/features/admin-integrations/types";
import { fill } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import styles from "./integrations.module.css";

export default function IntegrationRegistry({ endpoints, failed, strings, locale }: {
  endpoints: readonly EndpointRow[];
  failed: boolean;
  strings: AdminIntegrationsMessages;
  locale: Locale;
}) {
  const columns: readonly DataColumn<EndpointRow>[] = [
    {
      key: "name",
      header: strings.registry.colName,
      isRowHeader: true,
      cell: row => (
        <>
          <Text as="span" role="bodyStrong">{row.display_name}</Text>
          <Mono tone="muted" as="span"> {row.endpoint_key}</Mono>
        </>
      ),
    },
    {
      key: "type",
      header: strings.registry.colType,
      cell: row => <Text as="span">{humaniseEnum(row.endpoint_kind, locale)}</Text>,
    },
    {
      key: "contract",
      header: strings.registry.colContract,
      cell: row => row.contract_version
        ? <Mono as="span">{row.contract_version}</Mono>
        : <CellMuted>{strings.notConfigured}</CellMuted>,
    },
    {
      key: "status",
      header: strings.registry.colStatus,
      cell: row => (
        <span className={styles.activityMain}>
          <StatusPill tone={row.status === "configured" ? "success" : "warning"}>
            {humaniseEnum(row.status, locale)}
          </StatusPill>
          <Text as="time" role="label" tone="muted">{formatDateTime(row.updated_at, locale)}</Text>
        </span>
      ),
    },
  ];

  return (
    <Card as="section">
      <CardHeader
        level="h2"
        title={strings.registry.title}
        description={strings.registry.help}
        trailing={<Text as="span" role="label" tone="muted">{fill(strings.registry.count, { count: endpoints.length })}</Text>}
      />
      <CardBody>
        {failed ? <Text tone="warning" live="alert">{strings.registry.error}</Text> : null}
        <DataTable
          columns={columns}
          empty={{ icon: "externalLink", title: strings.registry.emptyTitle, description: strings.registry.emptyBody }}
          getRowId={row => row.id}
          rows={endpoints}
        />
      </CardBody>
    </Card>
  );
}
