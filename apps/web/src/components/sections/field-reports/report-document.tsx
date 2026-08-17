"use client";

import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Overline, Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { CachedSubmittedReport } from "@/lib/offline";
import styles from "./reports.module.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function entriesOf(value: unknown): readonly [string, unknown][] {
  return isRecord(value) ? Object.entries(value) : [];
}

function documentUrl(snapshot: unknown): string | null {
  if (!isRecord(snapshot)) return null;
  const url = snapshot.document_url;
  return typeof url === "string" && url.trim() ? url : null;
}

function DetailRows({ entries, heading, noValue }: {
  entries: readonly [string, unknown][];
  heading: string;
  noValue: string;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={styles.detailSection}>
      <Heading level={3} visual="label">{heading}</Heading>
      <dl className={styles.detailList}>
        {entries.map(([key, value]) => (
          <div key={key} className={styles.detailRow}>
            <Text as="dt" role="label" tone="secondary" dir="auto">{key}</Text>
            <Text as="dd" tone="primary" dir="auto">{value == null ? noValue : String(value)}</Text>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ReportDocument({ report, unavailable, locale, copy, onClose }: {
  report: CachedSubmittedReport | null;
  unavailable: boolean;
  locale: "en" | "ar";
  copy: Messages["fieldReports"];
  onClose: () => void;
}) {
  const doc = copy.document;
  const snapshot = report?.snapshot;
  const url = documentUrl(snapshot);
  const answers = entriesOf(isRecord(snapshot) ? snapshot.answers : null);
  const notes = entriesOf(isRecord(snapshot) ? snapshot.notes : null);

  return (
    <Card as="section" labelledBy="report-document-title">
      <CardBody>
        <div className={styles.detailHead}>
          <div className={styles.detailIdentity}>
            <Overline as="p">{doc.title}</Overline>
            <Heading id="report-document-title" level={2} visual="subheading">
              {report?.factoryName ?? doc.title}
            </Heading>
          </div>
          {report ? <StatusPill tone="success" ping={false}>{copy.signed}</StatusPill> : null}
          <IconButton icon="dismiss" label={doc.close} onClick={onClose} size="sm" />
        </div>

        {unavailable ? (
          <div className={styles.notice} role="status">
            <Text role="bodyStrong">{doc.unavailableTitle}</Text>
            <Text tone="secondary">{doc.unavailableBody}</Text>
          </div>
        ) : report ? (
          <>
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <Text as="dt" role="label" tone="secondary">{doc.submittedAt}</Text>
                <Text as="dd" tone="primary">
                  {report.submittedAt ? formatDate(report.submittedAt, locale) : copy.noValue}
                </Text>
              </div>
              <div className={styles.detailRow}>
                <Text as="dt" role="label" tone="secondary">{copy.version}</Text>
                <Text as="dd" tone="primary"><Mono as="span">{report.versionNumber}</Mono></Text>
              </div>
              <div className={styles.detailRow}>
                <Text as="dt" role="label" tone="secondary">{doc.inspector}</Text>
                <Text as="dd" tone="primary" dir="auto">{report.inspectorName ?? copy.noValue}</Text>
              </div>
            </dl>

            <DetailRows entries={answers} heading={doc.answers} noValue={copy.noValue} />
            <DetailRows entries={notes} heading={doc.notes} noValue={copy.noValue} />

            <div className={styles.detailActions}>
              {url ? (
                <a className={styles.action} href={url} download>
                  <Icon name="export" size="md" />
                  <Text role="label" as="span">{doc.downloadPdf}</Text>
                </a>
              ) : (
                <Text role="label" tone="muted">{doc.downloadUnavailable}</Text>
              )}
              <button type="button" className={styles.action} onClick={() => window.print()}>
                <Text role="label" as="span">{doc.print}</Text>
              </button>
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
