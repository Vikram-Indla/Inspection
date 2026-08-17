import Link from "next/link";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import {
  enumLabel,
  riskTone,
  visitStateValue,
  visitTone,
  type FieldHomeCopy,
  type VisitEnumCopy,
} from "@/features/field-home/labels";
import type { FieldScheduleRow } from "@/features/field-home/queries";
import { fill } from "@/i18n/messages";
import styles from "./field-home.module.css";

export default function FieldSchedule({ rows, copy, enums }: {
  rows: readonly FieldScheduleRow[];
  copy: FieldHomeCopy;
  enums: VisitEnumCopy;
}) {
  return (
    <Card as="section">
      <CardHeader
        level="h2"
        title={copy.schedule.heading}
        trailing={<Text role="label" tone="muted" as="span">{fill(copy.schedule.count, { n: rows.length })}</Text>}
      />

      {rows.length === 0 ? (
        <CardBody gap="tight">
          <Text role="bodyStrong">{copy.schedule.empty}</Text>
          <Text tone="secondary">{copy.schedule.emptyBody}</Text>
        </CardBody>
      ) : (
        <ul className={styles.scheduleList}>
          {rows.map(row => (
            <li key={row.id}>
              <Link href={`/field/my-tasks?task=${row.id}`} prefetch={false} className={styles.scheduleRow}>
                <Mono as="span">{row.time}</Mono>
                <span className={styles.scheduleName}>
                  <Text role="bodyStrong" as="span" dir="auto" clamp={1}>{row.factoryName}</Text>
                  <Text role="label" tone="secondary" as="span">
                    {enumLabel(enums, row.visitType, copy.noValue)}
                  </Text>
                </span>
                <StatusPill tone={riskTone(row.riskBand)} ping={false}>
                  {enumLabel(enums, row.riskBand, copy.noValue)}
                </StatusPill>
                <StatusPill tone={visitTone(row.planningStatus, row.operationalState)} ping={false}>
                  {enumLabel(enums, visitStateValue(row.planningStatus, row.operationalState), copy.noValue)}
                </StatusPill>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CardFooter align="end">
        <Button href="/field/my-tasks" prefetch={false} variant="link">{copy.schedule.viewAll}</Button>
      </CardFooter>
    </Card>
  );
}
