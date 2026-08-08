import { Card, CardBody, CardHeader, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-risk.module.css";

export type FactoryRiskDriver = {
  readonly key: string;
  readonly text: string;
};

export default function FactoryRisk({ heading, score, band, noScoreLabel, facts, description, drivers, driversUnavailable }: {
  heading: string;
  score: string;
  band: { readonly label: string; readonly tone: StatusTone } | null;
  noScoreLabel: string;
  facts: readonly Definition[];
  description: string;
  drivers: readonly FactoryRiskDriver[];
  driversUnavailable: string;
}) {
  return (
    <Card as="section" labelledBy="factory-risk-title">
      <CardHeader
        level="h2"
        titleId="factory-risk-title"
        title={heading}
        trailing={band
          ? <StatusPill tone={band.tone}>{band.label}</StatusPill>
          : <StatusPill tone="neutral">{noScoreLabel}</StatusPill>}
      />
      <CardBody gap="tight">
        <CardValueSlot><CardValue kind="number">{score}</CardValue></CardValueSlot>
        <DefinitionList items={facts} />
        <p className={styles.description}>{description}</p>
        {drivers.length
          ? <ul className={styles.drivers}>{drivers.map(driver => <li key={driver.key}>{driver.text}</li>)}</ul>
          : <p className={styles.description}>{driversUnavailable}</p>}
      </CardBody>
    </Card>
  );
}
