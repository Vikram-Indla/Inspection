"use client";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { Text } from "@/components/saqeel/type";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import styles from "./immediate-outcome.module.css";

const HEADING_ID = "immediate-consequences";

export default function ImmediateOutcome({ reviewed, onReview, error, pending, canSubmit, messages }: {
  reviewed: boolean;
  onReview: (confirmed: boolean) => void;
  error: string | null;
  pending: boolean;
  canSubmit: boolean;
  messages: ImmediateMessages;
}) {
  const { consequences, submit } = messages;
  const outcomes = [consequences.visit, consequences.assign, consequences.notify, consequences.audit];

  return (
    <>
      <Card as="section" labelledBy={HEADING_ID}>
        <CardHeader level="h2" titleId={HEADING_ID} title={consequences.heading} />
        <CardBody gap="tight">
          <ul className={styles.outcomes}>
            {outcomes.map(outcome => <Text role="body" as="li" key={outcome}>{outcome}</Text>)}
          </ul>
          <Choice
            kind="checkbox"
            name="review_confirmed"
            value="yes"
            required
            checked={reviewed}
            label={consequences.reviewConfirm}
            onChange={onReview}
          />
        </CardBody>
      </Card>

      {error === null ? null : (
        <PlanningNotice tone="danger" label={submit.blockedTitle}>{error}</PlanningNotice>
      )}

      <div className={styles.actionBar}>
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} label={submit.create}>
          {pending ? submit.creating : submit.create}
        </Button>
      </div>
    </>
  );
}
