import Link from "next/link";
import { Mono, Overline, Text } from "@/components/saqeel/type";
import VisitCalendarChip from "./visit-calendar-chip";
import { fill } from "@/i18n/messages";
import {
  calendarHref, dayKey, isInMonth, monthWeeks, weekCells,
  type CalendarStrings, type CalendarVisit,
} from "@/features/visits/calendar";
import styles from "./visit-calendar-month.module.css";

const VISIBLE_PER_DAY = 3;

export default function VisitCalendarMonth({ anchorMs, todayKey, byDay, strings, basePath, locale }: {
  anchorMs: number;
  todayKey: string;
  byDay: ReadonlyMap<string, CalendarVisit[]>;
  strings: CalendarStrings;
  basePath: string;
  locale: "ar" | "en";
}) {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const dayNumber = new Intl.NumberFormat(locale);

  return (
    <div className={styles.grid} role="grid" aria-label={strings.title}>
      <div className={styles.row} role="row">
        {weekCells(anchorMs).map(ms => (
          <span key={ms} className={styles.weekday} role="columnheader">
            <Overline>{weekday.format(new Date(ms))}</Overline>
          </span>
        ))}
      </div>
      {monthWeeks(anchorMs).map(week => (
        <div className={styles.row} key={week[0]} role="row">
          {week.map(ms => {
            const key = dayKey(ms);
            const list = byDay.get(key) ?? [];
            const hidden = list.length - VISIBLE_PER_DAY;
            return (
              <div
                className={styles.cell}
                key={key}
                role="gridcell"
                data-today={key === todayKey ? "" : undefined}
                data-outside={isInMonth(ms, anchorMs) ? undefined : ""}
              >
                <span className={styles.number}>
                  <Mono>{dayNumber.format(new Date(ms).getUTCDate())}</Mono>
                </span>
                {list.slice(0, VISIBLE_PER_DAY).map(visit => (
                  <VisitCalendarChip
                    key={visit.id}
                    visit={visit}
                    openLabel={fill(strings.openVisit, { factory: visit.factoryName })}
                  />
                ))}
                {hidden > 0 ? (
                  <Link className={styles.more} href={calendarHref(basePath, "day", ms)} prefetch={false}>
                    <Text as="span" role="label" tone="secondary">
                      {fill(strings.more, { n: hidden })}
                    </Text>
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
