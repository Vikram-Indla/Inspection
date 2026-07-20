import React from "react";

export interface DueDateProps {
  date: string;
  /** negative = overdue (critical); 0–2 = warning */
  daysLeft?: number;
}

export function DueDate({ date, daysLeft }: DueDateProps) {
  const tone = daysLeft == null ? null : daysLeft < 0 ? "critical" : daysLeft <= 2 ? "warning" : null;
  const label =
    daysLeft == null
      ? date
      : daysLeft < 0
        ? "Overdue " + Math.abs(daysLeft) + "d"
        : daysLeft === 0
          ? "Due today"
          : date;
  return (
    <span
      className="row"
      style={{
        gap: 5,
        fontSize: "var(--type-compact-size)",
        fontVariantNumeric: "tabular-nums",
        color: tone ? "var(--status-" + tone + "-text)" : "var(--text-secondary)",
        fontWeight: tone ? 500 : 400,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
      {label}
    </span>
  );
}
