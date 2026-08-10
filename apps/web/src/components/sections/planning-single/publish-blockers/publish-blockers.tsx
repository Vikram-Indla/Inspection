"use client";
import type { RefObject } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { PublishSteps, StepStatus } from "@/app/(app)/planning/single/actions";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import styles from "./publish-blockers.module.css";

const BLOCKER_SEPARATOR = " · ";

const STEP_TONES: Readonly<Record<StepStatus, StatusTone>> = {
  done: "success",
  failed: "danger",
  pending: "neutral",
};

export default function PublishBlockers({ error, steps, focusRef, strings }: {
  error: string;
  steps?: PublishSteps;
  focusRef: RefObject<HTMLDivElement | null>;
  strings: SingleVisitStrings;
}) {
  const stepLabel = (status: StepStatus) =>
    status === "done" ? strings.stepDone : status === "failed" ? strings.stepFailed : strings.stepPending;

  const stepRows = steps
    ? [
        { key: "plan", label: strings.stepPlan, status: steps.plan },
        { key: "visit", label: strings.stepVisit, status: steps.visit },
        { key: "assignment", label: strings.stepAssignment, status: steps.assignment },
        { key: "status", label: strings.stepStatus, status: steps.status },
        { key: "notification", label: strings.stepNotification, status: steps.notification },
      ]
    : [];

  return (
    <div ref={focusRef} tabIndex={-1}>
      <Card as="section" labelledBy="single-visit-blocked">
        <CardHeader
          level="h2"
          titleId="single-visit-blocked"
          title={strings.blockedTitle}
          trailing={<StatusPill tone="danger">{strings.blockedTitle}</StatusPill>}
        />
        <CardBody gap="tight">
          <ul className={styles.blockers}>
            {error.split(BLOCKER_SEPARATOR).map(blocker => <li key={blocker}>{blocker}</li>)}
          </ul>
          {stepRows.length > 0 ? (
            <ul className={styles.steps}>
              {stepRows.map(step => (
                <li className={styles.step} key={step.key}>
                  <span>{step.label}</span>
                  <StatusPill tone={STEP_TONES[step.status]}>{stepLabel(step.status)}</StatusPill>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
