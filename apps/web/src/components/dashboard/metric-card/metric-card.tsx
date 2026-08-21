import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import { Card, CardBody, CardFooter, CardHeader, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./metric-card.module.css";
import { Text } from "@/components/saqeel/type";

export type MetricCardModel = {
  readonly question: string;
  readonly title: string;
  readonly value: string | null;
  readonly valueKind?: "number" | "text";
  readonly emptyLabel: string;
  readonly emptyTone?: StatusTone;
  readonly emptyMuted?: boolean;
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

export default function MetricCard({ model, strings }: {
  model: MetricCardModel;
  strings: MetricCardStrings;
}) {
  const blocked = model.value === null;
  return (
    <Card>
      <CardHeader title={model.title} description={model.question} />
      <CardBody gap="tight">
        <CardValueSlot>
          {blocked
            ? model.emptyMuted
              ? <Text as="span" tone="muted">{model.emptyLabel}</Text>
              : <StatusPill tone={model.emptyTone ?? "warning"} ping>{model.emptyLabel}</StatusPill>
            : <CardValue kind={model.valueKind ?? "number"}>{model.value}</CardValue>}
        </CardValueSlot>
        <details className={styles.disclosure}>
          <summary className={styles.summary}>
            <Icon name="disclosure" size="sm" />
            <Text as="span" role="label" tone="inherit">
              {blocked ? strings.why : strings.methodology}
            </Text>
          </summary>
          <div className={styles.detail}>
            <Text tone="secondary">
              <Text as="strong" role="bodyStrong" tone="primary">{strings.definition}</Text>
              {" "}
              {model.definition}
            </Text>
            {model.example ? <Text tone="muted" numeric>{model.example}</Text> : null}
            {model.interpretation ? <Text tone="secondary">{model.interpretation}</Text> : null}
          </div>
        </details>
      </CardBody>
      {blocked ? null : (
        <CardFooter>
          <Button variant="secondary" size="sm" href={model.href} label={model.action}>
            {model.action}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
