"use client";

import Button from "@/components/saqeel/button/button";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export default function RepublishForm({ visitId, planningVersion, identity, busy, action, submitLabel }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  busy: boolean;
  action: (payload: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Button type="submit" variant="secondary" disabled={busy} label={submitLabel}>{submitLabel}</Button>
    </form>
  );
}
