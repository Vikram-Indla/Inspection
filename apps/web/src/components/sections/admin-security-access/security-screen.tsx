import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import {
  adminSecurityAccessMessages,
  grantStateLabel,
  grantStateTone,
  reviewStatusLabel,
  reviewStatusTone,
} from "@/features/admin-security-access/strings";
import type { AccessReviewRow, SecurityAccessView } from "@/features/admin-security-access/types";
import { fill } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import AccessDecideForm from "./access-decide-form";
import styles from "./security.module.css";

export default function SecurityScreen({ data, locale }: { data: SecurityAccessView; locale: Locale }) {
  const strings = adminSecurityAccessMessages(locale);
  const r = strings.reviews;

  const columns: readonly DataColumn<AccessReviewRow>[] = [
    { key: "subject", header: r.subject, isRowHeader: true, cell: row => <Text as="span" role="mono" dir="ltr">{row.subject_user_id}</Text> },
    { key: "scope", header: r.scope, cell: row => (
      <span className={styles.cellStack}>
        <Text as="span" role="bodyStrong">{row.scope}</Text>
        <Text as="span" tone="muted">{row.purpose}</Text>
      </span>
    ) },
    { key: "status", header: r.status, cell: row => (
      <span className={styles.cellStack}>
        <StatusPill tone={reviewStatusTone(row.status)}>{reviewStatusLabel(row.status, strings)}</StatusPill>
        <Text as="span" role="mono" tone="muted" dir="ltr">{fill(r.due, { date: formatDate(row.due_at, locale) })}</Text>
      </span>
    ) },
    { key: "action", header: r.action, cell: row => row.status === "open"
      ? <AccessDecideForm reviewId={row.id} strings={strings} />
      : <Text as="span" tone="muted">—</Text> },
  ];

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[{ label: strings.breadcrumb.administration, href: "/admin" }, { label: strings.breadcrumb.audit }]}
      title={strings.title}
      actions={<StatusPill tone="info">{strings.badge}</StatusPill>}
    >
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.boundary.title} />
          <CardBody><Text tone="secondary">{strings.boundary.body}</Text></CardBody>
        </Card>

        {data.error ? (
          <Card as="section" role="alert"><CardBody><Text tone="warning">{strings.schemaPending}</Text></CardBody></Card>
        ) : null}

        <div className={styles.statGrid}>
          <StatCard label={strings.stats.roleHoldings} value={data.roleCount} sub={strings.stats.notPermission} />
          <StatCard label={strings.stats.openReviews} value={data.openReviewCount} sub={fill(strings.stats.overdue, { count: data.overdueCount })} />
          <StatCard label={strings.stats.activeEvidence} value={data.activeGrantCount} sub={strings.stats.expiry} />
        </div>

        <Card as="section">
          <CardHeader level="h2" title={r.title} />
          <CardBody>
            <DataTable columns={columns} rows={data.reviews} getRowId={row => row.id} empty={{ icon: "access", title: r.empty }} bleed={false} />
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.grants.title} />
          <CardBody>
            {data.grants.length === 0 ? (
              <Text tone="muted">{strings.grants.empty}</Text>
            ) : (
              <div className={styles.rowList}>
                {data.grants.map(grant => (
                  <div key={grant.id} className={styles.grantRow}>
                    <span className={styles.cellStack}>
                      <Text as="span" role="mono" dir="ltr">{grant.grantee_user_id}</Text>
                      <Text as="span" tone="muted">{grant.purpose}</Text>
                    </span>
                    <StatusPill tone={grantStateTone(grant.state)}>{grantStateLabel(grant.state, strings)}</StatusPill>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </ShellPageFrame>
  );
}
