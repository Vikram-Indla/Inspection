"use client";
import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { Protection, ProtectionState } from "@/features/planning-immediate/protections";
import { blockingProtections } from "@/features/planning-immediate/protections";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import { fill } from "@/i18n/messages";
import styles from "./dispatch-protections.module.css";

const HEADING_ID = "immediate-protections";
const ANNOUNCEMENT_SEPARATOR = ". ";

const TONES: Readonly<Record<ProtectionState, StatusTone>> = {
  satisfied: "success",
  blocking: "danger",
  informational: "neutral",
};

const focusOwningControl = (controlId: string): void => {
  document.getElementById(controlId)?.focus();
};

export default function DispatchProtections({ protections, messages }: {
  protections: readonly Protection[];
  messages: ImmediateMessages["protections"];
}) {
  const blockers = blockingProtections(protections);
  const stateLabel = (state: ProtectionState) =>
    state === "satisfied" ? messages.satisfied
      : state === "blocking" ? messages.blocking
        : messages.informational;

  const announcement = blockers.length === 0
    ? messages.allSatisfied
    : blockers
      .map(blocker => fill(messages.blockedAnnouncement, { label: blocker.name, detail: blocker.detail }))
      .join(ANNOUNCEMENT_SEPARATOR);

  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardBody>
        <Heading level={2} visual="subheading" id={HEADING_ID}>{messages.groupLabel}</Heading>

        <div className={styles.grid} role="group" aria-label={messages.groupLabel}>
          {protections.map(protection => {
            const state = stateLabel(protection.state);
            const pill = <StatusPill tone={TONES[protection.state]}>{state}</StatusPill>;
            const body = (
              <span className={styles.body}>
                <Text role="label" as="span">{protection.name}</Text>
                <Text role="body" tone="muted" as="span">{protection.detail}</Text>
              </span>
            );

            if (protection.controlId === null) {
              return (
                <span className={styles.chip} key={protection.id}>{pill}{body}</span>
              );
            }
            return (
              <button
                className={styles.chip}
                key={protection.id}
                type="button"
                aria-label={`${protection.name} — ${state} — ${protection.detail}`}
                onClick={() => focusOwningControl(protection.controlId ?? "")}
              >
                {pill}{body}
              </button>
            );
          })}
        </div>

        <div role={blockers.length > 0 ? "alert" : "status"}>
          {blockers.length === 0 ? (
            <PlanningNotice tone="info" label={stateLabel("satisfied")}>{messages.allSatisfied}</PlanningNotice>
          ) : (
            <PlanningNotice tone="danger" label={stateLabel("blocking")}>
              <span className={styles.blockers}>
                {blockers.map(blocker => (
                  <span className={styles.blocker} key={blocker.id}>
                    <Text role="label" as="span">{blocker.name}</Text>
                    {" — "}{blocker.detail}
                  </span>
                ))}
              </span>
            </PlanningNotice>
          )}
        </div>

        <span className="sqx-visually-hidden" role="alert" aria-live="assertive">{announcement}</span>
      </CardBody>
    </Card>
  );
}
