import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import Choice from "@/components/saqeel/choice/choice";
import Field from "@/components/saqeel/field/field";
import Textarea from "@/components/saqeel/textarea/textarea";
import { Text } from "@/components/saqeel/type";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import styles from "./review-publish-form.module.css";

export type PublishFormStrings = {
  correctH: string; backConfig: string; backConfigD: string;
  notes: string; notesPlaceholder: string;
  ackRequired: string; ackLabel: string;
  willRecheck: string; allClear: string; disabledPrefix: string;
  saveDraft: string; savingDraft: string; draftSaveFailed: string;
  publishLabel: string; blockedReason: string | null;
  transitionsBlocked: string | null;
};

const REASON_ID = "review-publish-reason";

export default function ReviewPublishForm({
  action, hiddenFields, notes, onNotesChange,
  acknowledgement, savedMessage, saveFailed, saving, canSaveDraft, canPublish,
  strings, onSaveDraft,
}: {
  action: (payload: FormData) => void;
  hiddenFields: ReactNode;
  notes: string;
  onNotesChange: (value: string) => void;
  acknowledgement: { required: boolean; checked: boolean; onChange: (checked: boolean) => void } | null;
  savedMessage: string | null;
  saveFailed: boolean;
  saving: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  strings: PublishFormStrings;
  onSaveDraft: () => void;
}) {
  return (
    <Card as="section">
      <CardHeader title={strings.correctH} description={strings.backConfigD} />
      <CardBody gap="default">
        <form action={action} id="review-publish" aria-label={strings.correctH} className={styles.form}>
          {hiddenFields}

          <Button variant="link" href="/planning/bulk">{strings.backConfig}</Button>

          <Field label={strings.notes} htmlFor="review-notes">
            <Textarea
              id="review-notes"
              rows={2}
              value={notes}
              placeholder={strings.notesPlaceholder}
              onChange={onNotesChange}
            />
          </Field>

          {acknowledgement?.required ? (
            <PlanningNotice tone="warning" label={strings.ackRequired}>
              <span className={styles.ack}>
                <Choice
                  kind="checkbox"
                  name="review-acknowledge"
                  value="eligible-subset"
                  label={strings.ackLabel}
                  checked={acknowledgement.checked}
                  onChange={acknowledgement.onChange}
                />
              </span>
            </PlanningNotice>
          ) : null}

          <Text tone="muted">{strings.willRecheck}</Text>

          {strings.transitionsBlocked === null ? null : (
            <PlanningNotice tone="warning">{strings.transitionsBlocked}</PlanningNotice>
          )}

          <div className={styles.actions}>
            <span className={styles.status}>
              {strings.blockedReason === null
                ? <Text as="span" tone="muted">{strings.allClear}</Text>
                : <Text as="span" tone="danger" id={REASON_ID}>{`${strings.disabledPrefix}${strings.blockedReason}`}</Text>}
              {savedMessage === null ? null : <Text as="span" tone="muted" live="status">{savedMessage}</Text>}
              {saveFailed ? <Text as="span" tone="danger" live="alert">{strings.draftSaveFailed}</Text> : null}
            </span>

            <Button variant="secondary" busy={saving} disabled={!canSaveDraft} onClick={onSaveDraft}>
              {strings.saveDraft}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!canPublish}
              describedBy={strings.blockedReason === null ? undefined : REASON_ID}
            >
              {strings.publishLabel}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
