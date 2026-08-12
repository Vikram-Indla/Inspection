"use client";

import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import type { ChoiceOption } from "@/features/visits/detail/view";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type RepackageFormStrings = {
  label: string;
  placeholder: string;
  noOptions: string;
  required: string;
  submit: string;
};

export default function RepackageForm({ visitId, planningVersion, identity, packages, busy, action, strings }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  packages: readonly ChoiceOption[];
  busy: boolean;
  action: (payload: FormData) => void;
  strings: RepackageFormStrings;
}) {
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Field label={strings.label} htmlFor="visit-repackage" requiredLabel={strings.required}>
        <SaqeelSelect
          id="visit-repackage"
          name="package_version_id"
          required
          options={packages}
          label={strings.label}
          placeholder={strings.placeholder}
          emptyLabel={strings.noOptions}
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
