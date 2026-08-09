import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { RecordedDependents } from "@/features/approvals/dependents";
import type { ApprovalComponentRow } from "@/features/approvals/queries";
import { changeKindOf, componentTone, fieldDiffs } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-object-card.module.css";
import ApprovalDecisionForm, { type ApprovalDecisionStrings } from "../approval-decision-form/approval-decision-form";
import ApprovalFieldDiff, { type ApprovalFieldDiffStrings } from "../approval-field-diff/approval-field-diff";

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
        eyebrow={kindLabel(component.entity_kind)}
        title={isCreate ? strings.created : strings.modified}
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
          <h4 className={styles.blockTitle}>{strings.dependencies}</h4>
          {parents.length ? (
            <ul className={styles.chips}>
              {parents.map(parent => <li className={styles.chip} key={parent.id}>{kindLabel(parent.entity_kind)}</li>)}
            </ul>
          ) : (
            <p className={styles.muted}>{strings.noDependencies}</p>
          )}
        </section>

        {component.target_entity_id ? (
          <section className={styles.block}>
            <h4 className={styles.blockTitle}>{strings.recordedDependents}</h4>
            {!recordedReadable ? (
              <p className={styles.muted}>{strings.dependentsUnavailable}</p>
            ) : counts.length ? (
              <ul className={styles.counts}>
                {counts.map(entry => (
                  <li className={styles.count} key={entry.key}>
                    <span>{entry.label}</span>
                    <bdi className={styles.countValue}>{entry.value}</bdi>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>{strings.noDependents}</p>
            )}
            <p className={styles.muted}>{strings.dependentsNote}</p>
          </section>
        ) : null}

        {component.component_comments ? (
          <p className={styles.comment}>
            <span className={styles.commentLabel}>{strings.reviewerComment}</span>
            <span dir="auto">{component.component_comments}</span>
          </p>
        ) : null}

        {component.decision_comments ? (
          <p className={styles.comment}>
            <span className={styles.commentLabel}>{strings.decidedComment}</span>
            <span dir="auto">{component.decision_comments}</span>
          </p>
        ) : null}

        {publishedVersion ? (
          <p className={styles.published}>{fill(strings.published, { version: publishedVersion })}</p>
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
