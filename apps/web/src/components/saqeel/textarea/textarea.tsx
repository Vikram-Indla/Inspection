import styles from "./textarea.module.css";

export type TextareaProps = {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  maxLength?: number;
  describedBy?: string;
  onChange?: (value: string) => void;
};

/**
 * The multi-line text control.
 *
 * Vertical resize only: a horizontally resizable field can be dragged wider
 * than its column and break the layout around it, and the reader gains nothing
 * a taller box does not already give them.
 */
export default function Textarea({
  name, id, value, defaultValue, placeholder, label, rows = 3,
  disabled, required, invalid, maxLength, describedBy, onChange,
}: TextareaProps) {
  return (
    <textarea
      className={styles.root}
      id={id}
      name={name}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      onChange={onChange ? event => onChange(event.target.value) : undefined}
    />
  );
}
