import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import { Heading } from "@/components/saqeel/type";
import VisitCalendarDay from "./visit-calendar-day";
import VisitCalendarMonth from "./visit-calendar-month";
import VisitCalendarWeek from "./visit-calendar-week";
import {
  calendarHref, dayKey, groupByDay, shift, utcMidnight, weekStart,
  type CalendarStrings, type CalendarView, type CalendarVisit,
} from "@/features/visits/calendar";
import styles from "./visit-calendar.module.css";

const DAY_MS = 86_400_000;

function headingOf(view: CalendarView, anchorMs: number, locale: "ar" | "en"): string {
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
  if (view === "month") return format({ month: "long", year: "numeric" }).format(new Date(anchorMs));
  if (view === "day") return format({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(anchorMs));
  const span = format({ day: "numeric", month: "short" });
  const start = weekStart(anchorMs);
  return `${span.format(new Date(start))} – ${span.format(new Date(start + 6 * DAY_MS))}`;
}

export default function VisitCalendar({ visits, view, anchorMs, strings, basePath, locale }: {
  visits: readonly CalendarVisit[];
  view: CalendarView;
  anchorMs: number;
  strings: CalendarStrings;
  basePath: string;
  locale: "ar" | "en";
}) {
  const byDay = groupByDay(visits);
  const todayKey = dayKey(utcMidnight(new Date()));
  const views: SegmentedItem<CalendarView>[] = [
    { value: "day", label: strings.day, href: calendarHref(basePath, "day", anchorMs) },
    { value: "week", label: strings.week, href: calendarHref(basePath, "week", anchorMs) },
    { value: "month", label: strings.month, href: calendarHref(basePath, "month", anchorMs) },
  ];

  return (
    <div className={styles.root}>
      <Toolbar
        as="header"
        label={strings.viewLabel}
        trailing={
          <>
            <Button
              variant="tertiary" size="sm" icon="previousPage" compactLabel
              href={calendarHref(basePath, view, shift(view, anchorMs, -1))} label={strings.previous}
            >
              {strings.previous}
            </Button>
            <Button variant="tertiary" size="sm" href={calendarHref(basePath, view, utcMidnight(new Date()))}>
              {strings.today}
            </Button>
            <Button
              variant="tertiary" size="sm" icon="nextPage" compactLabel
              href={calendarHref(basePath, view, shift(view, anchorMs, 1))} label={strings.next}
            >
              {strings.next}
            </Button>
            <Heading level={2} visual="bodyStrong">{headingOf(view, anchorMs, locale)}</Heading>
          </>
        }
      >
        <SegmentedControl items={views} value={view} label={strings.viewLabel} tone="accent" size="sm" />
      </Toolbar>

      {view === "month" ? (
        <VisitCalendarMonth
          anchorMs={anchorMs} todayKey={todayKey} byDay={byDay}
          strings={strings} basePath={basePath} locale={locale}
        />
      ) : null}
      {view === "week" ? (
        <VisitCalendarWeek
          anchorMs={anchorMs} todayKey={todayKey} byDay={byDay} strings={strings} locale={locale}
        />
      ) : null}
      {view === "day" ? (
        <VisitCalendarDay anchorMs={anchorMs} byDay={byDay} strings={strings} />
      ) : null}
    </div>
  );
}
