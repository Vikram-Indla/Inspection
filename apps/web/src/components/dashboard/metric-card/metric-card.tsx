import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import { Card, CardBody, CardFooter, CardHeader, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./metric-card.module.css";

export type MetricCardModel = {
  readonly question: string;
  readonly title: string;
  readonly value: string | null;
  readonly valueKind?: "number" | "text";
  readonly emptyLabel: string;
  readonly emptyTone?: StatusTone;
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
      <CardHeader eyebrow={model.question} title={model.title} />
      <CardBody gap="tight">
        <CardValueSlot>
          {blocked
            ? <StatusPill tone={model.emptyTone ?? "warning"} ping>{model.emptyLabel}</StatusPill>
            : <CardValue kind={model.valueKind ?? "number"}>{model.value}</CardValue>}
        </CardValueSlot>
        <details className={styles.disclosure}>
          <summary className={styles.summary}>
            <Icon name="disclosure" size="sm" />
            <span>{blocked ? strings.why : strings.methodology}</span>
          </summary>
          <div className={styles.detail}>
            <p className={styles.definition}>
              <b className={styles.definitionLabel}>{strings.definition}</b> {model.definition}
            </p>
            {model.example ? <p className={styles.example}>{model.example}</p> : null}
            {model.interpretation ? <p className={styles.interpretation}>{model.interpretation}</p> : null}
          </div>
        </details>
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="sm" href={model.href} label={model.action}>
          {model.action}
        </Button>
      </CardFooter>
    </Card>
  );
}
