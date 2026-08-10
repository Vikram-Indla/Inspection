import { type Ref } from "react";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Card, CardBody } from "@/components/saqeel/card/card";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import styles from "./review-readiness.module.css";

export type ReadinessTone = "danger" | "warning" | "neutral";

export type ReadinessItem = {
  key: string;
  tone: ReadinessTone;
  label: string;
  title: string;
  detail: string;
  fixLabel: string | null;
};

export type ReadinessStrings = {
  readiness: string;
  loadingNote: string;
  blockedTag: string;
  readyTag: string;
  blockersN: string;
  clearAll: string;
};

export default function ReviewReadiness({
  validating, items, warnings, headingRef, strings, onFix,
}: {
  validating: boolean;
  items: readonly ReadinessItem[];
  warnings: readonly ReadinessItem[];
  headingRef: Ref<HTMLHeadingElement>;
  strings: ReadinessStrings;
  onFix: (key: string) => void;
}) {
  return (
    <Card as="section">
      <CardBody gap="default">
        <h3 className={styles.heading} tabIndex={-1} ref={headingRef}>{strings.readiness}</h3>

        {validating ? <p className={styles.note} role="status">{strings.loadingNote}</p> : (
          <div role={items.length ? "alert" : "status"} aria-label={strings.readiness}>
            <p className={styles.summary}>
              <StatusPill tone={items.length ? "danger" : "success"}>
                {items.length ? strings.blockedTag : strings.readyTag}
              </StatusPill>
              <strong>
                {items.length ? strings.blockersN.replace("{n}", String(items.length)) : strings.clearAll}
              </strong>
            </p>

            {items.length > 0 && (
              <ul className={styles.list}>
                {items.map(item => (
                  <li className={styles.item} key={item.key}>
                    <StatusPill tone={item.tone}>{item.label}</StatusPill>
                    <span className={styles.body}>
                      <strong className={styles.title}>{item.title}</strong>
                      {item.detail ? <span className={styles.detail}>{item.detail}</span> : null}
                    </span>
                    {item.fixLabel === null ? null : (
                      <Button variant="secondary" onClick={() => onFix(item.key)}>{item.fixLabel}</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!validating && warnings.length > 0 && (
          <PlanningNotice tone="warning" label={warnings[0].label}>
            <span className={styles.warnings}>
              {warnings.map(warning => (
                <span key={warning.key}>
                  <strong>{warning.title}</strong>{warning.detail ? ` — ${warning.detail}` : ""}
                </span>
              ))}
            </span>
          </PlanningNotice>
        )}
      </CardBody>
    </Card>
  );
}
