import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { ANALYTICS_BOTTLENECKS } from "@/features/analytics/bottlenecks";
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
  const bottlenecks = strings.bottlenecks;
  const sources = blocked.length === 1
    ? strings.unavailable.summaryOne
    : fill(strings.unavailable.summary, { count: blocked.length });
  const uniformStatus = blocked.length > 0
    && blocked.every(metric => metric.status === blocked[0].status);

  return (
    <Card as="section">
      <CardBody>
        {blocked.length ? (
          <details className={styles.group}>
            <summary className={styles.summary}>
              <Text as="span" role="bodyStrong">
                {uniformStatus ? `${sources} · ${blockedLabel(blocked[0].status, locale)}` : sources}
              </Text>
            </summary>
            <Text tone="muted">{strings.unavailable.body}</Text>
            <ul className={styles.list}>
              {blocked.map(metric => (
                <li className={styles.row} key={metric.key}>
                  <Text as="span" role="label">{metric.title}</Text>
                  {uniformStatus
                    ? <Text as="span" role="label" tone="muted">{metric.trace}</Text>
                    : <StatusPill tone="neutral" ping={false}>{blockedLabel(metric.status, locale)}</StatusPill>}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <details className={styles.group}>
          <summary className={styles.summary}>
            <Text as="span" role="bodyStrong">
              {fill(bottlenecks.summary, { count: ANALYTICS_BOTTLENECKS.length })}
            </Text>
          </summary>
          <Text tone="muted">{bottlenecks.body}</Text>
          <ul className={styles.list}>
            {ANALYTICS_BOTTLENECKS.map(item => (
              <li className={styles.row} key={item.key}>
                <span className={styles.name}>
                  <Text as="span" role="label">{bottlenecks[item.key]}</Text>
                  {item.note ? <Text as="span" role="label" tone="muted">{bottlenecks[item.note]}</Text> : null}
                </span>
                <StatusPill tone="neutral" ping={false}>{blockedLabel(item.status, locale)}</StatusPill>
              </li>
            ))}
          </ul>
        </details>
      </CardBody>
    </Card>
  );
}
