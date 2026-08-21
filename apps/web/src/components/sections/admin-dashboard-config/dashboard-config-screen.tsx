import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { KPI_DEFINITIONS, type KpiDefinition } from "@/lib/dashboard-kpi/registry";
import { CONFIG_DOMAINS, type DashboardConfigRead, type DraftRow } from "@/features/admin-dashboard-config/types";
import { fill } from "@/i18n/messages";
import type { Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { CreateDraftForm, ReviewDraftForms, SubmitDraftForm } from "./draft-forms";
import styles from "./dashboard-config.module.css";

const MIGRATION_FILE = "20260721010000_dashboard_kpi_admin_foundation.sql";
const IMPL_TONE: Record<string, StatusTone> = {
  implemented: "success", not_configured: "warning", decision_required: "warning", unavailable: "neutral", deferred: "info",
};
const STATUS_TONE: Record<string, StatusTone> = {
  draft: "neutral", pending_review: "info", returned: "warning", approved: "success", published: "success",
};

export default function DashboardConfigScreen({ data, locale, strings }: {
  data: DashboardConfigRead;
  locale: Locale;
  strings: Messages["adminDashboardConfig"];
}) {
  const implLabel = (value: string) => strings.implementation[value as keyof typeof strings.implementation] ?? value;
  const statusLabel = (value: string) => strings.status[value as keyof typeof strings.status] ?? value;
  const categoryLabel = (value: string) => strings.category[value as keyof typeof strings.category] ?? value;
  const unitLabel = (value: string) => strings.unit[value as keyof typeof strings.unit] ?? value;
  const roleLabel = (value: string) => strings.role[value as keyof typeof strings.role] ?? value;
  const metricTitle = (def: KpiDefinition) => strings.metricTitle[def.metricId as keyof typeof strings.metricTitle] ?? def.titleEn;
  const implementedCount = KPI_DEFINITIONS.filter(def => def.implementation === "implemented").length;

  const kpiColumns: DataColumn<KpiDefinition>[] = [
    { key: "metric", header: strings.catalogue.colMetric, isRowHeader: true, cell: def => (
      <span className={styles.stackCell}>
        <Mono>{def.metricId}</Mono>
        <Text as="span">{metricTitle(def)}</Text>
        {def.implementation !== "implemented"
          ? def.decisionRef
            ? <Mono>{def.decisionRef}</Mono>
            : <Text as="span" tone="warning">{strings.catalogue.pendingGovernance}</Text>
          : null}
      </span>
    ) },
    { key: "category", header: strings.catalogue.colCategory, cell: def => categoryLabel(def.category) },
    { key: "unit", header: strings.catalogue.colUnit, cell: def => unitLabel(def.unit) },
    { key: "owner", header: strings.catalogue.colOwner, cell: def => <Text as="span" tone="muted">{roleLabel(def.ownerRole)}</Text> },
    { key: "delivery", header: strings.catalogue.colDelivery, cell: def => (
      <StatusPill tone={IMPL_TONE[def.implementation] ?? "neutral"}>{implLabel(def.implementation)}</StatusPill>
    ) },
    { key: "seed", header: strings.catalogue.colSeed, cell: def =>
      data.seededMetricKeys.includes(def.metricKey) ? strings.catalogue.seeded : data.migrationApplied ? strings.catalogue.notSeeded : strings.catalogue.na },
  ];

  const domainColumns: DataColumn<(typeof CONFIG_DOMAINS)[number]>[] = [
    { key: "domain", header: strings.domains.colDomain, isRowHeader: true, cell: domain => <Mono>{domain}</Mono> },
    { key: "version", header: strings.domains.colActiveVersion, cell: domain => {
      const active = data.activeByDomain[domain];
      return active
        ? <StatusPill tone="success">v{active.versionNumber}</StatusPill>
        : <StatusPill tone="warning">{strings.domains.notConfigured}</StatusPill>;
    } },
    { key: "effective", header: strings.domains.colEffectiveFrom, cell: domain => {
      const active = data.activeByDomain[domain];
      return <bdi dir="ltr">{active?.effectiveFrom ? formatDate(active.effectiveFrom, locale) : "—"}</bdi>;
    } },
    { key: "inflight", header: strings.domains.colDraftInFlight, cell: domain => {
      const flight = data.inFlightByDomain[domain];
      return flight ? <StatusPill tone={STATUS_TONE[flight.status] ?? "info"}>{statusLabel(flight.status)} · R{flight.revision}</StatusPill> : "—";
    } },
  ];

  const draftColumns: DataColumn<DraftRow>[] = [
    { key: "draft", header: strings.drafts.colDraft, isRowHeader: true, cell: row => (
      <span className={styles.stackCell}>
        <Text as="span">{row.title}</Text>
        {row.return_reason ? <Text as="span" tone="danger">{fill(strings.drafts.returned, { reason: row.return_reason })}</Text> : null}
      </span>
    ) },
    { key: "domain", header: strings.drafts.colDomain, cell: row => <Mono>{row.config_key}</Mono> },
    { key: "status", header: strings.drafts.colStatus, cell: row => (
      <StatusPill tone={STATUS_TONE[row.status] ?? "info"}>{statusLabel(row.status)} · R{row.revision}</StatusPill>
    ) },
    { key: "actions", header: strings.drafts.colActions, align: "end", cell: row => {
      const isOwner = row.owner_id === data.userId;
      if (data.canWrite && isOwner && ["draft", "returned"].includes(row.status)) return <SubmitDraftForm id={row.id} strings={strings.drafts} />;
      if (data.canReview && !isOwner && row.status === "pending_review") return <ReviewDraftForms id={row.id} strings={strings.drafts} />;
      if (row.status === "pending_review" && isOwner) return <Text as="span" tone="muted">{strings.drafts.awaitingReviewer}</Text>;
      return "—";
    } },
  ];

  return (
    <div className={styles.root}>
      {!data.migrationApplied ? (
        <EmptyState variant="inline" tone="warning" icon="risk"
          title={strings.migration.title} description={fill(strings.migration.body, { file: MIGRATION_FILE })} />
      ) : null}

      <Card as="section">
        <CardHeader level="h2" title={strings.catalogue.heading}
          description={fill(strings.catalogue.intro, { implemented: implementedCount, total: KPI_DEFINITIONS.length })} />
        <CardBody>
          <DataTable rows={KPI_DEFINITIONS} columns={kpiColumns} getRowId={def => def.metricId}
            empty={{ icon: "workflow", title: strings.catalogue.heading }} />
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader level="h2" title={strings.domains.heading} description={strings.domains.intro} />
        <CardBody>
          <DataTable rows={CONFIG_DOMAINS} columns={domainColumns} getRowId={domain => domain}
            empty={{ icon: "workflow", title: strings.domains.heading }} />
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader level="h2" title={strings.drafts.heading} description={strings.drafts.makerChecker} />
        <CardBody gap="loose">
          {!data.canWrite && !data.canReview ? <Text tone="muted">{strings.drafts.noAuthority}</Text> : null}
          {data.canWrite ? <CreateDraftForm strings={strings.drafts} /> : null}
          {data.drafts.length === 0 ? (
            <EmptyState variant="inline" icon="workflow" title={strings.drafts.empty} />
          ) : (
            <DataTable rows={data.drafts} columns={draftColumns} getRowId={row => row.id}
              empty={{ icon: "workflow", title: strings.drafts.empty }} />
          )}
          <Text tone="muted">{strings.drafts.footer}</Text>
        </CardBody>
      </Card>
    </div>
  );
}
