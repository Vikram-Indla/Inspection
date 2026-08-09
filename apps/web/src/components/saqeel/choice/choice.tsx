import { type ReactNode } from "react";
import styles from "./choice.module.css";

export type ChoiceKind = "checkbox" | "radio";

export type ChoiceProps = {
  kind: ChoiceKind;
  name: string;
  value: string;
  label: ReactNode;
  description?: ReactNode;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (checked: boolean) => void;
};

/**
 * One checkbox or radio, with its label and optional description.
 *
 * The native input stays in the DOM and keeps every behaviour a form depends
 * on — it submits, it validates, it reaches the accessibility tree, and a radio
 * still arrows within its `name` group. Only its painting is replaced, by an
 * `aria-hidden` box the input's own `:checked` and `:focus-visible` states
 * drive. Nothing here re-implements a native behaviour in JavaScript.
 *
 * The whole row is the `<label>`, so the description is inside the click target
 * rather than beside it.
 */
export default function Choice({
  kind, name, value, label, description, id,
  checked, defaultChecked, disabled, required, onChange,
}: ChoiceProps) {
  return (
    <label className={styles.root} data-disabled={disabled ? "" : undefined}>
      <input
        className={styles.input}
        type={kind}
        id={id}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        required={required}
        onChange={onChange ? event => onChange(event.target.checked) : undefined}
      />
      <span className={styles.box} data-kind={kind} aria-hidden="true" />
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
    </label>
  );
}
