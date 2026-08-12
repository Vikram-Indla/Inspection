import { type ReactNode } from "react";
import Choice, { type ChoiceKind } from "@/components/saqeel/choice/choice";
import { Text } from "@/components/saqeel/type";
import styles from "./choice-group.module.css";

export type ChoiceOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type ChoiceGroupLayout = "stack" | "inline" | "columns";

export type ChoiceGroupProps = {
  legend: string;
  name: string;
  value: string;
  options: readonly ChoiceOption[];
  kind?: ChoiceKind;
  layout?: ChoiceGroupLayout;
  required?: boolean;
  onChange: (value: string) => void;
};

/**
 * A labelled set of mutually exclusive choices.
 *
 * The grouping is a real `<fieldset>` with a `<legend>`, which is the only
 * construct that names a set of inputs to assistive technology — a `Field`
 * cannot, because a `<label>` points at one control. Arrow-key navigation,
 * the roving tab stop and form submission all come from the native radios
 * inside `Choice`; nothing here re-implements them.
 *
 * `name` must be unique per group on the page: two groups sharing it become one
 * radio group and selecting in either clears the other.
 */
export default function ChoiceGroup({
  legend, name, value, options, kind = "radio", layout = "stack", required, onChange,
}: ChoiceGroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        <Text as="span" role="label" tone="secondary">{legend}</Text>
      </legend>
      <div className={styles.options} data-layout={layout}>
        {options.map(option => (
          <Choice
            key={option.value}
            kind={kind}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            required={required}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
