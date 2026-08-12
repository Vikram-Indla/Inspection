import { Overline } from "@/components/saqeel/type";
import VisitCalendarChip from "./visit-calendar-chip";
import { fill } from "@/i18n/messages";
import { dayKey, weekCells, type CalendarStrings, type CalendarVisit } from "@/features/visits/calendar";
import styles from "./visit-calendar-week.module.css";

export default function VisitCalendarWeek({ anchorMs, todayKey, byDay, strings, locale }: {
  anchorMs: number;
  todayKey: string;
  byDay: ReadonlyMap<string, CalendarVisit[]>;
  strings: CalendarStrings;
  locale: "ar" | "en";
}) {
  const shortDay = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className={styles.grid} role="grid" aria-label={strings.title}>
      <div className={styles.row} role="row">
        {weekCells(anchorMs).map(ms => {
          const key = dayKey(ms);
          const list = byDay.get(key) ?? [];
          return (
            <div
              className={styles.column}
              key={key}
              role="gridcell"
              data-today={key === todayKey ? "" : undefined}
            >
              <span className={styles.heading}>
                <Overline>{shortDay.format(new Date(ms))}</Overline>
              </span>
              {list.map(visit => (
                <VisitCalendarChip
                  key={visit.id}
                  visit={visit}
                  withTime
                  openLabel={fill(strings.openVisit, { factory: visit.factoryName })}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
