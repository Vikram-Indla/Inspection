"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import { revokeDelegation, type DelegationResult } from "@/app/(app)/admin/delegation/actions";
import type { AdminDelegationMessages } from "@/features/admin-delegation/strings";
import DelegationMsg from "./delegation-msg";
import styles from "./delegation.module.css";

export default function DelegationRevokeForm({ delegationId, strings }: {
  delegationId: string;
  strings: AdminDelegationMessages;
}) {
  const [state, action, pending] = useActionState<DelegationResult, FormData>(revokeDelegation, {});
  const fieldId = `dg-revoke-reason-${delegationId}`;

  return (
    <form action={action} className={styles.revokeForm}>
      <input type="hidden" name="delegation_id" value={delegationId} />
      <div className={styles.revokeField}>
        <Field label={strings.revoke.reason} htmlFor={fieldId}>
          <TextInput id={fieldId} name="revoke_reason" required placeholder={strings.revoke.reasonPlaceholder} />
        </Field>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? strings.revoke.submitting : strings.revoke.submit}
      </Button>
      <DelegationMsg state={state} done={strings.revoke.done} strings={strings} />
    </form>
  );
}
