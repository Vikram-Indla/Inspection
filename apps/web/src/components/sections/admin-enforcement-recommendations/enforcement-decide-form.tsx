"use client";

import { useActionState, useEffect, useState } from "react";
import Button from "@/components/saqeel/button/button";
import ChoiceGroup from "@/components/saqeel/choice-group/choice-group";
import Field from "@/components/saqeel/field/field";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { decideEnforcementRecommendation, type DecideResult } from "@/app/(app)/admin/enforcement-recommendations/actions";
import { decideResultMessage, type EnforcementRecommendationsMessages } from "@/features/admin-enforcement-recommendations/strings";
import styles from "./enforcement-recs.module.css";

export default function EnforcementDecideForm({ id, strings }: {
  id: string;
  strings: EnforcementRecommendationsMessages;
}) {
  const [state, formAction, pending] = useActionState<DecideResult, FormData>(decideEnforcementRecommendation, {});
  const [decision, setDecision] = useState("approved");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  useEffect(() => setIdempotencyKey(crypto.randomUUID()), []);
  const d = strings.decide;

  return (
    <form action={formAction} className={styles.decideForm}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <ChoiceGroup
        legend={d.legend}
        name="decision"
        value={decision}
        onChange={setDecision}
        layout="inline"
        options={[{ value: "approved", label: d.approve }, { value: "rejected", label: d.reject }]}
      />
      <Field label={d.reasonLabel} htmlFor={`enf-reason-${id}`}>
        <Textarea id={`enf-reason-${id}`} name="decision_reason" rows={2} required maxLength={2000} placeholder={d.reasonPlaceholder} />
      </Field>
      {state.error ? <Text role="label" tone="danger" live="alert">{decideResultMessage(state.error, strings)}</Text> : null}
      {state.ok ? <Text role="label" tone="success" live="status">{d.success}</Text> : null}
      <Button type="submit" variant="primary" disabled={pending}>{pending ? d.recording : d.submit}</Button>
    </form>
  );
}
