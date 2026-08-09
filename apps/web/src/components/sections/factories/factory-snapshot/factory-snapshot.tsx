import { Card, CardBody } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-snapshot.module.css";

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
            <p className={styles.conditionLabel} id="factory-snapshot-title">{strings.overallCondition}</p>
            <StatusPill tone={condition.tone}>{condition.label}</StatusPill>
            {reasons.length === 0
              ? <p className={styles.reason}>{strings.noReasons}</p>
              : (
                <ul className={styles.reasons}>
                  {reasons.map(reason => <li key={reason}>{reason}</li>)}
                </ul>
              )}
          </div>

          <dl className={styles.metrics} aria-label={strings.title}>
            {metrics.map(metric => (
              <div className={styles.metric} key={metric.key}>
                <dt className={styles.metricLabel}>{metric.label}</dt>
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
