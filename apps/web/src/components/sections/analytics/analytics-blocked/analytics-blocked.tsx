import { Card, CardBody } from "@/components/saqeel/card/card";
import Donut, { type DonutSlice } from "@/components/saqeel/charts/donut/donut";
import Gauge from "@/components/saqeel/charts/gauge/gauge";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { ANALYTICS_BOTTLENECKS } from "@/features/analytics/bottlenecks";
import { blockedLabel } from "@/features/analytics/strings";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { BlockedMetric } from "@/features/analytics/view";
import { fill } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-blocked.module.css";

const REASON_ORDER = ["not_configured", "decision_required", "unavailable"] as const;
const PERCENT = 100;

export default function AnalyticsBlocked({ blocked, resolved, strings, locale }: {
  blocked: readonly BlockedMetric[];
  resolved: number;
  strings: AnalyticsMessages;
  locale: Locale;
}) {
  const bottlenecks = strings.bottlenecks;
  const total = resolved + blocked.length;
  const percent = total > 0 ? (resolved / total) * PERCENT : 0;
  const display = formatPercent(percent, locale, 1);
  const caption = fill(strings.coverage.caption, { resolved: formatCount(resolved, locale), total: formatCount(total, locale) });

  const slices: DonutSlice[] = REASON_ORDER.flatMap(status => {
    const value = ANALYTICS_BOTTLENECKS.filter(item => item.status === status).length;
    return value ? [{ key: status, label: blockedLabel(status, locale), value, display: formatCount(value, locale) }] : [];
  });
  const summary = slices.map(slice => `${slice.label} ${slice.value}`).join(", ");

  const sources = blocked.length === 1
    ? strings.unavailable.summaryOne
    : fill(strings.unavailable.summary, { count: formatCount(blocked.length, locale) });
  const uniformStatus = blocked.length > 0
    && blocked.every(metric => metric.status === blocked[0].status);

  return (
    <>
      <div className={styles.summary}>
        {total > 0 ? (
          <Card as="section" labelledBy="analytics-coverage">
            <CardBody>
              <figure className={styles.figure}>
                <figcaption id="analytics-coverage">
                  <Text as="span" role="bodyStrong">{strings.coverage.label}</Text>
                </figcaption>
                <Gauge
                  percent={percent}
                  display={display}
                  label={strings.coverage.label}
                  caption={caption}
                  size="lg"
                  ariaLabel={fill(strings.coverage.ariaLabel, { resolved, total, percent: display })}
                />
              </figure>
            </CardBody>
          </Card>
        ) : null}

        {slices.length ? (
          <Card as="section" labelledBy="analytics-reasons">
            <CardBody>
              <figure className={styles.figure}>
                <figcaption id="analytics-reasons">
                  <Text as="span" role="bodyStrong">{strings.coverage.reasons}</Text>
                </figcaption>
                <Donut
                  slices={slices}
                  total={formatCount(ANALYTICS_BOTTLENECKS.length, locale)}
                  size="lg"
                  ariaLabel={fill(strings.coverage.reasonsAriaLabel, { summary })}
                />
              </figure>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Card as="section">
        <CardBody>
          {blocked.length ? (
            <details className={styles.group}>
              <summary className={styles.summaryRow}>
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
            <summary className={styles.summaryRow}>
              <Text as="span" role="bodyStrong">
                {fill(bottlenecks.summary, { count: formatCount(ANALYTICS_BOTTLENECKS.length, locale) })}
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
    </>
  );
}
