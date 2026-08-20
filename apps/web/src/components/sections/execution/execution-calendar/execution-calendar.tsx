"use client";

import { type DragEvent } from "react";
import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { Metric, Text } from "@/components/saqeel/type";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import { calendarDays, calendarSpan, dayKey, rowsForDay } from "@/features/execution/view";
import type { CalendarMode, ExecutionRow } from "@/features/execution/types";
import { fill } from "@/i18n/messages";
import styles from "./execution-calendar.module.css";

const PREVIEW_LIMIT = 4;
const WEEK_COLUMNS = 7;

export default function ExecutionCalendar({
  rows, weekStart, todayKey, mode, onModeChange, onOpen, onReschedule, strings, labels,
}: {
  rows: readonly ExecutionRow[];
  weekStart: Date;
  todayKey: string;
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  onOpen: (row: ExecutionRow) => void;
  onReschedule: (row: ExecutionRow, date: string | null) => void;
  strings: ExecutionMessages["calendar"];
  labels: ExecutionLabels;
}) {
  const days = calendarDays(weekStart, calendarSpan(mode));
  const last = days[days.length - 1] ?? weekStart;
  const weekdays = days.slice(0, WEEK_COLUMNS);
  const modes: SegmentedItem<CalendarMode>[] = [
    { value: "week", label: strings.weekOption },
    { value: "month", label: strings.monthOption },
  ];

  const onDrop = (event: DragEvent<HTMLElement>, key: string) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/visit-id");
    const row = rows.find(candidate => candidate.id === id);
    if (row) onReschedule(row, key);
  };

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <Text as="span" role="bodyStrong">
          {fill(strings.range, { from: labels.date(weekStart.toISOString()), to: labels.date(last.toISOString()) })}
        </Text>
        <SegmentedControl items={modes} value={mode} label={strings.modeLabel} onChange={onModeChange} size="sm" />
      </div>

      <div className={styles.grid}>
        <ul className={styles.weekdays} aria-hidden="true">
          {weekdays.map(day => {
            const iso = day.toISOString();
            return (
              <li className={styles.weekday} key={dayKey(day)} data-today={dayKey(day) === todayKey}>
                <Text as="span" role="label" tone="muted">{labels.weekday(iso)}</Text>
              </li>
            );
          })}
        </ul>

        <ul className={styles.days}>
          {days.map((day, index) => {
            const iso = day.toISOString();
            const key = dayKey(day);
            const dayRows = rowsForDay(rows, key);
            const isToday = key === todayKey;
            const showMonth = index === 0 || labels.isMonthStart(iso);
            return (
              <li className={styles.day} key={key} aria-label={labels.date(iso)}
                data-today={isToday} data-filled={dayRows.length > 0}
                onDragOver={event => event.preventDefault()}
                onDrop={event => onDrop(event, key)}>
                <span className={styles.dayHead}>
                  <span className={styles.dayMark} aria-hidden="true">
                    <span className={styles.inlineWeekday}>
                      <Text as="span" role="label" tone="muted">{labels.weekday(iso)}</Text>
                    </span>
                    <Metric tone={isToday ? "accent" : "primary"}>{labels.dayNumber(iso)}</Metric>
                    {showMonth ? (
                      <Text as="span" role="overline" tone="muted">{labels.monthShort(iso)}</Text>
                    ) : null}
                  </span>
                  {dayRows.length ? (
                    <Text as="span" role="label" tone="muted">
                      {dayRows.length === 1 ? strings.visitsOne : fill(strings.visits, { count: labels.count(dayRows.length) })}
                    </Text>
                  ) : null}
                </span>
                {dayRows.slice(0, PREVIEW_LIMIT).map(row => (
                  <span className={styles.entry} key={row.id}>
                    <Button variant="link" size="sm" label={row.factory} onClick={() => onOpen(row)}>
                      {row.factory}
                    </Button>
                    <Button variant="tertiary" size="sm" icon="calendar"
                      label={fill(strings.reschedule, { reference: row.visitReference })}
                      compactLabel
                      onClick={() => onReschedule(row, key)}>
                      {fill(strings.reschedule, { reference: row.visitReference })}
                    </Button>
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
      </div>

      <Text tone="muted">{strings.dragHint}</Text>
    </section>
  );
}
