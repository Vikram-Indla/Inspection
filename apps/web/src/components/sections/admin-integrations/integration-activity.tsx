import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import { Mono, Text } from "@/components/saqeel/type";
import styles from "./integrations.module.css";

export type ActivityItem = {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly stamp: string;
  readonly status: string;
};

export default function IntegrationActivity({ title, help, items, failed, error, emptyIcon, emptyTitle, emptyBody, alertLabel }: {
  title: string;
  help: string;
  items: readonly ActivityItem[];
  failed: boolean;
  error: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyBody: string;
  alertLabel: string;
}) {
  return (
    <Card as="section">
      <CardHeader level="h2" title={title} description={help} />
      <CardBody>
        {failed ? (
          <Text tone="warning" live="alert">{error}</Text>
        ) : items.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyBody} size="sm" />
        ) : (
          <ul className={styles.governanceList} aria-label={alertLabel}>
            {items.map(item => (
              <li className={styles.activityRow} key={item.id}>
                <span className={styles.activityMain}>
                  <Text as="span" role="bodyStrong">{item.title}</Text>
                  <Mono tone="muted" as="span">{item.meta}</Mono>
                  <Text as="time" role="label" tone="muted">{item.stamp}</Text>
                </span>
                <StatusPill tone="neutral">{item.status}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
