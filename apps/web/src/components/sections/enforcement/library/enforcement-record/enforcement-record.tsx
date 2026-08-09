import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { EnforcementViolationRow } from "@/features/enforcement/queries";
import { isActionFormComplete, recordTone, type EnforcementRow } from "@/features/enforcement/rows";
import { fill } from "@/i18n/messages";
import styles from "./enforcement-record.module.css";

export type EnforcementRecordStrings = {
  readonly heading: string;
  readonly close: string;
  readonly factory: string;
  readonly licence: string;
  readonly region: string;
  readonly inspection: string;
  readonly recordStatus: string;
  readonly submitted: string;
  readonly notSubmitted: string;
  readonly penalty: string;
  readonly actionForms: string;
  readonly noActionForm: string;
  readonly complete: string;
  readonly incomplete: string;
  readonly evidence: string;
  readonly attachments: string;
  readonly hashesRecorded: string;
  readonly hashesIncomplete: string;
  readonly audit: string;
  readonly mappingVersion: string;
  readonly sourceViolation: string;
  readonly openFactory: string;
  readonly absent: string;
  readonly due: string;
};

export default function EnforcementRecord({
  row, source, penaltyLine, closeHref, factoryHref, formatDay, labelFor, strings,
}: {
  row: EnforcementRow;
  source: EnforcementViolationRow;
  penaltyLine: string;
  closeHref: string;
  factoryHref: string | null;
  formatDay: (iso: string) => string;
  labelFor: (value: string) => string;
  strings: EnforcementRecordStrings;
}) {
  const inspection = source.inspections;
  const forms = (inspection?.action_forms ?? []).filter(form => form.violation_id === row.id);
  const evidence = (inspection?.evidence ?? []).filter(item => item.linked_id === row.id);
  const hashed = evidence.length > 0 && evidence.every(item => Boolean(item.content_sha256));
  const missing = <span className={styles.absent}>{strings.absent}</span>;

  return (
    <Card as="section" labelledBy="enforcement-record">
      <CardHeader
        level="h2"
        titleId="enforcement-record"
        eyebrow={row.violationCode ? <bdi>{row.violationCode}</bdi> : strings.heading}
        title={row.violationTitle ?? strings.heading}
        trailing={<StatusPill tone={recordTone(row.recordStatus)}>{labelFor(row.recordStatus)}</StatusPill>}
      />
      <CardBody gap="tight">
        <DefinitionList
          columns="two"
          items={[
            { label: strings.factory, value: row.factory?.name ?? missing },
            { label: strings.licence, value: row.factory?.license_number ? <bdi>{row.factory.license_number}</bdi> : missing },
            {
              label: strings.region,
              value: row.factory?.region
                ? `${row.factory.region}${row.factory.city ? ` · ${row.factory.city}` : ""}`
                : missing,
            },
            { label: strings.inspection, value: row.inspectionReference ? <bdi>{row.inspectionReference}</bdi> : missing },
            { label: strings.recordStatus, value: labelFor(row.recordStatus) },
            {
              label: strings.submitted,
              value: inspection?.submitted_at
                ? <bdi>{formatDay(inspection.submitted_at)}</bdi>
                : <span className={styles.absent}>{strings.notSubmitted}</span>,
            },
            { label: strings.penalty, value: penaltyLine },
            { label: strings.mappingVersion, value: <bdi className={styles.code}>{source.mapping_version}</bdi> },
            { label: strings.sourceViolation, value: <bdi className={styles.code}>{row.id}</bdi> },
          ]}
        />

        <section className={styles.block}>
          <h3 className={styles.blockTitle}>{strings.actionForms}</h3>
          {forms.length === 0 ? (
            <p className={styles.muted}>{strings.noActionForm}</p>
          ) : (
            <ul className={styles.list}>
              {forms.map(form => (
                <li className={styles.entry} key={form.id}>
                  <span>{labelFor(form.form_type)} · {labelFor(form.status)}</span>
                  <span className={isActionFormComplete(form) ? styles.muted : styles.warning}>
                    {isActionFormComplete(form) ? strings.complete : strings.incomplete}
                  </span>
                  {form.due_at ? <span className={styles.muted}>{fill(strings.due, { date: formatDay(form.due_at) })}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.block}>
          <h3 className={styles.blockTitle}>{strings.evidence}</h3>
          <p className={styles.muted}>{fill(strings.attachments, { count: evidence.length })}</p>
          <p className={hashed ? styles.muted : styles.warning}>
            {hashed ? strings.hashesRecorded : strings.hashesIncomplete}
          </p>
        </section>
      </CardBody>
      <CardFooter>
        {factoryHref ? (
          <Button variant="primary" size="sm" href={factoryHref} label={strings.openFactory}>{strings.openFactory}</Button>
        ) : null}
        <Button variant="secondary" size="sm" href={closeHref} label={strings.close}>{strings.close}</Button>
      </CardFooter>
    </Card>
  );
}
