"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "../icon/icon";
import IconButton from "../icon-button/icon-button";
import SaqeelSelect from "../select/select";
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
  /**
   * Let `reset` commit an empty range instead of only clearing the draft.
   *
   * Off by default because most callers require a range: there, `reset` returns
   * the draft to nothing so the reader picks again, and `apply` stays disabled
   * until both ends are set. A filter is the other case — "no date scope" is a
   * legitimate value, and without this the reader can clear the draft but never
   * commit it, because `apply` is disabled on exactly the state `reset` creates.
   *
   * When on, the caller must accept `{ from: "", to: "" }` from `onChange` and
   * render its own unset `displayValue`; the picker never invents one.
   */
  clearable?: boolean;
  align?: "start" | "end";
  /**
   * Fill the container instead of shrink-wrapping.
   *
   * The default suits a toolbar chip, where the trigger is as wide as its
   * label. A form field is the other case: it belongs to a column and should
   * match the controls above and below it rather than sit as a small pill in a
   * wide empty row.
   */
  block?: boolean;
  /**
   * Show a time control beside each end of the range.
   *
   * Off, `from`/`to` stay plain `YYYY-MM-DD` and nothing about the picker
   * changes. On, they carry `YYYY-MM-DDTHH:mm` — the `datetime-local` shape —
   * so a caller that needs an instant rather than a day uses the same picker
   * instead of a parallel one.
   */
  withTime?: boolean;
  /** Minutes between selectable times. Ignored unless `withTime`. */
  timeStep?: number;
  timeLabels?: { from: string; to: string };
  /**
   * Submit names for the two ends. The trigger is a `<button>`, which posts
   * nothing, so each end rides along in a hidden input — without these a server
   * action reading `FormData` receives an empty window.
   */
  nameFrom?: string;
  nameTo?: string;
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

const MINUTES_IN_DAY = 24 * 60;
const DEFAULT_TIME_STEP = 30;

const dayPart = (value: string) => value.split("T")[0] ?? "";
const timePart = (value: string) => (value.split("T")[1] ?? "").slice(0, 5);
const withDay = (value: string, day: string, withTime: boolean) =>
  !day ? "" : withTime ? `${day}T${timePart(value) || "00:00"}` : day;

function timeChoices(step: number, locale: "ar" | "en") {
  const format = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  return Array.from({ length: Math.floor(MINUTES_IN_DAY / step) }, (_unused, index) => {
    const minutes = index * step;
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    return {
      value: `${hour}:${minute}`,
      label: format.format(new Date(2000, 0, 1, Number(hour), Number(minute))),
    };
  });
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
  clearable = false,
  align = "start",
  block = false,
  withTime = false,
  timeStep = DEFAULT_TIME_STEP,
  timeLabels,
  nameFrom,
  nameTo,
}: DateRangePickerProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [editing, setEditing] = useState<"from" | "to">("from");
  const todayIso = isoOf(new Date());
  const [cursor, setCursor] = useState(() => new Date(`${dayPart(from) || todayIso}T00:00:00`));
  const draftFromDay = dayPart(draftFrom);
  const draftToDay = dayPart(draftTo);

  const formatDay = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const readable = (value: string): string =>
    dayPart(value) ? formatDay.format(new Date(`${dayPart(value)}T00:00:00`)) : strings.empty;

  function open(): void {
    setDraftFrom(from);
    setDraftTo(to);
    setEditing("from");
    setCursor(new Date(`${dayPart(from) || todayIso}T00:00:00`));
    setIsOpen(true);
  }

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(iso: string): void {
    if (editing === "from") {
      setDraftFrom(current => withDay(current, iso, withTime));
      if (draftToDay && iso > draftToDay) setDraftTo("");
      setEditing("to");
      return;
    }
    if (draftFromDay && iso < draftFromDay) {
      setDraftFrom(current => withDay(current, iso, withTime));
      setEditing("to");
      return;
    }
    setDraftTo(current => withDay(current, iso, withTime));
  }

  function presetDays(preset: DateRangePreset): { from: string; to: string } {
    const span = preset.days - 1;
    const future = preset.direction === "future";
    return {
      from: future ? todayIso : shift(todayIso, -span),
      to: future ? shift(todayIso, span) : todayIso,
    };
  }

  function applyPreset(preset: DateRangePreset): void {
    const days = presetDays(preset);
    onChange({ from: withDay(from, days.from, withTime), to: withDay(to, days.to, withTime) });
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
    if (clearable) {
      onChange({ from: "", to: "" });
      close(true);
    }
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
    const days = presetDays(preset);
    return draftFromDay === days.from && draftToDay === days.to;
  });

  return (
    <div className={styles.root} data-block={block ? "" : undefined}>
      {nameFrom ? <input type="hidden" name={nameFrom} value={from} /> : null}
      {nameTo ? <input type="hidden" name={nameTo} value={to} /> : null}
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

          {withTime ? (
            <div className={styles.times}>
              <SaqeelSelect
                options={timeChoices(timeStep, locale)}
                value={timePart(draftFrom)}
                onChange={next => setDraftFrom(current => dayPart(current) ? `${dayPart(current)}T${next}` : current)}
                label={timeLabels?.from ?? strings.from}
                disabled={!draftFromDay}
              />
              <SaqeelSelect
                options={timeChoices(timeStep, locale)}
                value={timePart(draftTo)}
                onChange={next => setDraftTo(current => dayPart(current) ? `${dayPart(current)}T${next}` : current)}
                label={timeLabels?.to ?? strings.to}
                disabled={!draftToDay}
              />
            </div>
          ) : null}

          <div className={styles.body}>
            {presets.length > 0 ? (
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
            ) : null}

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
                from={draftFromDay}
                to={draftToDay}
                todayIso={todayIso}
                pendingIso={editing === "to" && !draftToDay ? draftFromDay : null}
                onPick={pick}
                onKeyDown={onGridKeyDown}
              />
              <CalendarMonth
                month={addMonths(cursor, 1)}
                locale={locale}
                from={draftFromDay}
                to={draftToDay}
                todayIso={todayIso}
                pendingIso={editing === "to" && !draftToDay ? draftFromDay : null}
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
