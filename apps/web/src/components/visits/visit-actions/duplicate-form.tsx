"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/saqeel/button/button";
import TransitionFields, { type TransitionIdentity } from "./transition-fields";
import styles from "./visit-actions.module.css";

export default function DuplicateForm({ visitId, planningVersion, identity, busy, action, submitLabel, draft }: {
  visitId: string;
  planningVersion: number;
  identity: TransitionIdentity;
  busy: boolean;
  action: (payload: FormData) => void;
  submitLabel: string;
  draft: { planId?: string; method?: string; error?: string };
}) {
  const router = useRouter();
  const { planId, method, error } = draft;

  useEffect(() => {
    if (!planId || error) return;
    router.push(method === "bulk" ? `/planning/bulk/review?plan=${planId}` : `/planning/single?plan=${planId}`);
  }, [planId, error, method, router]);

  return (
    <form action={action} className={styles.row}>
      <TransitionFields visitId={visitId} planningVersion={planningVersion} identity={identity} />
      <Button type="submit" variant="secondary" disabled={busy} label={submitLabel}>{submitLabel}</Button>
    </form>
  );
}
