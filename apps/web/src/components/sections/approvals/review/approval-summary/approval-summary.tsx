import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { StepState } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-summary.module.css";
import { Heading, Text } from "@/components/saqeel/type";

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
            ? <Text as="span" tone="muted">{strings.none}</Text>
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

      <section className={styles.section} aria-labelledby="approval-checks">
        <Heading level={3} id="approval-checks">{strings.checks}</Heading>
        <ul className={styles.checks}>
          <li className={styles.check}>
            <Text as="span" tone="inherit">{strings.missingComment}</Text>
            <bdi className={styles.value} data-flagged={missingComments > 0 ? "" : undefined}><Text as="span" tone="inherit" numeric>{missingComments}</Text></bdi>
          </li>
          <li className={styles.check}>
            <Text as="span" tone="inherit">{strings.validation}</Text>
            <Text as="span" tone="muted">{strings.validationAbsent}</Text>
          </li>
          <li className={styles.check}>
            <Text as="span" tone="inherit">{strings.conflicts}</Text>
            <Text as="span" tone="muted">{strings.conflictsAbsent}</Text>
          </li>
        </ul>
        <p className={styles.note}><Text as="span" tone="inherit">{strings.missingCommentNote}</Text></p>
      </section>
    </div>
  );
}
