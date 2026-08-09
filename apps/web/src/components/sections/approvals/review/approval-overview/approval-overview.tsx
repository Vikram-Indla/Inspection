import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import type { ApprovalRequestRow } from "@/features/approvals/queries";
import type { PackageSummary } from "@/features/approvals/rows";
import { fill } from "@/i18n/messages";
import styles from "./approval-overview.module.css";

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
  const missing = <span className={styles.absent}>{strings.notRecorded}</span>;

  return (
    <div className={styles.root}>
      <DefinitionList
        columns="two"
        items={[
          { label: strings.requestNumber, value: <bdi className={styles.code}>{request.request_number}</bdi> },
          { label: strings.requestType, value: typeLabel },
          { label: strings.requester, value: requester ?? <span className={styles.absent}>{strings.requesterUnknown}</span> },
          { label: strings.submitted, value: submitted ?? <span className={styles.absent}>{strings.notSubmitted}</span> },
          { label: strings.revision, value: <bdi>{request.current_revision}</bdi> },
          { label: strings.status, value: statusLabel },
          { label: strings.justification, value: request.description?.trim() ? <span dir="auto">{request.description}</span> : missing },
        ]}
      />

      <section aria-labelledby="approval-package-summary">
        <h3 className={styles.heading} id="approval-package-summary">{strings.summary}</h3>
        <ul className={styles.chips}>
          {[...summary.byKind.entries()].map(([kind, count]) => (
            <li className={styles.chip} key={kind}>{kindLabel(kind)} <bdi>{count}</bdi></li>
          ))}
          <li className={styles.chip}>{fill(strings.createdCount, { count: summary.created })}</li>
          <li className={styles.chip}>{fill(strings.modifiedCount, { count: summary.modified })}</li>
        </ul>
        <p className={styles.note}>{strings.absent}</p>
      </section>
    </div>
  );
}
