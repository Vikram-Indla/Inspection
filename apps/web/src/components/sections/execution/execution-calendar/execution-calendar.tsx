"use client";

import { type DragEvent } from "react";
import Button from "@/components/saqeel/button/button";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { Text } from "@/components/saqeel/type";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import { calendarDays, calendarSpan, dayKey, rowsForDay } from "@/features/execution/view";
import type { CalendarMode, ExecutionRow } from "@/features/execution/types";
import { fill } from "@/i18n/messages";
import styles from "./execution-calendar.module.css";

const PREVIEW_LIMIT = 4;

export default function ExecutionCalendar({
  rows, weekStart, mode, onModeChange, onOpen, onReschedule, strings, labels,
}: {
  rows: readonly ExecutionRow[];
  weekStart: Date;
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  onOpen: (row: ExecutionRow) => void;
  onReschedule: (row: ExecutionRow, date: string | null) => void;
  strings: ExecutionMessages["calendar"];
  labels: ExecutionLabels;
}) {
  const days = calendarDays(weekStart, calendarSpan(mode));
  const last = days[days.length - 1] ?? weekStart;
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

      <ul className={styles.days}>
        {days.map(day => {
          const key = dayKey(day);
          const dayRows = rowsForDay(rows, key);
          return (
            <li className={styles.day} key={key}
              onDragOver={event => event.preventDefault()}
              onDrop={event => onDrop(event, key)}>
              <span className={styles.dayHead}>
                <Text as="span" role="label">{labels.date(day.toISOString())}</Text>
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

      <Text tone="muted">{strings.dragHint}</Text>
    </section>
  );
}
