import { type ReactNode } from "react";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import Stack from "@/components/saqeel/stack/stack";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Skeleton } from "@/components/saqeel/skeleton/skeleton";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./review-outcome.module.css";

export type ReviewOutcomeStrings = {
  publishingTitle: string; publishingBody: string; publishingSub: string;
  failTitle: string; failBody: string; failSub: string; tryAgain: string;
  successTitle: string; successBody: string; successSub: string;
  sPlan: string; sVisits: string; sAssign: string; sNotif: string;
  goVisits: string; openPlan: string; backConfig: string;
  droppedH: string; droppedD: string;
};

export type DroppedRow = { id: string; name: string; reasons: string };

type OutcomeTone = "pending" | "danger" | "success";

const OUTCOME_ICON: Readonly<Record<OutcomeTone, IconName>> = {
  pending: "restricted",
  danger: "dismiss",
  success: "selected",
};

function OutcomeShell({ tone, title, headingRef, live, children, actions }: {
  tone: OutcomeTone;
  title: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
  live: "status" | "alert";
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Card as="section">
      <CardBody gap="default">
        <div className={styles.head} data-tone={tone}>
          <span className={styles.badge} aria-hidden="true"><Icon name={OUTCOME_ICON[tone]} size="md" /></span>
          <Stack gap="tight">
            <h3 className={styles.title} tabIndex={-1} ref={headingRef} role={live}>{title}</h3>
            {children}
          </Stack>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </CardBody>
    </Card>
  );
}

export function ReviewPublishing({ strings }: { strings: ReviewOutcomeStrings }) {
  return (
    <OutcomeShell tone="pending" title={strings.publishingTitle} live="status">
      <p role="status">{strings.publishingBody}</p>
      <p className={styles.note}>{strings.publishingSub}</p>
      <Skeleton shape="line" width="wide" size="sm" />
    </OutcomeShell>
  );
}

export function ReviewFailure({ reason, headingRef, retryForm, strings }: {
  reason: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  retryForm: ReactNode;
  strings: ReviewOutcomeStrings;
}) {
  return (
    <OutcomeShell
      tone="danger"
      title={strings.failTitle}
      headingRef={headingRef}
      live="alert"
      actions={<>{retryForm}<Button variant="secondary" href="/planning/bulk">{strings.backConfig}</Button></>}
    >
      <p>{reason || strings.failBody}</p>
      <p className={styles.note}>{strings.failSub}</p>
    </OutcomeShell>
  );
}

export function ReviewSuccess({ created, proposed, dropped, planId, headingRef, strings }: {
  created: number;
  proposed: number;
  dropped: readonly DroppedRow[];
  planId: string | null;
  headingRef: React.Ref<HTMLHeadingElement>;
  strings: ReviewOutcomeStrings;
}) {
  const cells: readonly (readonly [string, string])[] = [
    [strings.sPlan, "1"],
    [strings.sVisits, String(created)],
    [strings.sAssign, String(proposed)],
    [strings.sNotif, strings.sNotif],
  ];

  return (
    <OutcomeShell
      tone="success"
      title={strings.successTitle}
      headingRef={headingRef}
      live="status"
      actions={<>
        <Button variant="primary" href="/visits">{strings.goVisits}</Button>
        {planId === null ? null : <Button variant="secondary" href={`/planning/plans/${planId}`}>{strings.openPlan}</Button>}
      </>}
    >
      <p>{strings.successBody}</p>
      <div className={styles.counts}>
        {cells.map(([label, value]) => (
          <span className={styles.cell} key={label}>
            <span className={styles.cellLabel}>{label}</span>
            <span className={styles.cellValue}>{value}</span>
          </span>
        ))}
      </div>
      {dropped.length > 0 && (
        <PlanningNotice tone="warning" label={strings.droppedH.replace("{n}", String(dropped.length))}>
          {strings.droppedD}
          <span className={styles.dropped}>
            {dropped.map(row => <span key={row.id}><bdi>{row.name}</bdi>{` — ${row.reasons}`}</span>)}
          </span>
        </PlanningNotice>
      )}
      <p className={styles.note}>{strings.successSub}</p>
    </OutcomeShell>
  );
}
