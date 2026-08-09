import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { titleCase } from "@/features/factories/portfolio";
import { readRegulationRecord, type RecordAttachment, type RecordClause } from "@/features/regulations/record-source";
import { fill, getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./regulation-record.module.css";
import RegulationLifecycle from "../regulation-lifecycle/regulation-lifecycle";

export default async function RegulationRecord({ locale, entityId }: {
  locale: Locale;
  entityId: string;
}) {
  const { regulations } = getMessages(locale);
  const strings = regulations.record;
  const record = await readRegulationRecord(entityId);

  if (!record?.regulation) {
    return (
      <Card as="section" labelledBy="regulation-record">
        <CardHeader level="h2" titleId="regulation-record" title={regulations.workspace.notFoundTitle} />
        <CardBody>
          <EmptyState title={regulations.workspace.notFoundBody} size="sm" />
        </CardBody>
      </Card>
    );
  }

  const { regulation, clauses, attachments, isWriter } = record;
  const statusLabel = regulations.status[regulation.operational_status as keyof typeof regulations.status]
    ?? titleCase(regulation.operational_status);
  const absent = <span className={styles.absent}>{strings.notRecorded}</span>;
  const unmapped = clauses.filter(clause => (clause.inspection_items?.length ?? 0) === 0).length;

  const clauseColumns: readonly DataColumn<RecordClause>[] = [
    {
      key: "clause",
      header: strings.clause,
      isRowHeader: true,
      cell: clause => <bdi className={styles.code}>{clause.clause_ref ?? "—"}</bdi>,
    },
    { key: "title", header: strings.clauseTitle, cell: clause => clause.title ?? absent },
    { key: "applicability", header: strings.applicability, cell: clause => clause.applicability ?? absent },
    { key: "legalSource", header: strings.legalSource, cell: clause => clause.legal_source ?? absent },
    {
      key: "items",
      header: strings.mappedItems,
      cell: clause => clause.inspection_items === null
        ? <span className={styles.warning}>{strings.itemsUnknown}</span>
        : clause.inspection_items.length === 0
          ? <span className={styles.warning}>{strings.itemsNone}</span>
          : <span className={styles.codes}>
              {clause.inspection_items.map(item => <bdi className={styles.code} key={item.id}>{item.code}</bdi>)}
            </span>,
    },
  ];

  const attachmentColumns: readonly DataColumn<RecordAttachment>[] = [
    {
      key: "file",
      header: strings.file,
      isRowHeader: true,
      cell: attachment => attachment.signedUrl
        ? <a className={styles.link} href={attachment.signedUrl} target="_blank" rel="noreferrer">{attachment.file_name}</a>
        : attachment.file_name,
    },
    { key: "type", header: strings.mediaType, cell: attachment => attachment.media_type ?? absent },
    {
      key: "checksum",
      header: strings.checksum,
      cell: attachment => attachment.sha256
        ? <bdi className={styles.code}>{attachment.sha256.slice(0, 12)}</bdi>
        : <span className={styles.warning}>{strings.noChecksum}</span>,
    },
  ];

  return (
    <div className={styles.stack}>
      <Card as="section" labelledBy="regulation-record">
        <CardHeader
          level="h2"
          titleId="regulation-record"
          eyebrow={<bdi>{regulation.code}</bdi>}
          title={<bdi>{regulation.title}</bdi>}
          trailing={<StatusPill tone={regulation.operational_status === "active" ? "success" : regulation.operational_status === "deactivated" ? "danger" : "warning"}>{statusLabel}</StatusPill>}
        />
        <CardBody>
          <DefinitionList
            columns="two"
            items={[
              { label: strings.authority, value: regulation.issuing_authority ?? absent },
              { label: strings.version, value: <bdi>{regulation.version_label ?? "—"}</bdi> },
              { label: strings.effectiveFrom, value: regulation.release_date ? <bdi>{formatDate(regulation.release_date, locale)}</bdi> : absent },
              { label: strings.deactivationReason, value: regulation.deactivation_reason ?? absent },
            ]}
          />
        </CardBody>
        <CardFooter>
          <Button variant="secondary" size="sm" href={localeHref(locale, "/compliance")} label={strings.backToLibrary}>
            {strings.backToLibrary}
          </Button>
        </CardFooter>
      </Card>

      <Card as="section" labelledBy="regulation-attachments">
        <CardHeader level="h2" titleId="regulation-attachments" title={strings.attachments} description={strings.attachmentsNote} />
        <CardBody>
          {record.attachmentsUnknown ? (
            <EmptyState tone="warning" title={strings.attachmentsUnknown} size="sm" />
          ) : (
            <DataTable
              rows={attachments}
              columns={attachmentColumns}
              getRowId={attachment => attachment.id}
              caption={strings.attachments}
              density="compact"
              empty={{ title: strings.attachmentsEmptyTitle, description: strings.attachmentsEmptyBody }}
            />
          )}
        </CardBody>
      </Card>

      <Card as="section" labelledBy="regulation-clauses">
        <CardHeader
          level="h2"
          titleId="regulation-clauses"
          title={strings.clauses}
          description={unmapped > 0 ? fill(strings.unmappedWarning, { count: unmapped }) : strings.clausesNote}
        />
        <CardBody>
          {record.clausesUnknown ? (
            <EmptyState tone="warning" title={strings.clausesUnknown} size="sm" />
          ) : (
            <DataTable
              rows={clauses}
              columns={clauseColumns}
              getRowId={clause => clause.id}
              caption={strings.clauses}
              density="compact"
              empty={{ title: strings.clausesEmptyTitle, description: strings.clausesEmptyBody }}
            />
          )}
        </CardBody>
      </Card>

      {isWriter ? (
        <Card as="section" labelledBy="regulation-lifecycle">
          <CardHeader level="h2" titleId="regulation-lifecycle" title={strings.lifecycle} description={strings.lifecycleNote} />
          <CardBody>
            <RegulationLifecycle
              entityId={regulation.entity_id}
              operationalStatus={regulation.operational_status}
              strings={regulations.lifecycle}
            />
          </CardBody>
          <CardFooter>
            <Button
              variant="primary" size="sm"
              href={localeHref(locale, "/admin/compliance-requests/new")}
              label={regulations.governance.create}
            >
              {regulations.governance.create}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
