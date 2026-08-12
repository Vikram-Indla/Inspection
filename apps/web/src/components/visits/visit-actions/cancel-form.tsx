"use client";

import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export type CancelFormStrings = {
  comments: string;
  commentsHint: string;
  submit: string;
};

export default function CancelForm({ visitId, planningVersion, identity, busy, action, strings }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  busy: boolean;
  action: (payload: FormData) => void;
  strings: CancelFormStrings;
}) {
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Field label={strings.comments} htmlFor="visit-cancel-comments">
        <TextInput name="note" id="visit-cancel-comments" placeholder={strings.commentsHint} />
      </Field>
      <Button type="submit" variant="danger" disabled={busy} label={strings.submit}>{strings.submit}</Button>
    </form>
  );
}
