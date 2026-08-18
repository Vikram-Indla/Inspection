"use client";

import { useState } from "react";
import DatePicker, { type DatePickerStrings } from "../date-picker/date-picker";
import styles from "./date-picker-field.module.css";

export type DatePickerFieldStrings = DatePickerStrings & {
  readonly placeholder: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
};

export type DatePickerFieldProps = {
  name: string;
  label: string;
  locale: "ar" | "en";
  strings: DatePickerFieldStrings;
  id?: string;
  defaultValue?: string;
  disabled?: boolean;
  align?: "start" | "end";
};

export default function DatePickerField({
  name, label, locale, strings, id, defaultValue = "", disabled, align,
}: DatePickerFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <span className={styles.root}>
      <DatePicker
        value={value}
        onChange={setValue}
        label={label}
        placeholder={strings.placeholder}
        locale={locale}
        monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
        strings={{ clear: strings.clear, today: strings.today }}
        disabled={disabled}
        align={align}
      />
      <input type="hidden" id={id} name={name} value={value} />
    </span>
  );
}
