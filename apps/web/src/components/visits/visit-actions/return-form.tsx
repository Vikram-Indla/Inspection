"use client";

import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import type { ChoiceOption } from "@/features/visits/detail/view";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type ReturnFormStrings = {
  reason: string;
  reasonPlaceholder: string;
  noOptions: string;
  comments: string;
  commentsHint: string;
  required: string;
  submit: string;
};

export default function ReturnForm({ visitId, planningVersion, identity, reasons, busy, action, strings }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  reasons: readonly ChoiceOption[];
  busy: boolean;
  action: (payload: FormData) => void;
  strings: ReturnFormStrings;
}) {
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Field label={strings.reason} htmlFor="visit-return-reason" requiredLabel={strings.required}>
        <SaqeelSelect
          id="visit-return-reason"
          name="reason_key"
          required
          options={reasons}
          label={strings.reason}
          placeholder={strings.reasonPlaceholder}
          emptyLabel={strings.noOptions}
        />
      </Field>
      <Field label={strings.comments} htmlFor="visit-return-comments">
        <TextInput name="comments" id="visit-return-comments" placeholder={strings.commentsHint} />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
