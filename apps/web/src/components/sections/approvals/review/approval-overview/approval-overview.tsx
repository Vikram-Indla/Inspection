import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import type { ApprovalRequestRow } from "@/features/approvals/queries";
import type { PackageSummary } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-overview.module.css";
import { Heading, Mono, Text } from "@/components/saqeel/type";

export type ApprovalOverviewStrings = {
  readonly requestNumber: string;
  readonly requestType: string;
  readonly requester: string;
  readonly justification: string;
  readonly submitted: string;
  readonly revision: string;
  readonly status: string;
  readonly summary: string;
  readonly createdCount: string;
  readonly modifiedCount: string;
  readonly notRecorded: string;
  readonly requesterUnknown: string;
  readonly notSubmitted: string;
  readonly absent: string;
};

export default function ApprovalOverview({
  request, summary, requester, submitted, typeLabel, statusLabel, kindLabel, strings,
}: {
  request: ApprovalRequestRow;
  summary: PackageSummary;
  requester: string | null;
  submitted: string | null;
  typeLabel: string;
  statusLabel: string;
  kindLabel: (kind: string) => string;
  strings: ApprovalOverviewStrings;
}) {
  const missing = <Text as="span" tone="muted">{strings.notRecorded}</Text>;

  return (
    <div className={styles.root}>
      <DefinitionList
        columns="two"
        items={[
          { label: strings.requestNumber, value: <bdi><Mono tone="inherit">{request.request_number}</Mono></bdi> },
          { label: strings.requestType, value: typeLabel },
          { label: strings.requester, value: requester ?? <Text as="span" tone="muted">{strings.requesterUnknown}</Text> },
          { label: strings.submitted, value: submitted ?? <Text as="span" tone="muted">{strings.notSubmitted}</Text> },
          { label: strings.revision, value: <bdi>{request.current_revision}</bdi> },
          { label: strings.status, value: statusLabel },
          { label: strings.justification, value: request.description?.trim() ? <span dir="auto">{request.description}</span> : missing },
        ]}
      />

      <section className={styles.section} aria-labelledby="approval-package-summary">
        <Heading level={3} id="approval-package-summary">{strings.summary}</Heading>
        <ul className={styles.chips}>
          {[...summary.byKind.entries()].map(([kind, count]) => (
            <li className={styles.chip} key={kind}>{kindLabel(kind)} <bdi>{count}</bdi></li>
          ))}
          <li className={styles.chip}>{fill(strings.createdCount, { count: summary.created })}</li>
          <li className={styles.chip}>{fill(strings.modifiedCount, { count: summary.modified })}</li>
        </ul>
        <p className={styles.note}><Text as="span" tone="inherit">{strings.absent}</Text></p>
      </section>
    </div>
  );
}
