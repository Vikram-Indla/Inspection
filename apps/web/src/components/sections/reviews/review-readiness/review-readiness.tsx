import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { readinessTone } from "@/features/reviews/queue-rows";
import type { ReviewsStrings } from "@/features/reviews/strings";
import type { QueueRow, ReadinessFact } from "@/features/reviews/types";
import styles from "./review-readiness.module.css";

const FACT_KEYS = ["checklist", "evidence", "ack", "factory"] as const;

const SETTLED: readonly ReadinessFact[] = ["present", "verified"];

/**
 * Exceptions only.
 *
 * The previous cell printed all eight facts on every row — deadline, risk,
 * criticals, priority and four readiness values — so a queue of settled reviews
 * carried the same visual weight as a queue full of problems, and the reader had
 * to read every chip to find out that nothing was wrong. A fact that is present
 * or verified is the expected state and says nothing; only the departures earn a
 * pill, and a row with no departures says so once.
 */
export default function ReviewReadiness({ row, strings }: {
  row: QueueRow;
  strings: ReviewsStrings;
}) {
  if (!row.readable) {
    return (
      <span className={styles.root}>
        <StatusPill tone="danger" title={strings.readiness.noEvidenceBody}>
          {strings.readiness.noEvidenceTitle}
        </StatusPill>
      </span>
    );
  }

  const departures = FACT_KEYS.filter(key => !SETTLED.includes(row.readiness[key]));

  return (
    <span className={styles.root}>
      {row.slaState === "overdue"
        ? <StatusPill tone="danger">{strings.readiness.slaOverdue}</StatusPill>
        : null}
      {row.slaState === "none"
        ? <StatusPill tone="neutral" ping={false}>{strings.readiness.unavailable}</StatusPill>
        : null}
      {row.criticalCount > 0
        ? <StatusPill tone="danger">{row.criticalCount} {strings.readiness.critical}</StatusPill>
        : null}
      {row.unassigned
        ? <StatusPill tone="warning" title={strings.readiness.unassignedBlocked}>
          {strings.readiness.unassignedTitle}
        </StatusPill>
        : null}
      {departures.map(key => (
        <StatusPill key={key} tone={readinessTone(row.readiness[key])} ping={false}>
          {strings.readiness[key]}: {strings.readiness[row.readiness[key]]}
        </StatusPill>
      ))}
      {departures.length === 0 && row.slaState === "on_time" && row.criticalCount === 0 && !row.unassigned
        ? <StatusPill tone="success" ping={false}>{strings.readiness.slaOnTime}</StatusPill>
        : null}
    </span>
  );
}
