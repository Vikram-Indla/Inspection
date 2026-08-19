import Link from "next/link";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { enumLabel, riskTone, type VisitCta, type VisitEnumCopy, type VisitsCopy } from "@/features/field-visits/labels";
import type { FieldVisit } from "@/features/field-visits/rows";
import { isVisitPriority } from "@/app/(app)/field/my-tasks/assignment-task-model";
import styles from "./visits.module.css";

export default function VisitCard({ visit, time, distance, cta, copy, enums }: {
  visit: FieldVisit;
  time: string;
  distance: string | null;
  cta: VisitCta;
  copy: VisitsCopy;
  enums: VisitEnumCopy;
}) {
  const priority = isVisitPriority(visit.priority) ? visit.priority : null;

  const inner = (
    <CardBody gap="tight">
      <div className={styles.cardRow}>
        <Mono as="span">{time}</Mono>
        <Text role="bodyStrong" as="span" dir="auto" clamp={1}>{visit.factory.name || copy.noValue}</Text>
        <span className={styles.grow} />
        {priority ? (
          <StatusPill tone={riskTone(priority)} ping={false}>{copy.risk[priority]}</StatusPill>
        ) : null}
      </div>

      <Text role="label" tone="secondary" as="span">
        {`${visit.visitReference ?? copy.noValue} · ${enumLabel(enums, visit.visitType, copy.noValue)}${distance ? ` · ${distance}` : ""}`}
      </Text>

      <div className={styles.cardRow}>
        <StatusPill tone="neutral" ping={false}>{enumLabel(enums, visit.planningStatus, copy.noValue)}</StatusPill>
        <Icon name="nextPage" size="sm" mirrored />
        <StatusPill tone="neutral" ping={false}>{enumLabel(enums, visit.operationalState, copy.noValue)}</StatusPill>
        <span className={styles.grow} />
        <span className={styles.cta}>
          <Text role="label" as="span" tone="accent">{cta.label}</Text>
          <Icon name="nextPage" size="sm" mirrored />
        </span>
      </div>
    </CardBody>
  );

  const cardClass = priority ? `${styles.card} ${styles[`risk_${priority}`]}` : styles.card;

  if (cta.href) {
    return (
      <Card as="article">
        <Link
          href={cta.href}
          className={cardClass}
          aria-label={`${visit.factory.name} · ${visit.visitReference ?? ""} — ${cta.label}`}
        >
          {inner}
        </Link>
      </Card>
    );
  }

  return (
    <Card as="article">
      <div className={cardClass}>{inner}</div>
    </Card>
  );
}
