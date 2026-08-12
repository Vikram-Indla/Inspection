"use client";

import { useActionState, useState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { updateVisitNotes, type ActionResult } from "./actions";
import styles from "./action-bar.module.css";

export type NotesStrings = {
  heading: string;
  label: string;
  placeholder: string;
  saveBtn: string;
  hint: string;
};

export default function NotesEditor({ visitId, planningVersion, initialNotes, strings }: {
  visitId: string;
  planningVersion: number;
  initialNotes: string;
  strings: NotesStrings;
}) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(updateVisitNotes, {});
  const [identity] = useState(() => ({
    idempotencyKey: `visit.metadata.notes.${crypto.randomUUID()}`,
    correlationId: crypto.randomUUID(),
  }));
  return (
    <Card as="section" labelledBy="visit-notes-heading">
      <CardHeader level="h2" titleId="visit-notes-heading" title={strings.heading} description={strings.hint} />
      <CardBody gap="tight">
        <form action={act} className={styles.stackedForm}>
          <input type="hidden" name="visit_id" value={visitId} />
          <input type="hidden" name="expected_version" value={planningVersion} />
          <input type="hidden" name="idempotency_key" value={identity.idempotencyKey} />
          <input type="hidden" name="correlation_id" value={identity.correlationId} />
          <Field label={strings.label} htmlFor="visit-notes">
            <Textarea
              name="notes"
              id="visit-notes"
              rows={3}
              defaultValue={initialNotes}
              placeholder={strings.placeholder}
            />
          </Field>
          <div className={styles.formActions}>
            <Button type="submit" variant="secondary" busy={pending} label={strings.saveBtn}>
              {strings.saveBtn}
            </Button>
          </div>
        </form>
        {state.error && <Text as="p" role="label" tone="danger" live="alert">{state.error}</Text>}
        {state.ok && <Text as="p" role="label" tone="success" live="status">{state.ok}</Text>}
      </CardBody>
    </Card>
  );
}
