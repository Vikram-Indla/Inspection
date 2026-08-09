"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "../icon/icon";
import IconButton from "../icon-button/icon-button";
import MenuSurface from "../menu-surface/menu-surface";
import PingDot from "../ping-dot/ping-dot";
import CalendarMonth, { isoOf } from "./calendar-month";
import styles from "./date-range-picker.module.css";

export type DateRangePreset = {
  readonly id: string;
  readonly label: string;
  readonly days: number;
  /** "past" (default) spans the days ending today; "future" starts today. */
  readonly direction?: "past" | "future";
};

export type DateRangeStrings = {
  readonly from: string;
  readonly to: string;
  readonly pickStart: string;
  readonly pickEnd: string;
  readonly reset: string;
  readonly apply: string;
  readonly empty: string;
};

export type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  label: string;
  displayValue: string;
  presets: readonly DateRangePreset[];
  locale: "ar" | "en";
  monthLabels: { previous: string; next: string };
  strings?: DateRangeStrings;
  disabled?: boolean;
  align?: "start" | "end";
};

const DEFAULT_STRINGS: DateRangeStrings = {
  from: "From",
  to: "To",
  pickStart: "Choose a start date",
  pickEnd: "Choose an end date",
  reset: "Reset",
  apply: "Apply",
  empty: "Not set",
};

function shift(iso: string, days: number): string {
  const base = new Date(`${iso}T00:00:00`);
  return isoOf(new Date(base.getFullYear(), base.getMonth(), base.getDate() + days));
}

function addMonths(value: Date, count: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + count, 1);
}

export default function DateRangePicker({
  from,
  to,
  onChange,
  label,
  displayValue,
  presets,
  locale,
  monthLabels,
  strings = DEFAULT_STRINGS,
  disabled,
  align = "start",
}: DateRangePickerProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [editing, setEditing] = useState<"from" | "to">("from");
  const todayIso = isoOf(new Date());
  const [cursor, setCursor] = useState(() => new Date(`${from || todayIso}T00:00:00`));

  const formatDay = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const readable = (iso: string): string =>
    iso ? formatDay.format(new Date(`${iso}T00:00:00`)) : strings.empty;

  function open(): void {
    setDraftFrom(from);
    setDraftTo(to);
    setEditing("from");
    setCursor(new Date(`${from || todayIso}T00:00:00`));
    setIsOpen(true);
  }

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(iso: string): void {
    if (editing === "from") {
      setDraftFrom(iso);
      if (draftTo && iso > draftTo) setDraftTo("");
      setEditing("to");
      return;
    }
    if (draftFrom && iso < draftFrom) {
      setDraftFrom(iso);
      setEditing("to");
      return;
    }
    setDraftTo(iso);
  }

  function applyPreset(preset: DateRangePreset): void {
    const span = preset.days - 1;
    const future = preset.direction === "future";
    onChange({ from: future ? todayIso : shift(todayIso, -span), to: future ? shift(todayIso, span) : todayIso });
    close(true);
  }

  function commit(): void {
    onChange({ from: draftFrom, to: draftTo });
    close(true);
  }

  function reset(): void {
    setDraftFrom("");
    setDraftTo("");
    setEditing("from");
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const moves: Readonly<Record<string, number>> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    if (event.key in moves) {
      event.preventDefault();
      setCursor(current => new Date(current.getFullYear(), current.getMonth(), 1));
    } else if (event.key === "PageDown") {
      event.preventDefault();
      setCursor(current => addMonths(current, 1));
    } else if (event.key === "PageUp") {
      event.preventDefault();
      setCursor(current => addMonths(current, -1));
    }
  }

  const activePreset = presets.find(preset => {
    const span = preset.days - 1;
    const future = preset.direction === "future";
    return draftFrom === (future ? todayIso : shift(todayIso, -span)) && draftTo === (future ? shift(todayIso, span) : todayIso);
  });

  return (
    <div className={styles.root}>
      <button
        className={styles.trigger}
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => (isOpen ? close(false) : open())}
      >
        <span className={styles.leading}>
          <Icon name="dateScope" size="md" />
        </span>
        <span>{displayValue}</span>
      </button>

      <MenuSurface
        id={panelId}
        open={isOpen}
        onClose={() => close(false)}
        triggerRef={triggerRef}
        align={align}
        label={label}
        role="dialog"
        trapFocus
      >
        <div className={styles.panel}>
          <div className={styles.fields}>
            <button
              className={styles.field}
              type="button"
              aria-pressed={editing === "from"}
              onClick={() => setEditing("from")}
            >
              <span className={styles.fieldLabel}>{strings.from}</span>
              <span className={styles.fieldValue} data-empty={draftFrom ? undefined : ""}>
                {readable(draftFrom)}
              </span>
            </button>
            <span className={styles.arrow} aria-hidden="true">
              <Icon name="nextPage" size="sm" />
            </span>
            <button
              className={styles.field}
              type="button"
              aria-pressed={editing === "to"}
              onClick={() => setEditing("to")}
            >
              <span className={styles.fieldLabel}>{strings.to}</span>
              <span className={styles.fieldValue} data-empty={draftTo ? undefined : ""}>
                {readable(draftTo)}
              </span>
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.presets}>
              {presets.map(preset => (
                <button
                  className={styles.preset}
                  key={preset.id}
                  type="button"
                  aria-pressed={activePreset?.id === preset.id}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className={styles.months}>
              <span className={styles.monthNav}>
                <IconButton
                  icon="previousPage"
                  label={monthLabels.previous}
                  size="sm"
                  mirrored
                  onClick={() => setCursor(current => addMonths(current, -1))}
                />
              </span>
              <CalendarMonth
                month={cursor}
                locale={locale}
                from={draftFrom}
                to={draftTo}
                todayIso={todayIso}
                pendingIso={editing === "to" && !draftTo ? draftFrom : null}
                onPick={pick}
                onKeyDown={onGridKeyDown}
              />
              <CalendarMonth
                month={addMonths(cursor, 1)}
                locale={locale}
                from={draftFrom}
                to={draftTo}
                todayIso={todayIso}
                pendingIso={editing === "to" && !draftTo ? draftFrom : null}
                onPick={pick}
                onKeyDown={onGridKeyDown}
              />
              <span className={styles.monthNav}>
                <IconButton
                  icon="nextPage"
                  label={monthLabels.next}
                  size="sm"
                  mirrored
                  onClick={() => setCursor(current => addMonths(current, 1))}
                />
              </span>
            </div>
          </div>

          <div className={styles.footer}>
            <span className={styles.hint}>
              <PingDot tone="accent" />
              {editing === "from" ? strings.pickStart : strings.pickEnd}
            </span>
            <span className={styles.actions}>
              <button className={styles.reset} type="button" onClick={reset}>
                {strings.reset}
              </button>
              <button
                className={styles.apply}
                type="button"
                disabled={!draftFrom || !draftTo}
                onClick={commit}
              >
                {strings.apply}
              </button>
            </span>
          </div>
        </div>
      </MenuSurface>
    </div>
  );
}
