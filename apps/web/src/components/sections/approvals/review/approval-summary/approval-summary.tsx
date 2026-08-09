import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { StepState } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-summary.module.css";

export type ApprovalSummaryStrings = {
  readonly heading: string;
  readonly none: string;
  readonly breakdown: string;
  readonly settled: string;
  readonly outstanding: string;
  readonly checks: string;
  readonly missingComment: string;
  readonly missingCommentNote: string;
  readonly validation: string;
  readonly validationAbsent: string;
  readonly conflicts: string;
  readonly conflictsAbsent: string;
};

export default function ApprovalSummary({ groups, missingComments, ready, labelFor, strings }: {
  groups: readonly StepState[];
  missingComments: number;
  ready: boolean;
  labelFor: (step: string) => string;
  strings: ApprovalSummaryStrings;
}) {
  return (
    <div className={styles.root}>
      <DefinitionList
        columns="two"
        items={groups.map(group => ({
          label: labelFor(group.step),
          value: group.breakdown.total === 0
            ? <span className={styles.absent}>{strings.none}</span>
            : fill(strings.breakdown, {
                approved: group.breakdown.approved,
                rejected: group.breakdown.rejected,
                pending: group.breakdown.pending,
              }),
        }))}
      />

      <StatusPill tone={ready ? "success" : "warning"}>
        {ready ? strings.settled : strings.outstanding}
      </StatusPill>

      <section aria-labelledby="approval-checks">
        <h3 className={styles.heading} id="approval-checks">{strings.checks}</h3>
        <ul className={styles.checks}>
          <li className={styles.check}>
            <span>{strings.missingComment}</span>
            <bdi className={styles.value} data-flagged={missingComments > 0 ? "" : undefined}>{missingComments}</bdi>
          </li>
          <li className={styles.check}>
            <span>{strings.validation}</span>
            <span className={styles.absent}>{strings.validationAbsent}</span>
          </li>
          <li className={styles.check}>
            <span>{strings.conflicts}</span>
            <span className={styles.absent}>{strings.conflictsAbsent}</span>
          </li>
        </ul>
        <p className={styles.note}>{strings.missingCommentNote}</p>
      </section>
    </div>
  );
}
