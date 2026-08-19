import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminSenaiDataMessages } from "@/features/admin-senai-data/strings";
import type { EndpointView, SenaiDataView } from "@/features/admin-senai-data/types";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./senai-data.module.css";

function outcomeTone(outcome: string): StatusTone {
  if (outcome === "accepted") return "success";
  if (outcome === "rejected" || outcome === "dependency_blocked") return "warning";
  return "danger";
}

export default function SenaiEndpoints({ data, strings, locale }: {
  data: SenaiDataView;
  strings: AdminSenaiDataMessages;
  locale: Locale;
}) {
  const s = strings.endpoints;
  const columns: readonly DataColumn<EndpointView>[] = [
    { key: "method", header: s.colMethod, width: "min", cell: view => <StatusPill tone="info" ping={false}>{view.endpoint.method}</StatusPill> },
    {
      key: "endpoint",
      header: s.colEndpoint,
      isRowHeader: true,
      cell: view => (
        <span className={styles.cellStack}>
          <Mono as="span">{view.endpoint.template}</Mono>
          <Text as="span" role="label" tone="muted">{view.endpoint.authFamily === "public_v3" ? s.publicRoot : s.gatedRoot}</Text>
        </span>
      ),
    },
    {
      key: "purpose",
      header: s.colPurpose,
      cell: view => (
        <span className={styles.cellStack}>
          <Text as="span">{view.endpoint.purpose}</Text>
          {view.endpoint.governanceBlock ? (
            <Text as="span" role="label" tone="warning">{`${view.endpoint.governanceBlock} · ${s.blocked}`}</Text>
          ) : null}
        </span>
      ),
    },
    {
      key: "lastCall",
      header: s.colLastCall,
      cell: view => data.callsFailed
        ? <CellMuted>{strings.unavailable}</CellMuted>
        : view.call
          ? <Text as="time" tone="secondary">{formatDateTime(view.call.occurred_at, locale)}</Text>
          : <CellMuted>{strings.dash}</CellMuted>,
    },
    { key: "verification", header: s.colVerification, cell: view => <Verification view={view} data={data} strings={strings} locale={locale} /> },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <Text tone="secondary">{s.help}</Text>
        <StatusPill tone="info" ping={false}>
          {data.callsFailed ? s.verificationUnavailableShort : fill(s.verified, { verified: data.verifiedEndpoints, total: data.totalEndpoints })}
        </StatusPill>
      </div>
      {data.callsFailed ? <Text tone="warning" live="alert">{s.callsError}</Text> : null}
      <Card as="section">
        <CardBody>
          <DataTable
            caption={s.caption}
            columns={columns}
            empty={{ icon: "workflow", title: s.caption, description: s.help }}
            getRowId={view => view.endpoint.key}
            rows={data.endpoints}
          />
        </CardBody>
      </Card>
      <Text role="label" tone="muted">{s.footer}</Text>
    </div>
  );
}

function Verification({ view, data, strings, locale }: {
  view: EndpointView;
  data: SenaiDataView;
  strings: AdminSenaiDataMessages;
  locale: Locale;
}) {
  const s = strings.endpoints;
  if (data.callsFailed) {
    return (
      <span className={styles.cellStack}>
        <StatusPill tone="warning">{strings.unavailable}</StatusPill>
        <Text as="span" role="label" tone="muted">{s.verificationUnavailable}</Text>
      </span>
    );
  }
  if (!view.call) {
    return (
      <span className={styles.cellStack}>
        <StatusPill tone="neutral">{s.unverified}</StatusPill>
        <Text as="span" role="label" tone="muted">{s.noCall}</Text>
      </span>
    );
  }
  const httpText = view.call.http_status !== null ? `HTTP ${view.call.http_status}` : s.noStatus;
  const detail = view.call.safe_error_code ? `${httpText} · ${view.call.safe_error_code}` : httpText;
  return (
    <span className={styles.cellStack}>
      <StatusPill tone={outcomeTone(view.call.outcome)}>{humaniseEnum(view.call.outcome, locale)}</StatusPill>
      <Mono as="span" tone="muted">{detail}</Mono>
    </span>
  );
}
