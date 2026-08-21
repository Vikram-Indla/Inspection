import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminHomeRead, AuditRow, RequestRow } from "@/features/admin-home/queries";
import { fill } from "@/i18n/messages";
import type { Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./admin-home.module.css";

export default function AdminHomeScreen({ data, nowMs, locale, strings }: {
  data: AdminHomeRead;
  nowMs: number;
  locale: Locale;
  strings: Messages["adminHome"];
}) {
  const areaMap: Record<string, string> = strings.area;
  const areaLabel = (row: RequestRow): string => {
    if (data.componentsError) return strings.unavailable;
    const kinds = Array.from(new Set(
      data.components
        .filter(component => component.request_id === row.id && component.revision_number === row.current_revision)
        .map(component => component.entity_kind),
    ));
    if (!kinds.length) return strings.notConfigured;
    return kinds.map(kind => areaMap[kind] ?? kind).join(strings.listSeparator);
  };
  const waitingLabel = (submittedAt: string | null): string => {
    if (!submittedAt) return strings.notConfigured;
    const ms = nowMs - new Date(submittedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return strings.notConfigured;
    const hours = Math.floor(ms / 3_600_000);
    return hours < 24 ? fill(strings.hours, { n: hours }) : fill(strings.days, { n: Math.floor(hours / 24) });
  };

  const requestColumns: DataColumn<RequestRow>[] = [
    { key: "request", header: strings.waiting.colRequest, isRowHeader: true,
      cell: row => <span className={styles.stackCell}><Text as="span" role="bodyStrong">{row.title}</Text><Mono>{row.request_number}</Mono></span> },
    { key: "area", header: strings.waiting.colArea, cell: row => areaLabel(row) },
    { key: "by", header: strings.waiting.colRequestedBy, cell: row => <Text as="span" dir="auto">{data.names[row.owner_id] ?? strings.unknownUser}</Text> },
    { key: "waiting", header: strings.waiting.colWaiting, cell: row => <bdi dir="ltr">{waitingLabel(row.submitted_at)}</bdi> },
    { key: "action", header: strings.waiting.colNextAction, align: "end", width: "min",
      cell: row => (
        <Button variant="primary" size="sm" href={`/admin/compliance-requests/${row.id}?from=approval-queue`} label={strings.waiting.review}>
          {strings.waiting.review}
        </Button>
      ) },
  ];

  const auditColumns: DataColumn<AuditRow>[] = [
    { key: "change", header: strings.audit.colChange, isRowHeader: true,
      cell: row => {
        const ref = row.object_id ? data.requestRefs[row.object_id] : null;
        return (
          <span className={styles.stackCell}>
            <Text as="span" role="bodyStrong">{strings.audit.published}</Text>
            <Mono>{row.action}{ref ? ` · ${ref}` : ""} · <bdi dir="ltr">#{row.id}</bdi></Mono>
          </span>
        );
      } },
    { key: "area", header: strings.audit.colArea, cell: () => strings.audit.areaValue },
    { key: "actor", header: strings.audit.colActor,
      cell: row => <Text as="span" dir="auto">{row.actor ? data.names[row.actor] ?? strings.unknownUser : strings.audit.system}</Text> },
    { key: "when", header: strings.audit.colWhen,
      cell: row => <bdi dir="ltr">{row.occurred_at ? formatDateTime(row.occurred_at, locale) : strings.notConfigured}</bdi> },
  ];

  const noPanels = !data.roleError && !data.canReview && !data.canAudit;

  return (
    <div className={styles.root}>
      {data.roleError ? (
        <EmptyState variant="inline" tone="warning" icon="restricted"
          title={strings.roleError.title} description={strings.roleError.body} />
      ) : null}

      {noPanels ? (
        <EmptyState icon="selected" title={strings.noPanels.title} description={strings.noPanels.body} />
      ) : null}

      {data.canReview ? (
        <Card as="section">
          <CardHeader level="h2" title={strings.waiting.title} description={strings.waiting.desc}
            trailing={
              <Button variant="secondary" size="sm" href="/admin/compliance-approvals?view=pending" label={strings.waiting.cta}>
                {strings.waiting.cta}
              </Button>
            } />
          <CardBody>
            {data.requestsError || data.componentsError ? (
              <EmptyState variant="inline" tone="warning" icon="risk" title={strings.waiting.loadErrorTitle}
                description={data.requestsError ? strings.waiting.loadErrorList : strings.waiting.loadErrorDetail} />
            ) : data.requests.length === 0 ? (
              <EmptyState variant="inline" icon="selected" title={strings.waiting.empty} />
            ) : (
              <DataTable rows={data.requests} columns={requestColumns} getRowId={row => row.id}
                empty={{ icon: "selected", title: strings.waiting.empty }} />
            )}
          </CardBody>
        </Card>
      ) : null}

      {data.canAudit ? (
        <Card as="section">
          <CardHeader level="h2" title={strings.audit.title} description={strings.audit.desc}
            trailing={
              <Button variant="secondary" size="sm" href="/admin/audit?view=recorder&q=compliance_configuration_request" label={strings.audit.cta}>
                {strings.audit.cta}
              </Button>
            } />
          <CardBody>
            {data.auditError ? (
              <EmptyState variant="inline" tone="warning" icon="risk" title={strings.audit.loadErrorTitle} description={strings.audit.loadErrorBody} />
            ) : data.audit.length === 0 ? (
              <EmptyState variant="inline" icon="selected" title={strings.audit.empty} />
            ) : (
              <DataTable rows={data.audit} columns={auditColumns} getRowId={row => String(row.id)}
                empty={{ icon: "selected", title: strings.audit.empty }} />
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
