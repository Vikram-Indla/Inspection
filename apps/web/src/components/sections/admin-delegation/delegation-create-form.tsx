"use client";

import { useActionState, useState } from "react";
import Button from "@/components/saqeel/button/button";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { createDelegation, type DelegationResult } from "@/app/(app)/admin/delegation/actions";
import type { AdminDelegationMessages } from "@/features/admin-delegation/strings";
import type { ScopeOption } from "@/features/admin-delegation/types";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import DelegationMsg from "./delegation-msg";
import styles from "./delegation.module.css";

export default function DelegationCreateForm({ delegatorName, availableScopes, strings, locale }: {
  delegatorName: string;
  availableScopes: readonly ScopeOption[];
  strings: AdminDelegationMessages;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<DelegationResult, FormData>(createDelegation, {});
  const [validity, setValidity] = useState({ from: "", to: "" });
  const f = strings.form;
  const ui: "ar" | "en" = locale === "ar" ? "ar" : "en";

  return (
    <form action={action} className={styles.formStack}>
      <Field label={f.delegator}>
        <span className={styles.staticValue}>
          <Text as="span" role="bodyStrong">{delegatorName}</Text>
          <Text as="span" role="label" tone="muted">{`(${f.delegatorYou})`}</Text>
        </span>
      </Field>
      <div className={styles.fieldGrid}>
      <Field label={f.delegate} htmlFor="dg-to" hint={f.delegateHelp}>
        <TextInput id="dg-to" name="delegate_email" type="email" required placeholder={f.delegatePlaceholder} />
      </Field>
      <Field label={f.scope} htmlFor="dg-scope">
        <SaqeelSelect id="dg-scope" name="scope" label={f.scope} placeholder={f.scopePlaceholder} defaultValue="" required
          options={availableScopes.map(role => ({ value: role.key, label: role.title }))} />
      </Field>
      <Field label={f.dateRange.label} htmlFor="dg-validity">
        <DateRangePicker
          id="dg-validity"
          block
          clearable
          label={f.dateRange.label}
          from={validity.from}
          to={validity.to}
          onChange={setValidity}
          displayValue={validity.from && validity.to ? formatDateRange(validity.from, validity.to, locale) : f.dateRange.empty}
          presets={[
            { id: "next7", label: f.dateRange.next7, days: 7, direction: "future" },
            { id: "next30", label: f.dateRange.next30, days: 30, direction: "future" },
            { id: "next90", label: f.dateRange.next90, days: 90, direction: "future" },
          ]}
          locale={ui}
          monthLabels={{ previous: strings.datePicker.previousMonth, next: strings.datePicker.nextMonth }}
          strings={{
            from: f.startsAt,
            to: f.endsAt,
            pickStart: f.dateRange.pickStart,
            pickEnd: f.dateRange.pickEnd,
            reset: strings.datePicker.clear,
            apply: f.dateRange.apply,
            empty: f.dateRange.empty,
          }}
          nameFrom="starts_at"
          nameTo="ends_at"
        />
      </Field>
      </div>
      <Field label={f.reason} htmlFor="dg-reason">
        <Textarea id="dg-reason" name="reason" rows={3} required placeholder={f.reasonPlaceholder} />
      </Field>
      <div className={styles.formActions}>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? f.creating : f.create}</Button>
        <DelegationMsg state={state} done={f.created} strings={strings} />
      </div>
    </form>
  );
}
