import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { StepState } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-progress.module.css";

export type ApprovalProgressStrings = {
  readonly heading: string;
  readonly overall: string;
  readonly none: string;
  readonly approved: string;
  readonly rejected: string;
  readonly pending: string;
};

export default function ApprovalProgress({ groups, decided, total, labelFor, strings }: {
  groups: readonly StepState[];
  decided: number;
  total: number;
  labelFor: (step: string) => string;
  strings: ApprovalProgressStrings;
}) {
  return (
    <Card as="section" labelledBy="approval-progress">
      <CardHeader level="h2" titleId="approval-progress" title={strings.heading} />
      <CardBody gap="tight">
        <ul className={styles.list}>
          {groups.map(group => (
            <li className={styles.group} key={group.step}>
              <span className={styles.label}>{labelFor(group.step)}</span>
              {group.breakdown.total === 0 ? (
                <span className={styles.absent}>{strings.none}</span>
              ) : (
                <span className={styles.parts}>
                  {group.breakdown.approved > 0
                    ? <span>{fill(strings.approved, { count: group.breakdown.approved })}</span> : null}
                  {group.breakdown.rejected > 0
                    ? <span>{fill(strings.rejected, { count: group.breakdown.rejected })}</span> : null}
                  {group.breakdown.pending > 0
                    ? <span>{fill(strings.pending, { count: group.breakdown.pending })}</span> : null}
                </span>
              )}
            </li>
          ))}
        </ul>
        <StatusPill tone={decided === total ? "success" : "warning"}>
          {fill(strings.overall, { decided, total })}
        </StatusPill>
      </CardBody>
    </Card>
  );
}
