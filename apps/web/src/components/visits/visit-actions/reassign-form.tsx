"use client";

import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type Inspector = { readonly user_id: string; readonly full_name: string };

export type ReassignFormStrings = {
  inspector: string;
  inspectorPlaceholder: string;
  noOptions: string;
  reason: string;
  required: string;
  submit: string;
};

export default function ReassignForm({ visitId, identity, inspectors, busy, action, strings }: {
  visitId: string;
  identity: TransitionIdentity;
  inspectors: readonly Inspector[];
  busy: boolean;
  action: (payload: FormData) => void;
  strings: ReassignFormStrings;
}) {
  const options = inspectors.map(inspector => ({ value: inspector.user_id, label: inspector.full_name }));
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} identity={identity} />
      <Field label={strings.inspector} htmlFor="visit-reassign-inspector" requiredLabel={strings.required}>
        <SaqeelSelect
          id="visit-reassign-inspector"
          name="inspector_id"
          required
          options={options}
          label={strings.inspector}
          placeholder={strings.inspectorPlaceholder}
          emptyLabel={strings.noOptions}
        />
      </Field>
      <Field label={strings.reason} htmlFor="visit-reassign-reason" requiredLabel={strings.required}>
        <TextInput name="reassign_reason" id="visit-reassign-reason" required />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
