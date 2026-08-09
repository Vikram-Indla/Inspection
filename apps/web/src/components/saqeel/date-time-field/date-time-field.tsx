"use client";
import { useId } from "react";
import Field from "../field/field";
import styles from "./date-time-field.module.css";

export type DateTimeFieldProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  dateLabel: string;
  timeLabel: string;
  min?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
};

const splitLocal = (value: string) => {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
};

const joinLocal = (date: string, time: string) => date && time ? `${date}T${time}` : "";

/**
 * A local date and time, as two controls over one `datetime-local` value.
 *
 * The value shape is unchanged — `YYYY-MM-DDTHH:mm`, exactly what a native
 * `datetime-local` submits — so the server action that already validates it
 * needs no change, and a planner can still record the same instants. Splitting
 * the day from the time is a presentation choice; it is not a narrowing of what
 * can be entered.
 *
 * `min` is applied to the **date** control only. A datetime bound cannot be
 * expressed on a bare time input, and the authoritative check is the server's:
 * the form must not imply a guarantee the client cannot make.
 */
export default function DateTimeField({
  name, value, onChange, label, dateLabel, timeLabel, min, disabled, required, hint,
}: DateTimeFieldProps) {
  const base = useId();
  const current = splitLocal(value);
  const bound = min ? splitLocal(min) : null;

  return (
    <fieldset className={styles.root} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <input type="hidden" name={name} value={value} />

      <div className={styles.controls}>
        <Field label={dateLabel} htmlFor={`${base}-date`}>
          <input
            className={styles.control}
            id={`${base}-date`}
            type="date"
            value={current.date}
            min={bound?.date}
            required={required}
            onChange={event => onChange(joinLocal(event.target.value, current.time))}
          />
        </Field>
        <Field label={timeLabel} htmlFor={`${base}-time`}>
          <input
            className={styles.control}
            id={`${base}-time`}
            type="time"
            value={current.time}
            required={required}
            onChange={event => onChange(joinLocal(current.date, event.target.value))}
          />
        </Field>
      </div>

      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </fieldset>
  );
}
