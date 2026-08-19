import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { ComplianceRequestsListData } from "@/features/admin-compliance-requests/queries";
import { statusTone, type RequestListRow } from "@/features/admin-compliance-requests/types";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./compliance-requests.module.css";

export default function RegisterScreen({ data, locale }: {
  data: ComplianceRequestsListData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminComplianceRequests;
  const lang = locale === "ar" ? "ar" : "en";
  const c = copy.list;

  const statusLabel = (value: string): string => copy.status[value as keyof typeof copy.status] ?? humaniseEnum(value, lang);
  const typeLabel = (value: string): string => copy.kinds[value as keyof typeof copy.kinds] ?? humaniseEnum(value, lang);

  const columns: DataColumn<RequestListRow>[] = [
    {
      key: "request",
      header: c.colRequest,
      isRowHeader: true,
      cell: row => (
        <span className={styles.reqCell}>
          <CellLink href={`/admin/compliance-requests/${row.id}`}><bdi><Mono>{row.request_number}</Mono></bdi></CellLink>
          <Text role="label" tone="secondary" as="span" dir="auto">{row.title}</Text>
        </span>
      ),
    },
    { key: "type", header: c.colType, cell: row => <Text as="span">{typeLabel(row.request_type)}</Text> },
    {
      key: "status",
      header: c.colStatus,
      cell: row => <StatusPill tone={statusTone(row.status)} ping={false}>{statusLabel(row.status)}</StatusPill>,
    },
    { key: "rev", header: c.colRevision, cell: row => <Text as="span" tone="secondary">{fill(copy.common.revisionShort, { n: row.current_revision })}</Text> },
    { key: "created", header: c.colCreated, cell: row => <Text as="span" tone="secondary">{formatDate(row.created_at, lang)}</Text> },
  ];

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.list}
      breadcrumbs={[{ label: copy.breadcrumb.administration, href: "/admin" }, { label: c.title }]}
      title={c.title}
      description={c.subtitle}
      actions={data.canCreate ? (
        <Button href="/admin/compliance-requests/new" prefetch={false} variant="primary" size="sm" icon="create">
          {c.create}
        </Button>
      ) : undefined}
    >
      <div className={styles.stack}>
        {data.canCreate ? null : <Text tone="muted">{c.createRoleNote}</Text>}
        {data.readFailed ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={c.errorTitle} />
            <CardBody><Text tone="secondary">{c.errorBody}</Text></CardBody>
          </Card>
        ) : (
          <DataTable
            rows={data.rows}
            columns={columns}
            getRowId={row => row.id}
            empty={{ title: c.emptyTitle, description: c.emptyBody, icon: "forms" }}
          />
        )}
      </div>
    </ShellPageFrame>
  );
}
