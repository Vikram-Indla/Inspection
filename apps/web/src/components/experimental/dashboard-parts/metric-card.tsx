import { Badge, Button, Text } from "@/components/experimental/linear";
import { MetricValue } from "@/components/experimental/linear-data";
import type { MetricDisplay, MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import { MethodologyDisclosure } from "./methodology";
import styles from "./parts.module.css";

export type MetricCardModel = {
  readonly question: string;
  readonly title: string;
  readonly value: string | null;
  readonly valueKind?: "number" | "text";
  readonly emptyLabel: string;
  readonly definition: string;
  readonly example?: string;
  readonly interpretation?: string;
  readonly href: string;
  readonly action: string;
};

export type MetricCardStrings = {
  readonly methodology: string;
  readonly why: string;
  readonly definition: string;
};

export function MetricGrid({ tight = false, children }: { tight?: boolean; children: React.ReactNode }) {
  return <div className={tight ? `${styles.grid} ${styles.gridTight}` : styles.grid}>{children}</div>;
}

export function MetricCard({ model, strings }: {
  model: MetricCardModel;
  strings: MetricCardStrings;
}) {
  const blocked = model.value === null;

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHead}>
        <Text role="caption" tone="strong" weight="medium" as="span">{model.title}</Text>
        <Text role="caption" tone="muted" as="span">{model.question}</Text>
      </div>

      {blocked
        ? <Badge label={model.emptyLabel} />
        : <MetricValue kind={model.valueKind ?? "number"}>{model.value}</MetricValue>}

      <details className={styles.disclosure}>
        <summary className={styles.summary}>
          <Text role="caption" tone="muted" as="span">{blocked ? strings.why : strings.methodology}</Text>
        </summary>
        <div className={styles.detail}>
          <Text role="caption"><Text as="span" role="caption" tone="strong" weight="medium">{strings.definition}</Text>{` ${model.definition}`}</Text>
          {model.example ? <Text role="caption" tone="muted" numeric>{model.example}</Text> : null}
          {model.interpretation ? <Text role="caption" tone="muted">{model.interpretation}</Text> : null}
        </div>
      </details>

      {blocked ? null : (
        <div>
          <Button variant="quiet" href={model.href} label={model.action}>{model.action}</Button>
        </div>
      )}
    </div>
  );
}

export function MetricTile({ metric, entry, strings }: {
  metric: MetricDisplay;
  entry: MethodologyEntry | undefined;
  strings: { readonly methodology: string; readonly why: string };
}) {
  const label = metric.kind === "status" ? strings.why : strings.methodology;

  return (
    <article className={styles.metricCard}>
      <Text role="caption" tone="muted" as="span">{metric.title}</Text>
      {metric.kind === "status"
        ? <Badge label={metric.text} />
        : <MetricValue>{metric.text}</MetricValue>}
      {metric.sub ? <Text role="caption" tone="muted" as="span">{metric.sub}</Text> : null}
      <MethodologyDisclosure entry={entry} label={label} />
    </article>
  );
}
