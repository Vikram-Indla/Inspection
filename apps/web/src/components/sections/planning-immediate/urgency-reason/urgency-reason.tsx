"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { OTHER_URGENCY_REASON, urgencyReasonOptions } from "@/features/planning-immediate/reasons";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import styles from "./urgency-reason.module.css";

const HEADING_ID = "immediate-urgency-reason";
const FIRST_CHOICE_ID = "imm-reason";

export default function UrgencyReason({ value, messages, onChange }: {
  value: string;
  messages: ImmediateMessages;
  onChange: (reason: string) => void;
}) {
  const options = urgencyReasonOptions(messages);

  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardHeader level="h2" titleId={HEADING_ID} title={messages.reason.heading} />
      <CardBody gap="tight">
        <div className={styles.options}>
          {options.map((option, index) => (
            <Choice
              key={option.value}
              kind="radio"
              name="urgency_reason"
              id={index === 0 ? FIRST_CHOICE_ID : undefined}
              value={option.value}
              required
              checked={value === option.value}
              label={option.label}
              onChange={() => onChange(option.value)}
            />
          ))}
        </div>
        {value === OTHER_URGENCY_REASON ? (
          <PlanningNotice tone="info">{messages.reason.otherHint}</PlanningNotice>
        ) : null}
      </CardBody>
    </Card>
  );
}
