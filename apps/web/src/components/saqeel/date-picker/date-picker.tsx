"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "../icon/icon";
import IconButton from "../icon-button/icon-button";
import MenuSurface from "../menu-surface/menu-surface";
import CalendarMonth, { isoOf } from "../date-range-picker/calendar-month";
import styles from "./date-picker.module.css";

export type DatePickerStrings = {
  readonly clear: string;
  readonly today: string;
};

export type DatePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  label: string;
  placeholder: string;
  locale: "ar" | "en";
  monthLabels: { readonly previous: string; readonly next: string };
  strings: DatePickerStrings;
  disabled?: boolean;
  align?: "start" | "end";
  block?: boolean;
};

function addMonths(value: Date, count: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + count, 1);
}

export default function DatePicker({
  value, onChange, label, placeholder, locale, monthLabels, strings, disabled, align = "start", block,
}: DatePickerProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const todayIso = isoOf(new Date());
  const [cursor, setCursor] = useState(() => new Date(`${value || todayIso}T00:00:00`));
  const readable = value
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`))
    : placeholder;

  function open(): void {
    setCursor(new Date(`${value || todayIso}T00:00:00`));
    setIsOpen(true);
  }

  function close(returnFocus: boolean): void {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(iso: string): void {
    onChange(iso);
    close(true);
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "PageDown") {
      event.preventDefault();
      setCursor(current => addMonths(current, 1));
    } else if (event.key === "PageUp") {
      event.preventDefault();
      setCursor(current => addMonths(current, -1));
    }
  }

  return (
    <div className={styles.root} data-block={block ? "" : undefined}>
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
        <span className={styles.leading} aria-hidden="true"><Icon name="dateScope" size="md" /></span>
        <span className={styles.value} data-empty={value ? undefined : ""}>{readable}</span>
      </button>

      <MenuSurface id={panelId} open={isOpen} onClose={() => close(false)} triggerRef={triggerRef} align={align} label={label} role="dialog" trapFocus>
        <div className={styles.panel}>
          <div className={styles.months}>
            <span className={styles.monthNav}>
              <IconButton icon="previousPage" label={monthLabels.previous} size="sm" mirrored onClick={() => setCursor(current => addMonths(current, -1))} />
            </span>
            <CalendarMonth month={cursor} locale={locale} from={value} to={value} todayIso={todayIso} onPick={pick} onKeyDown={onGridKeyDown} />
            <span className={styles.monthNav}>
              <IconButton icon="nextPage" label={monthLabels.next} size="sm" mirrored onClick={() => setCursor(current => addMonths(current, 1))} />
            </span>
          </div>
          <div className={styles.footer}>
            <button className={styles.action} type="button" onClick={() => pick("")}>{strings.clear}</button>
            <button className={styles.action} type="button" onClick={() => pick(todayIso)}>{strings.today}</button>
          </div>
        </div>
      </MenuSurface>
    </div>
  );
}
