"use client";

import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import type { ChoiceOption } from "@/features/visits/detail/view";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type VisitTypeFormStrings = {
  label: string;
  submit: string;
};

export default function VisitTypeForm({ visitId, planningVersion, identity, visitType, types, busy, action, strings }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  visitType: string;
  types: readonly ChoiceOption[];
  busy: boolean;
  action: (payload: FormData) => void;
  strings: VisitTypeFormStrings;
}) {
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Field label={strings.label} htmlFor="visit-type-select">
        <SaqeelSelect
          id="visit-type-select"
          name="visit_type"
          options={types}
          defaultValue={visitType}
          label={strings.label}
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
