import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Timeline from "@/components/saqeel/timeline/timeline";
import type { WorkspaceAuditEvent } from "@/features/regulations/workspace-source";
import styles from "./regulation-audit.module.css";

export type RegulationAuditStrings = {
  readonly label: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly footnote: string;
};

export default function RegulationAudit({ events, labelFor, formatStamp, strings }: {
  events: readonly WorkspaceAuditEvent[];
  labelFor: (value: string) => string;
  formatStamp: (iso: string) => string;
  strings: RegulationAuditStrings;
}) {
  if (!events.length) {
    return <EmptyState title={strings.emptyTitle} description={strings.emptyBody} size="sm" />;
  }

  return (
    <>
      <Timeline
        label={strings.label}
        events={events.map(event => ({
          id: String(event.id),
          dateTime: event.occurred_at,
          time: formatStamp(event.occurred_at),
          title: labelFor(event.action),
          meta: event.actor ?? undefined,
        }))}
      />
      <p className={styles.footnote}>{strings.footnote}</p>
    </>
  );
}
