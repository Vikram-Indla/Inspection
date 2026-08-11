import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-snapshot.module.css";
import { Text } from "@/components/saqeel/type";

export type FactoryMetric = {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly tone: StatusTone;
  readonly kind?: "number" | "text";
};

export default function FactorySnapshot({ condition, reasons, metrics, strings }: {
  condition: { readonly label: string; readonly tone: StatusTone };
  reasons: readonly string[];
  metrics: readonly FactoryMetric[];
  strings: { readonly title: string; readonly overallCondition: string; readonly noReasons: string };
}) {
  return (
    <Card as="section" labelledBy="factory-snapshot-title">
      <CardBody>
        <div className={styles.root}>
          <div className={styles.condition} data-tone={condition.tone}>
            <Text role="label" tone="muted" id="factory-snapshot-title">{strings.overallCondition}</Text>
            <StatusPill tone={condition.tone}>{condition.label}</StatusPill>
            {reasons.length === 0
              ? <Text tone="secondary">{strings.noReasons}</Text>
              : (
                <ul className={styles.reasons}>
                  {reasons.map(reason => <li key={reason}>{reason}</li>)}
                </ul>
              )}
          </div>

          <dl className={styles.metrics} aria-label={strings.title}>
            {metrics.map(metric => (
              <div className={styles.metric} key={metric.key}>
                <Text as="dt" role="label" tone="muted">{metric.label}</Text>
                <dd
                  className={styles.metricValue}
                  data-tone={metric.tone}
                  data-kind={metric.kind ?? "number"}
                >
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </CardBody>
    </Card>
  );
}
