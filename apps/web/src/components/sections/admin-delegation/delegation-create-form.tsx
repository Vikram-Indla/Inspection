"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import DatePickerField from "@/components/saqeel/date-picker-field/date-picker-field";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { createDelegation, type DelegationResult } from "@/app/(app)/admin/delegation/actions";
import type { AdminDelegationMessages } from "@/features/admin-delegation/strings";
import type { ScopeOption } from "@/features/admin-delegation/types";
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
  const f = strings.form;

  return (
    <form action={action} className={styles.formStack}>
      <Field label={f.delegator}>
        <span className={styles.staticValue}>
          <Text as="span" role="bodyStrong">{delegatorName}</Text>
          <Text as="span" role="label" tone="muted">{`(${f.delegatorYou})`}</Text>
        </span>
      </Field>
      <Field label={f.delegate} htmlFor="dg-to" hint={f.delegateHelp}>
        <TextInput id="dg-to" name="delegate_email" type="email" required placeholder={f.delegatePlaceholder} />
      </Field>
      <Field label={f.scope} htmlFor="dg-scope">
        <SaqeelSelect id="dg-scope" name="scope" label={f.scope} placeholder={f.scopePlaceholder} defaultValue="" required
          options={availableScopes.map(role => ({ value: role.key, label: role.title }))} />
      </Field>
      <div className={styles.formGrid}>
        <Field label={f.startsAt} htmlFor="dg-starts">
          <DatePickerField id="dg-starts" name="starts_at" label={f.startsAt} locale={locale} strings={strings.datePicker} />
        </Field>
        <Field label={f.endsAt} htmlFor="dg-ends">
          <DatePickerField id="dg-ends" name="ends_at" label={f.endsAt} locale={locale} strings={strings.datePicker} align="end" />
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
