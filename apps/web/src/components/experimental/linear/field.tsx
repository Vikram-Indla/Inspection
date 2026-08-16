import type { ReactNode } from "react";
import styles from "./field.module.css";

export type SelectOption = { value: string; label: string };

export function Field({ id, label, hint, children }: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      {children}
      {hint ? <span className={styles.hint} id={`${id}-hint`}>{hint}</span> : null}
    </div>
  );
}

export function TextInput({ id, name, defaultValue, required = false, maxLength, describedBy }: {
  id: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  describedBy?: string;
}) {
  return (
    <input
      className={styles.control}
      id={id}
      name={name}
      type="text"
      defaultValue={defaultValue}
      required={required}
      maxLength={maxLength}
      aria-describedby={describedBy}
    />
  );
}

export function NumberInput({ id, name, defaultValue, min, max, required = false, describedBy }: {
  id: string;
  name: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  required?: boolean;
  describedBy?: string;
}) {
  return (
    <input
      className={`${styles.control} ${styles.numeric}`}
      id={id}
      name={name}
      type="number"
      inputMode="numeric"
      step={1}
      min={min}
      max={max}
      defaultValue={defaultValue}
      required={required}
      aria-describedby={describedBy}
    />
  );
}

export function Select({ id, name, options, defaultValue }: {
  id: string;
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
}) {
  return (
    <select className={styles.control} id={id} name={name} defaultValue={defaultValue}>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

export function Checkbox({ id, name, label, defaultChecked = false }: {
  id: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className={styles.checkbox} htmlFor={id}>
      <input
        className={styles.checkboxInput}
        id={id}
        name={name}
        type="checkbox"
        value="1"
        defaultChecked={defaultChecked}
      />
      {label}
    </label>
  );
}
