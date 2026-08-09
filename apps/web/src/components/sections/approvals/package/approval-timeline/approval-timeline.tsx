import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Timeline, { type TimelineEvent } from "@/components/saqeel/timeline/timeline";
import styles from "./approval-timeline.module.css";

export type ApprovalTimelineStrings = {
  readonly heading: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly footnote: string;
};

export default function ApprovalTimeline({ events, strings }: {
  events: readonly TimelineEvent[];
  strings: ApprovalTimelineStrings;
}) {
  return (
    <Card as="section" labelledBy="approval-timeline">
      <CardHeader level="h2" titleId="approval-timeline" title={strings.heading} />
      <CardBody gap="tight">
        {events.length === 0 ? (
          <EmptyState title={strings.emptyTitle} description={strings.emptyBody} size="sm" />
        ) : (
          <Timeline events={events} label={strings.heading} />
        )}
        <p className={styles.footnote}>{strings.footnote}</p>
      </CardBody>
    </Card>
  );
}
