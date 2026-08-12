"use client";

import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import DateRangePicker, { type DateRangeStrings } from "@/components/saqeel/date-range-picker/date-range-picker";
import Field from "@/components/saqeel/field/field";
import type { Locale } from "@/lib/i18n";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type RescheduleFormStrings = {
  window: string;
  required: string;
  submit: string;
  notSet: string;
  timeFrom: string;
  timeTo: string;
  previousMonth: string;
  nextMonth: string;
  range: DateRangeStrings;
};

export default function RescheduleForm({
  visitId, planningVersion, identity, windowStart, windowEnd, locale, busy, action, strings,
}: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  windowStart: string;
  windowEnd: string;
  locale: Locale;
  busy: boolean;
  action: (payload: FormData) => void;
  strings: RescheduleFormStrings;
}) {
  const [window, setWindow] = useState({ from: windowStart, to: windowEnd });
  const readable = window.from && window.to ? `${window.from.replace("T", " ")} → ${window.to.replace("T", " ")}` : strings.notSet;
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Field label={strings.window} htmlFor="visit-reschedule-window" requiredLabel={strings.required}>
        <DateRangePicker
          from={window.from}
          to={window.to}
          onChange={setWindow}
          nameFrom="window_start"
          nameTo="window_end"
          withTime
          block
          label={strings.window}
          displayValue={readable}
          presets={[]}
          locale={locale}
          monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
          strings={strings.range}
          timeLabels={{ from: strings.timeFrom, to: strings.timeTo }}
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
