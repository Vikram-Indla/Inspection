"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "@/components/saqeel/button/button";
import IconButton from "@/components/saqeel/icon-button/icon-button";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { VisitsCopy } from "@/features/field-visits/labels";
import type { FieldVisit } from "@/features/field-visits/rows";
import { fill } from "@/i18n/messages";
import styles from "./visits.module.css";

type View = "day" | "week" | "month";
const VIEWS: readonly View[] = ["day", "week", "month"];
const DAY = 86_400_000;

function midnightUtc(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export default function CalendarBoard({ visits, locale, anchorNow, copy }: {
  visits: readonly FieldVisit[];
  locale: "en" | "ar";
  anchorNow: number;
  copy: VisitsCopy;
}) {
  const todayMidnight = midnightUtc(new Date(anchorNow));
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(todayMidnight);

  const byDay = useMemo(() => {
    const map = new Map<string, FieldVisit[]>();
    for (const visit of visits) {
      const key = visit.windowStart.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(visit);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.windowStart.localeCompare(b.windowStart));
    return map;
  }, [visits]);

  const date = new Date(anchor);
  const weekStart = anchor - date.getUTCDay() * DAY;
  const week = Array.from({ length: 7 }, (_, index) => weekStart + index * DAY);
  const monthFirst = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const gridStart = monthFirst - new Date(monthFirst).getUTCDay() * DAY;
  const month = Array.from({ length: 42 }, (_, index) => gridStart + index * DAY);
  const cells = view === "month" ? month : week;

  const intl = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-SA", { ...options, timeZone: "UTC" });
  const shift = (step: number) => {
    if (view === "day") setAnchor(anchor + step * DAY);
    else if (view === "week") setAnchor(anchor + step * 7 * DAY);
    else setAnchor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + step, 1));
  };
  const heading = view === "month"
    ? intl({ month: "long", year: "numeric" }).format(date)
    : view === "week"
      ? `${intl({ day: "numeric", month: "short" }).format(new Date(week[0]))} — ${intl({ day: "numeric", month: "short" }).format(new Date(week[6]))}`
      : intl({ weekday: "long", day: "numeric", month: "long" }).format(date);

  const visitLink = (visit: FieldVisit, showTime: boolean) => (
    <Link key={visit.id} href={`/field/${visit.id}`} className={styles.calendarVisit}>
      {showTime ? <Mono as="span">{`${visit.windowStart.slice(11, 16)} `}</Mono> : null}
      <Text role="label" as="span" dir="auto">{visit.factory.name || copy.noValue}</Text>
    </Link>
  );

  const dayVisits = byDay.get(dayKey(anchor)) ?? [];

  return (
    <div className={styles.calendar}>
      <div className={styles.segments} role="group" aria-label={copy.calendar.view}>
        {VIEWS.map(key => (
          <Button key={key} variant={view === key ? "primary" : "secondary"} size="sm" onClick={() => setView(key)}>
            {copy.calendar[key]}
          </Button>
        ))}
      </div>

      <div className={styles.calendarNav}>
        <IconButton icon="previousPage" label={copy.calendar.previous} size="sm" mirrored onClick={() => shift(-1)} />
        <Button variant="tertiary" size="sm" onClick={() => setAnchor(todayMidnight)}>{copy.calendar.today}</Button>
        <IconButton icon="nextPage" label={copy.calendar.next} size="sm" mirrored onClick={() => shift(1)} />
        <Heading level={2} visual="label">{heading}</Heading>
      </div>

      {view === "day" ? (
        <div className={styles.calendarDay}>
          {dayVisits.length > 0
            ? dayVisits.map(visit => visitLink(visit, true))
            : <Text tone="muted" live="status">{copy.calendar.empty}</Text>}
        </div>
      ) : (
        <div className={styles.calendarGrid}>
          <div className={styles.calendarInner}>
            {week.map(ms => (
              <Text key={`head-${ms}`} role="label" tone="muted" align="center">
                {intl({ weekday: "short" }).format(new Date(ms))}
              </Text>
            ))}
            {cells.map(ms => {
              const list = byDay.get(dayKey(ms)) ?? [];
              const visible = view === "month" ? list.slice(0, 3) : list;
              return (
                <div key={ms} className={styles.calendarCell} data-month={view === "month" ? "" : undefined}>
                  <Mono as="span" tone="muted">{String(new Date(ms).getUTCDate())}</Mono>
                  {visible.map(visit => visitLink(visit, view !== "month"))}
                  {view === "month" && list.length > 3 ? (
                    <Button variant="tertiary" size="sm" onClick={() => { setAnchor(ms); setView("day"); }}>
                      {fill(copy.calendar.more, { count: list.length - 3 })}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
