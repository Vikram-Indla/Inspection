import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { blockedLabel } from "@/features/analytics/strings";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { BlockedMetric } from "@/features/analytics/view";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-blocked.module.css";

export default function AnalyticsBlocked({ blocked, strings, locale }: {
  blocked: readonly BlockedMetric[];
  strings: AnalyticsMessages;
  locale: Locale;
}) {
  if (!blocked.length) return null;

  const summary = blocked.length === 1
    ? strings.unavailable.summaryOne
    : fill(strings.unavailable.summary, { count: blocked.length });

  return (
    <Card as="section">
      <CardBody>
        <details>
          <summary className={styles.summary}>
            <Text as="span" role="bodyStrong">{summary}</Text>
          </summary>
          <Text tone="muted">{strings.unavailable.body}</Text>
          <ul className={styles.list}>
            {blocked.map(metric => (
              <li className={styles.row} key={metric.key}>
                <Text as="span" role="label">{metric.title}</Text>
                <StatusPill tone="neutral" ping={false}>{blockedLabel(metric.status, locale)}</StatusPill>
              </li>
            ))}
          </ul>
        </details>
      </CardBody>
    </Card>
  );
}
