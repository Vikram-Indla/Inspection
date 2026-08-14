import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { RecordedDependents } from "@/features/approvals/dependents";
import type { ApprovalComponentRow } from "@/features/approvals/queries";
import { changeKindOf, componentTone, fieldDiffs } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-object-card.module.css";
import ApprovalDecisionForm, { type ApprovalDecisionStrings } from "../approval-decision-form/approval-decision-form";
import ApprovalFieldDiff, { type ApprovalFieldDiffStrings } from "../approval-field-diff/approval-field-diff";
import { Overline, Text } from "@/components/saqeel/type";

export type ApprovalObjectStrings = {
  readonly created: string;
  readonly modified: string;
  readonly dependencies: string;
  readonly noDependencies: string;
  readonly recordedDependents: string;
  readonly dependentsNote: string;
  readonly dependentsUnavailable: string;
  readonly noDependents: string;
  readonly clauses: string;
  readonly items: string;
  readonly violations: string;
  readonly penalties: string;
  readonly reviewerComment: string;
  readonly decidedComment: string;
  readonly published: string;
  readonly diff: ApprovalFieldDiffStrings;
  readonly decision: ApprovalDecisionStrings;
};

export default function ApprovalObjectCard({
  component, parents, dependents, recorded, recordedReadable, canDecide, publishedVersion,
  kindLabel, statusLabel, fieldLabel, strings,
}: {
  component: ApprovalComponentRow;
  parents: readonly ApprovalComponentRow[];
  dependents: number;
  recorded: RecordedDependents | undefined;
  recordedReadable: boolean;
  canDecide: boolean;
  publishedVersion: string | null;
  kindLabel: (kind: string) => string;
  statusLabel: (status: string) => string;
  fieldLabel: (field: string) => string;
  strings: ApprovalObjectStrings;
}) {
  const isCreate = changeKindOf(component) === "created";
  const counts = recorded
    ? [
        { key: "clauses", label: strings.clauses, value: recorded.clauses },
        { key: "items", label: strings.items, value: recorded.items },
        { key: "violations", label: strings.violations, value: recorded.violations },
        { key: "penalties", label: strings.penalties, value: recorded.penalties },
      ].filter(entry => entry.value > 0)
    : [];

  return (
    <Card as="article">
      <CardHeader
        level="h3"
        title={isCreate ? strings.created : strings.modified}
        description={kindLabel(component.entity_kind)}
        trailing={<StatusPill tone={componentTone(component.component_status)}>{statusLabel(component.component_status)}</StatusPill>}
      />
      <CardBody gap="tight">
        <ApprovalFieldDiff
          diffs={fieldDiffs(component)}
          isCreate={isCreate}
          labelFor={fieldLabel}
          strings={strings.diff}
        />

        <section className={styles.block}>
          <h4 className={styles.blockTitle}><Overline as="span">{strings.dependencies}</Overline></h4>
          {parents.length ? (
            <ul className={styles.chips}>
              {parents.map(parent => <li className={styles.chip} key={parent.id}>{kindLabel(parent.entity_kind)}</li>)}
            </ul>
          ) : (
            <Text tone="muted">{strings.noDependencies}</Text>
          )}
        </section>

        {component.target_entity_id ? (
          <section className={styles.block}>
            <h4 className={styles.blockTitle}><Overline as="span">{strings.recordedDependents}</Overline></h4>
            {!recordedReadable ? (
              <Text tone="muted">{strings.dependentsUnavailable}</Text>
            ) : counts.length ? (
              <ul className={styles.counts}>
                {counts.map(entry => (
                  <li className={styles.count} key={entry.key}>
                    <Text as="span" tone="inherit">{entry.label}</Text>
                    <bdi className={styles.countValue}><Text as="span" tone="inherit" numeric>{entry.value}</Text></bdi>
                  </li>
                ))}
              </ul>
            ) : (
              <Text tone="muted">{strings.noDependents}</Text>
            )}
            <Text tone="muted">{strings.dependentsNote}</Text>
          </section>
        ) : null}

        {component.component_comments ? (
          <p className={styles.comment}>
            <Overline as="span">{strings.reviewerComment}</Overline>
            <Text as="span" tone="inherit" dir="auto">{component.component_comments}</Text>
          </p>
        ) : null}

        {component.decision_comments ? (
          <p className={styles.comment}>
            <Overline as="span">{strings.decidedComment}</Overline>
            <Text as="span" tone="inherit" dir="auto">{component.decision_comments}</Text>
          </p>
        ) : null}

        {publishedVersion ? (
          <p className={styles.published}><Text as="span" tone="inherit">{fill(strings.published, { version: publishedVersion })}</Text></p>
        ) : null}

        {canDecide && component.component_status === "pending_review" ? (
          <ApprovalDecisionForm
            requestId={component.request_id}
            componentId={component.id}
            dependents={dependents}
            strings={strings.decision}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
