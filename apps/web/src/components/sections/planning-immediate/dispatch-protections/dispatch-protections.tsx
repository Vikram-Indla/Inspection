"use client";
import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { Protection } from "@/features/planning-immediate/protections";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import styles from "./dispatch-protections.module.css";

const HEADING_ID = "immediate-protections";
const ANNOUNCEMENT_SEPARATOR = ". ";
const PART_SEPARATOR = " — ";

const focusOwningControl = (controlId: string): void => {
  document.getElementById(controlId)?.focus();
};

export default function DispatchProtections({ blockers, messages }: {
  blockers: readonly Protection[];
  messages: ImmediateMessages["protections"];
}) {
  const cleared = blockers.length === 0;
  const describe = (blocker: Protection) =>
    [blocker.name, messages.blocking, blocker.detail].join(PART_SEPARATOR);
  const announcement = cleared
    ? messages.allSatisfied
    : blockers.map(describe).join(ANNOUNCEMENT_SEPARATOR);

  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardBody gap="tight">
        <Heading level={2} visual="subheading" id={HEADING_ID}>{messages.groupLabel}</Heading>

        <div role={cleared ? "status" : "alert"}>
          <p className={styles.summary}>
            <StatusPill tone={cleared ? "success" : "danger"}>
              {cleared ? messages.satisfied : messages.blocking}
            </StatusPill>
            {cleared ? <Text as="span" tone="muted">{messages.allSatisfied}</Text> : null}
          </p>

          {cleared ? null : (
            <ul className={styles.list}>
              {blockers.map(blocker => {
                const body = (
                  <span className={styles.body}>
                    <Text role="label" as="span">{blocker.name}</Text>
                    <Text role="body" tone="muted" as="span">{blocker.detail}</Text>
                  </span>
                );

                return (
                  <li key={blocker.id}>
                    {blocker.controlId === null ? (
                      <span className={styles.row}>{body}</span>
                    ) : (
                      <button
                        className={styles.row}
                        type="button"
                        aria-label={describe(blocker)}
                        onClick={() => focusOwningControl(blocker.controlId ?? "")}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <span className="sqx-visually-hidden" role="alert" aria-live="assertive">{announcement}</span>
      </CardBody>
    </Card>
  );
}
