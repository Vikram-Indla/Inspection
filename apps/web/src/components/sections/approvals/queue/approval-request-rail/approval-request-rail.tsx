import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { ApprovalRequestRow } from "@/features/approvals/queries";
import { fill } from "@/i18n/messages";
import styles from "./approval-request-rail.module.css";

export type ApprovalRailEntry = {
  readonly request: ApprovalRequestRow;
  readonly requester: string | null;
  readonly submitted: string | null;
  readonly chips: readonly { readonly key: string; readonly label: string }[];
  readonly progress: string;
};

export type ApprovalRailStrings = {
  readonly heading: string;
  readonly requesterUnknown: string;
  readonly notSubmitted: string;
  readonly select: string;
  readonly selected: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

export default function ApprovalRequestRail({ entries, selectedId, hrefFor, statusLabelFor, typeLabelFor, strings }: {
  entries: readonly ApprovalRailEntry[];
  selectedId: string;
  hrefFor: (request: ApprovalRequestRow) => string;
  statusLabelFor: (status: string) => string;
  typeLabelFor: (type: string) => string;
  strings: ApprovalRailStrings;
}) {
  return (
    <nav aria-labelledby="approval-rail">
      <Card as="div">
        <CardHeader
          level="h2"
          titleId="approval-rail"
          title={strings.heading}
          trailing={<CountBadge tone="neutral" value={entries.length} />}
        />
        <CardBody gap="tight">
          {entries.length === 0 ? (
            <EmptyState title={strings.emptyTitle} description={strings.emptyBody} size="sm" />
          ) : (
            <ul className={styles.list}>
              {entries.map(entry => {
                const isSelected = entry.request.id === selectedId;
                return (
                  <li key={entry.request.id}>
                    <Link
                      className={styles.entry}
                      href={hrefFor(entry.request)}
                      aria-current={isSelected ? "true" : undefined}
                      aria-label={fill(isSelected ? strings.selected : strings.select, {
                        number: entry.request.request_number,
                      })}
                    >
                      <span className={styles.type}>{typeLabelFor(entry.request.request_type)}</span>
                      <span className={styles.title} dir="auto">{entry.request.title}</span>
                      <bdi className={styles.number}>{entry.request.request_number}</bdi>

                      <span className={styles.chips}>
                        {entry.chips.map(chip => <span className={styles.chip} key={chip.key}>{chip.label}</span>)}
                      </span>

                      <span className={styles.meta}>
                        <span>{entry.requester ?? strings.requesterUnknown}</span>
                        <span>{entry.submitted ?? strings.notSubmitted}</span>
                      </span>

                      <span className={styles.foot}>
                        <StatusPill tone="neutral">{statusLabelFor(entry.request.status)}</StatusPill>
                        <span className={styles.progress}>{entry.progress}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </nav>
  );
}
