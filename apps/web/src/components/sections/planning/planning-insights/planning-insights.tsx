import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import styles from "./planning-insights.module.css";

export type PlanningInsightFact = {
  readonly key: string;
  readonly label: string;
  readonly count: number | null;
};

export default function PlanningInsights({ headline, facts, strings, advisory }: {
  headline: string;
  facts: readonly PlanningInsightFact[];
  strings: { readonly title: string; readonly factsLabel: string; readonly unavailable: string };
  advisory: ReactNode;
}) {
  return (
    <Card as="section" labelledBy="planning-insights-heading">
      <CardHeader
        level="h2"
        titleId="planning-insights-heading"
        title={strings.title}
        eyebrow={<Icon name="ai" size="sm" label={strings.title} />}
      />
      <CardBody>
        <p className={styles.headline}>{headline}</p>
        <ul className={styles.facts} aria-label={strings.factsLabel}>
          {facts.map(fact => (
            <li key={fact.key} className={styles.fact}>
              <span className={styles.count}>{fact.count === null ? strings.unavailable : fact.count}</span>
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>
        {advisory}
      </CardBody>
    </Card>
  );
}
