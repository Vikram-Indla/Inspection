"use client";

import { useActionState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { decideAccessReview, type AccessResult } from "@/app/(app)/admin/security-access/actions";
import { accessResultMessage, type AdminSecurityAccessMessages } from "@/features/admin-security-access/strings";
import styles from "./security.module.css";

export default function AccessDecideForm({ reviewId, strings }: {
  reviewId: string;
  strings: AdminSecurityAccessMessages;
}) {
  const [state, action, pending] = useActionState<AccessResult, FormData>(decideAccessReview, {});
  const d = strings.decide;

  return (
    <form action={action} className={styles.decideForm}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <Field label={d.decision} htmlFor={`dec-${reviewId}`}>
        <SaqeelSelect id={`dec-${reviewId}`} name="decision" label={d.decision} placeholder={d.decisionPlaceholder} defaultValue="" required
          options={[{ value: "retain", label: d.retain }, { value: "revoke", label: d.revoke }]} />
      </Field>
      <Field label={d.reason} htmlFor={`rsn-${reviewId}`}>
        <Textarea id={`rsn-${reviewId}`} name="reason" rows={2} required placeholder={d.reasonPlaceholder} />
      </Field>
      <div className={styles.formActions}>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? d.recording : d.record}</Button>
        {state.error ? <Text role="label" tone="danger" live="alert">{accessResultMessage(state.error, strings)}</Text> : null}
        {state.notice ? <Text role="label" tone="success" live="status">{accessResultMessage(state.notice, strings)}</Text> : null}
      </div>
    </form>
  );
}
