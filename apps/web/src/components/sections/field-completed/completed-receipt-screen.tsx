import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import { completionReference, summarizeSnapshot, type CompletedHistoryRecord } from "@/lib/field/completed-history";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import LockedNotice from "./locked-notice";
import styles from "./completed.module.css";

function Pair({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className={styles.descRow}>
      <Text role="label" tone="secondary" as="dt">{term}</Text>
      <dd className={styles.descValue}>{children}</dd>
    </div>
  );
}

export default function CompletedReceiptScreen({ record, locale }: {
  record: CompletedHistoryRecord;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldCompleted;
  const receipt = copy.receipt;
  const summary = summarizeSnapshot(record.snapshot);
  const reference = completionReference(record);
  const dateOf = (value?: string) => (value
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(value))
    : copy.noValue);
  const violations = record.snapshot.violations ?? [];
  const evidence = record.snapshot.evidence?.manifest ?? [];

  return (
    <>
      <header className={styles.header}>
        <Button href="/field/completed" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{receipt.title}</Heading>
          <Text role="label" tone="secondary" as="p"><Mono as="span">{reference}</Mono></Text>
        </div>
      </header>

      <div className={styles.page}>
        <LockedNotice>{receipt.readOnly}</LockedNotice>

        <Card as="section" labelledBy="receipt-establishment">
          <CardHeader level="h2" titleId="receipt-establishment" title={record.factoryName} />
          <CardBody>
            <dl className={styles.desc}>
              <Pair term={receipt.reference}><Mono as="span">{reference}</Mono></Pair>
              <Pair term={copy.version}><Text as="span">{`v${record.versionNumber}`}</Text></Pair>
              <Pair term={copy.submitted}><Mono as="span">{dateOf(record.submittedAt)}</Mono></Pair>
              <Pair term={receipt.signed}><Mono as="span">{dateOf(record.acknowledgement?.signed_at ?? record.acknowledgement?.ts)}</Mono></Pair>
            </dl>
          </CardBody>
        </Card>

        <Card as="section" labelledBy="receipt-summary">
          <CardHeader level="h2" titleId="receipt-summary" title={receipt.summary} />
          <CardBody>
            <div className={styles.metrics}>
              <Text as="span">{`${receipt.answered}: `}<Text role="bodyStrong" as="span">{String(summary.answered)}</Text></Text>
              <Text as="span">{`${copy.findings}: `}<Text role="bodyStrong" as="span">{String(summary.findings)}</Text></Text>
              <Text as="span">{`${copy.evidence}: `}<Text role="bodyStrong" as="span">{String(summary.evidence)}</Text></Text>
            </div>
          </CardBody>
        </Card>

        <Card as="section" labelledBy="receipt-findings">
          <CardHeader level="h2" titleId="receipt-findings" title={receipt.findingsEvidence} />
          <CardBody gap="tight">
            {violations.length > 0 ? (
              <ul className={styles.records}>
                {violations.map((item, index) => (
                  <li key={`${item.code ?? "finding"}-${index}`}>
                    <Text as="span"><Text role="bodyStrong" as="span">{item.code ?? receipt.finding}</Text>
                      {item.title ? ` — ${item.title}` : ""}{item.level ? ` · ${item.level}` : ""}</Text>
                  </li>
                ))}
              </ul>
            ) : <Text role="label" tone="muted">{receipt.noFindings}</Text>}

            {evidence.length > 0 ? (
              <ul className={styles.records}>
                {evidence.map((item, index) => (
                  <li key={`${item.id ?? "evidence"}-${index}`}>
                    <Text as="span" dir="auto">{item.name ?? item.type ?? receipt.evidenceItem}
                      {item.captured_at ? ` · ${dateOf(item.captured_at)}` : ""}</Text>
                    {item.sha256 ? <Mono as="span" tone="muted">{`SHA-256 ${item.sha256}`}</Mono> : null}
                  </li>
                ))}
              </ul>
            ) : <Text role="label" tone="muted">{receipt.noEvidenceManifest}</Text>}
          </CardBody>
        </Card>

        <Text role="label" tone="muted">{receipt.lineage}</Text>
      </div>
    </>
  );
}
