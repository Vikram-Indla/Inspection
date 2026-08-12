import Link from "next/link";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { planningTone, timeOf, type CalendarVisit } from "@/features/visits/calendar";
import styles from "./visit-calendar-chip.module.css";

export default function VisitCalendarChip({ visit, openLabel, withTime }: {
  visit: CalendarVisit;
  openLabel: string;
  withTime?: boolean;
}) {
  return (
    <Link className={styles.chip} href={`/visits/${visit.id}`} prefetch={false} aria-label={openLabel}>
      {withTime ? <Mono>{timeOf(visit.windowStart)}</Mono> : null}
      <span className={styles.name}>
        <Text as="span" role="label" dir="auto">{visit.factoryName}</Text>
      </span>
      <span className={styles.status}>
        <StatusPill tone={planningTone(visit.planningStatus)} ping={false}>{visit.planningLabel}</StatusPill>
      </span>
    </Link>
  );
}
