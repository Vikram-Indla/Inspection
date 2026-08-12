import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import { dayKey, planningTone, timeOf, type CalendarStrings, type CalendarVisit } from "@/features/visits/calendar";
import styles from "./visit-calendar-day.module.css";

export default function VisitCalendarDay({ anchorMs, byDay, strings }: {
  anchorMs: number;
  byDay: ReadonlyMap<string, CalendarVisit[]>;
  strings: CalendarStrings;
}) {
  const list = byDay.get(dayKey(anchorMs)) ?? [];

  if (list.length === 0) {
    return <EmptyState icon="calendar" title={strings.emptyTitle} description={strings.emptyBody} />;
  }

  return (
    <div className={styles.root}>
      <Text tone="muted" live="status">{fill(strings.dayCount, { n: list.length })}</Text>
      <ListRows label={strings.title}>
        {list.map(visit => (
          <ListRow
            key={visit.id}
            href={`/visits/${visit.id}`}
            leading={<Mono>{fill(strings.windowRange, { from: timeOf(visit.windowStart), to: timeOf(visit.windowEnd) })}</Mono>}
            title={<Text as="span" role="bodyStrong" dir="auto">{visit.factoryName}</Text>}
            meta={<Text as="span" tone="muted">{visit.typeLabel}</Text>}
            trailing={
              <span className={styles.pills}>
                <StatusPill tone={planningTone(visit.planningStatus)}>{visit.planningLabel}</StatusPill>
                <StatusPill tone="neutral" ping={false}>{visit.opsLabel}</StatusPill>
              </span>
            }
          />
        ))}
      </ListRows>
    </div>
  );
}
