"use client";
import React from "react";

export interface DateRangePickerProps {
  from?: string;
  to?: string;
  onChange?: (range: { from?: string; to?: string }) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}

/* Paired native date inputs with a linked "from → to" frame. */
export function DateRangePicker({ from, to, onChange, disabled, min, max }: DateRangePickerProps) {
  return (
    <div className="row" style={{ gap: "var(--space-1)" }}>
      <input
        className="input"
        type="date"
        value={from || ""}
        min={min}
        max={to || max}
        disabled={disabled}
        aria-label="From date"
        onChange={(e) => onChange && onChange({ from: e.target.value, to })}
      />
      <span className="t-meta" aria-hidden="true" style={{ flex: "none" }}>
        →
      </span>
      <input
        className="input"
        type="date"
        value={to || ""}
        min={from || min}
        max={max}
        disabled={disabled}
        aria-label="To date"
        onChange={(e) => onChange && onChange({ from, to: e.target.value })}
      />
    </div>
  );
}
