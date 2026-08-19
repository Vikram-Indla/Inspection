import Link from "next/link";
import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { completionReference, summarizeSnapshot, type CompletedHistoryRecord } from "@/lib/field/completed-history";
import type { Messages } from "@/i18n/messages";
import styles from "./completed.module.css";

export default function CompletedCard({ record, dateLabel, copy }: {
  record: CompletedHistoryRecord;
  dateLabel: string;
  copy: Messages["fieldCompleted"];
}) {
  const summary = summarizeSnapshot(record.snapshot);

  return (
    <Card as="article" interactive>
      <Link href={`/field/completed/${record.inspectionId}`} prefetch={false} className={styles.cardLink}>
        <CardBody gap="tight">
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>
              <Text role="bodyStrong" as="span" dir="auto" clamp={1}>{record.factoryName}</Text>
              <Text role="label" tone="secondary" as="span">
                <Mono as="span">{completionReference(record)}</Mono>
                {record.factoryCode ? ` · ${record.factoryCode}` : ""}
              </Text>
            </span>
            <StatusPill tone="success" ping={false}>{`${copy.version} ${record.versionNumber}`}</StatusPill>
          </div>
          <Text role="label" tone="secondary">
            {`${copy.submitted}: `}<Mono as="span">{dateLabel}</Mono>
          </Text>
          <div className={styles.cardFoot}>
            <Text role="label" tone="secondary" as="span">{`${copy.findings}: ${summary.findings}`}</Text>
            <Text role="label" tone="secondary" as="span">{`${copy.evidence}: ${summary.evidence}`}</Text>
            <span className={styles.grow} />
            <Text role="label" tone="accent" as="span">{copy.open}</Text>
          </div>
        </CardBody>
      </Link>
    </Card>
  );
}
