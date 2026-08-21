import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { AdminItemsRead, CatalogueRow } from "@/features/admin-items/types";
import { EditItemForm, NewItemForm, ToggleActive } from "./item-forms";
import ItemPreview from "./item-preview";
import styles from "./admin-items.module.css";

export default function ItemsScreen({ data, locale, strings }: {
  data: AdminItemsRead;
  locale: Locale;
  strings: Messages["adminItems"];
}) {
  const enumLabel = (value: string) => strings.enum[value as keyof typeof strings.enum] ?? value.replace(/_/g, " ");
  const requirementLabel = (value: string | null) =>
    value === "optional" ? strings.form.requirementOptional
      : value === "conditional" ? strings.form.requirementConditional
        : value === "required" ? strings.form.requirementRequired : null;

  const semantics = (row: CatalogueRow) => {
    const parts = [row.responses.map(enumLabel).join(" / ") || "—"];
    if (row.ncTarget) parts.push(`${strings.sem.nc}${row.ncTarget}`);
    if (row.evidenceMandatory) parts.push(`${row.evidenceType ?? strings.sem.evidence} ${strings.sem.onNc}`);
    if (row.scoreExcluded.length > 0) parts.push(strings.sem.scoreExcluded);
    const req = requirementLabel(row.requirement);
    if (req) parts.push(req);
    if (row.conditionalVisibleWhen) parts.push(row.conditionalVisibleWhen);
    if (row.scoringOff) parts.push(strings.sem.scoringOff);
    return parts.join(" · ");
  };

  const columns: DataColumn<CatalogueRow>[] = [
    { key: "code", header: strings.col.code, isRowHeader: true, cell: row => <Mono><bdi dir="ltr">{row.code}</bdi></Mono> },
    { key: "title", header: strings.col.title, cell: row => row.title },
    { key: "clause", header: strings.col.clause, cell: row =>
      row.clauseLabel && row.clauseRegId
        ? <Button variant="link" size="sm" href={`/admin/regulations?id=${encodeURIComponent(row.clauseRegId)}`} label={row.clauseLabel}><bdi dir="ltr">{row.clauseLabel}</bdi></Button>
        : "—" },
    { key: "semantics", header: strings.col.semantics, cell: row => <Text as="span" tone="muted">{semantics(row)}</Text> },
    { key: "weight", header: strings.col.weight, numeric: true, cell: row => row.scoreWeight ?? "—" },
    { key: "usage", header: strings.col.usage, cell: row =>
      !data.isWriter ? <Text as="span" tone="muted">{strings.usage.writerOnly}</Text>
        : !row.usage ? <StatusPill tone="warning">{strings.usage.unavailable}</StatusPill>
          : <Text as="span" tone="muted">{fill(strings.usage.counts, { packages: row.usage.packages, versions: row.usage.versions })}</Text> },
    { key: "status", header: strings.col.status, cell: row =>
      <StatusPill tone={row.active ? "success" : "danger"}>{row.active ? strings.status.active : strings.status.deactivated}</StatusPill> },
    { key: "actions", header: strings.col.actions, align: "end", cell: row => (
      <div className={styles.rowActions}>
        <Button variant="secondary" size="sm" href={`/admin/items/${encodeURIComponent(row.id)}/runtime-preview`} label={strings.rowActions.runtimePreview}>
          {strings.rowActions.runtimePreview}
        </Button>
        {data.isWriter ? (
          <>
            <Button variant="secondary" size="sm"
              href={`/admin/compliance-requests/new?request_type=modify&title=${encodeURIComponent(`Modify inspection item ${row.code}`)}`}
              label={strings.rowActions.requestChange}>{strings.rowActions.requestChange}</Button>
            <ToggleActive itemId={row.id} active={row.active} strings={strings} />
            <Button variant="secondary" size="sm" href={`/admin/items?audit=${encodeURIComponent(row.id)}#items-audit`} label={strings.rowActions.audit}>
              {strings.rowActions.audit}
            </Button>
            <EditItemForm item={{ id: row.id, title: row.title, clauseId: row.clauseId, guidance: row.guidance, version: row.version }}
              clauses={data.clauseOptions} strings={strings} />
          </>
        ) : <Text as="span" tone="muted">{strings.readonly.action}</Text>}
      </div>
    ) },
  ];

  return (
    <div className={styles.root}>
      <nav className={styles.tabs} aria-label={strings.title}>
        <Button variant="link" size="sm" href="/admin/regulations" label={strings.nav.regulations}>{strings.nav.regulations}</Button>
        <Button variant="primary" size="sm" href="/admin/items" label={strings.nav.items}>{strings.nav.items}</Button>
        {data.isWriter ? <Button variant="link" size="sm" href="/admin/compliance-requests/new" label={strings.nav.createRequest}>{strings.nav.createRequest}</Button> : null}
      </nav>

      {data.error ? (
        <EmptyState variant="inline" tone="danger" icon="risk" title={strings.error.title} description={`${strings.error.body} ${strings.error.retry}`} />
      ) : null}

      {data.roleError ? (
        <EmptyState variant="inline" tone="warning" icon="restricted" title={strings.permissionsUnavailable.title} description={strings.permissionsUnavailable.body} />
      ) : !data.isWriter ? (
        <EmptyState variant="inline" tone="info" icon="reveal" title={strings.readonly.title} description={strings.readonly.body} />
      ) : null}

      {data.isWriter ? <EmptyState variant="inline" tone="warning" icon="risk" title={strings.legacyNote} /> : null}

      <Card as="section" labelledBy="items-gov">
        <CardHeader level="h2" title={strings.gov.heading} description={strings.gov.body} titleId="items-gov" />
      </Card>

      {!data.error && data.isWriter ? (
        <Card as="section">
          <CardHeader level="h2" title={strings.create.heading} />
          <CardBody>
            <NewItemForm clauses={data.clauseOptions} clauseUnavailable={data.clauseUnavailable} strings={strings} />
          </CardBody>
        </Card>
      ) : null}

      {!data.error && data.previewItems.length > 0 ? (
        <section className={styles.section}>
          <Heading level={2}>{strings.previewHeading}</Heading>
          <ItemPreview items={data.previewItems} strings={strings} />
        </section>
      ) : null}

      {!data.error && data.rows.length === 0 ? (
        <EmptyState icon="forms" title={strings.empty.title} description={strings.empty.body} />
      ) : null}

      {!data.error && data.rows.length > 0 ? (
        <section className={styles.section}>
          <Heading level={2}>{strings.catalogueHeading}</Heading>
          <DataTable rows={data.rows} columns={columns} getRowId={row => row.id} bleed={false}
            empty={{ icon: "forms", title: strings.empty.title }} />
        </section>
      ) : null}

      {!data.error && data.rows.length > 0 && data.isWriter ? (
        <Card as="section" labelledBy="items-audit">
          <CardHeader level="h2" title={strings.audit.heading} description={strings.audit.body} titleId="items-audit" />
          <CardBody gap="tight">
            {!data.audit.itemId ? <Text tone="muted" live="status">{strings.audit.select}</Text>
              : !data.audit.item ? <EmptyState variant="inline" tone="warning" icon="risk" title={strings.audit.notFound} />
                : data.audit.error ? <EmptyState variant="inline" tone="warning" icon="risk" title={strings.audit.unavailable} />
                  : (
                    <>
                      <Heading level={3}><Mono>{data.audit.item.code}</Mono> — {data.audit.item.title}</Heading>
                      {data.audit.events.length === 0 ? <Text tone="muted" live="status">{strings.audit.empty}</Text>
                        : <ul className={styles.auditList}>
                          {data.audit.events.map(event => (
                            <li key={event.id}>
                              <Text as="span" role="bodyStrong">{event.action}</Text>
                              {" · "}<bdi dir="ltr">{formatDateTime(event.occurredAt, locale)}</bdi>
                              {" · "}<Text as="span" dir="auto">{event.actorName ?? strings.audit.system}</Text>
                            </li>
                          ))}
                        </ul>}
                    </>
                  )}
          </CardBody>
        </Card>
      ) : null}

      <Text tone="muted">{strings.footer}</Text>
    </div>
  );
}
