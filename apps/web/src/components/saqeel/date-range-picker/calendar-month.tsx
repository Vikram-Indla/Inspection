"use client";

import { type KeyboardEvent } from "react";
import styles from "./date-range-picker.module.css";

export type CalendarMonthProps = {
  month: Date;
  locale: "ar" | "en";
  from: string;
  to: string;
  todayIso: string;
  pendingIso?: string | null;
  onPick: (iso: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export function isoOf(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function startOfGrid(month: Date): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  return new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
}

export default function CalendarMonth({
  month,
  locale,
  from,
  to,
  todayIso,
  pendingIso,
  onPick,
  onKeyDown,
}: CalendarMonthProps) {
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  const dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const dayNumber = new Intl.NumberFormat(locale);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const gridStart = startOfGrid(month);
  const cells = Array.from(
    { length: 42 },
    (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index),
  );

  return (
    <div className={styles.calendar}>
      <p className={styles.month}>{monthLabel}</p>
      <div className={styles.weekdays} aria-hidden="true">
        {cells.slice(0, 7).map(day => (
          <span className={styles.weekday} key={day.toISOString()}>
            {weekday.format(day)}
          </span>
        ))}
      </div>
      <div className={styles.grid} role="grid" onKeyDown={onKeyDown}>
        {cells.map(day => {
          const iso = isoOf(day);
          const outside = day.getMonth() !== month.getMonth();
          const isEndpoint = (!!from && iso === from) || (!!to && iso === to);
          const inRange = !!from && !!to && iso > from && iso < to;
          const previous = isoOf(new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1));
          const next = isoOf(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1));
          return (
            <button
              className={styles.day}
              key={iso}
              type="button"
              data-outside={outside ? "" : undefined}
              data-today={iso === todayIso ? "" : undefined}
              data-endpoint={isEndpoint ? "" : undefined}
              data-pending={pendingIso === iso ? "" : undefined}
              data-in-range={inRange ? "" : undefined}
              data-range-start={inRange && previous === from ? "" : undefined}
              data-range-end={inRange && next === to ? "" : undefined}
              aria-label={dayLabel.format(day)}
              aria-pressed={isEndpoint}
              tabIndex={iso === from ? 0 : -1}
              disabled={outside}
              onClick={() => onPick(iso)}
            >
              {dayNumber.format(day.getDate())}
            </button>
          );
        })}
      </div>
    </div>
  );
}
