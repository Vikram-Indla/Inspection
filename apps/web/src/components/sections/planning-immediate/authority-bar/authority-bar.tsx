"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import {
  blockedEntry,
  blockingProtections,
  protectionAccessibleName,
  type AuthorityStrings,
  type Protection,
  type ProtectionState,
} from "@/features/planning-immediate/authority";
import styles from "./authority-bar.module.css";

const HEADING_ID = "immediate-authority-heading";

const TONES: Readonly<Record<ProtectionState, StatusTone>> = {
  satisfied: "success",
  blocking: "danger",
  informational: "neutral",
};

function stateLabel(state: ProtectionState, strings: AuthorityStrings): string {
  return state === "satisfied" ? strings.satisfied
    : state === "blocking" ? strings.blocking
      : strings.informational;
}

function ChipContent({ protection, strings }: { protection: Protection; strings: AuthorityStrings }) {
  return (
    <>
      <span className={styles.head}>
        <bdi className={styles.name}>{protection.name}</bdi>
        <StatusPill tone={TONES[protection.state]} ping={false}>
          {stateLabel(protection.state, strings)}
        </StatusPill>
      </span>
      <span className={styles.detail}>{protection.detail}</span>
    </>
  );
}

function ProtectionChip({ protection, strings }: { protection: Protection; strings: AuthorityStrings }) {
  const controlId = protection.controlId;
  if (controlId === null) {
    return (
      <span className={styles.chip} data-state={protection.state}>
        <ChipContent protection={protection} strings={strings} />
      </span>
    );
  }
  return (
    <button
      type="button"
      className={styles.chip}
      data-state={protection.state}
      aria-label={protectionAccessibleName(protection, strings)}
      onClick={() => document.getElementById(controlId)?.focus()}
    >
      <ChipContent protection={protection} strings={strings} />
    </button>
  );
}

export default function AuthorityBar({ protections, strings }: {
  protections: readonly Protection[];
  strings: AuthorityStrings;
}) {
  const blocking = blockingProtections(protections);

  return (
    <Card as="section" role="group" labelledBy={HEADING_ID}>
      <CardHeader level="h2" titleId={HEADING_ID} title={strings.heading} />
      <CardBody>
        <ul className={styles.protections}>
          {protections.map(protection => (
            <li className={styles.protection} data-protection={protection.id} key={protection.id}>
              <ProtectionChip protection={protection} strings={strings} />
            </li>
          ))}
        </ul>
        <div className={styles.summary} role="alert" data-state={blocking.length > 0 ? "blocking" : "clear"}>
          {blocking.length === 0 ? (
            <p className={styles.clear}>{strings.allSatisfied}</p>
          ) : (
            <ul className={styles.blockers}>
              {blocking.map(protection => (
                <li className={styles.blocker} key={protection.id}>{blockedEntry(protection, strings)}</li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
