"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import type { OperationsResult } from "@/app/(app)/admin/operations/actions";
import { opsResultMessage, type AdminOperationsMessages } from "@/features/admin-operations/strings";
import styles from "./operations.module.css";

export default function OpsActionForm({ action, fieldName, fieldValue, submitLabel, strings }: {
  action: (state: OperationsResult, data: FormData) => Promise<OperationsResult>;
  fieldName: string;
  fieldValue: string;
  submitLabel: string;
  strings: AdminOperationsMessages;
}) {
  const [state, formAction, pending] = useActionState<OperationsResult, FormData>(action, {});

  return (
    <form action={formAction} className={styles.actionForm}>
      <input type="hidden" name={fieldName} value={fieldValue} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? strings.actions.working : submitLabel}
      </Button>
      {state.error ? <Text role="label" tone="danger" live="alert">{opsResultMessage(state.error, strings)}</Text> : null}
      {state.notice ? <Text role="label" tone="secondary" live="status">{opsResultMessage(state.notice, strings)}</Text> : null}
    </form>
  );
}
