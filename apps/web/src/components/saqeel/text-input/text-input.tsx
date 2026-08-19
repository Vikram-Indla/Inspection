import { type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./text-input.module.css";

export type TextInputType = "text" | "search" | "email" | "tel" | "url" | "number" | "password";

export type TextInputProps = {
  name?: string;
  id?: string;
  type?: TextInputType;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
  describedBy?: string;
  /**
   * A control rendered inside the field's trailing edge — a reveal toggle, a
   * clear button. The input reserves room for it, so it never sits on top of
   * the value. Decorative content does not belong here: anything in this slot
   * is inside the field's hit area and must carry its own accessible name.
   */
  trailing?: ReactNode;
  onChange?: (value: string) => void;
};

/**
 * The single-line text control.
 *
 * `label` writes `aria-label` and is only for a control whose visible label sits
 * outside it — a search field in a toolbar. Anything in a form should be
 * wrapped in `Field`, which owns the visible `<label>`, and leave this unset
 * rather than naming the control twice.
 */
export default function TextInput({
  name, id, type = "text", value, defaultValue, placeholder, label,
  disabled, required, readOnly, invalid, inputMode, autoComplete, maxLength,
  describedBy, trailing, onChange,
}: TextInputProps) {
  const control = (
    <input
      className={styles.root}
      data-trailing={trailing ? "" : undefined}
      id={id}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      onChange={onChange ? event => onChange(event.target.value) : undefined}
    />
  );

  if (!trailing) return control;

  return (
    <span className={styles.shell}>
      {control}
      <span className={styles.trailing}>{trailing}</span>
    </span>
  );
}
