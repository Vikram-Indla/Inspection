import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { StepState } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-progress.module.css";
import { Text } from "@/components/saqeel/type";

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
              <Text as="span" role="bodyStrong">{labelFor(group.step)}</Text>
              {group.breakdown.total === 0 ? (
                <Text as="span" tone="muted">{strings.none}</Text>
              ) : (
                <span className={styles.parts}>
                  {group.breakdown.approved > 0
                    ? <Text as="span" tone="inherit">{fill(strings.approved, { count: group.breakdown.approved })}</Text> : null}
                  {group.breakdown.rejected > 0
                    ? <Text as="span" tone="inherit">{fill(strings.rejected, { count: group.breakdown.rejected })}</Text> : null}
                  {group.breakdown.pending > 0
                    ? <Text as="span" tone="inherit">{fill(strings.pending, { count: group.breakdown.pending })}</Text> : null}
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
