import { Card, CardBody, CardHeader, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-risk.module.css";
import { Text } from "@/components/saqeel/type";

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
        <Text tone="muted">{description}</Text>
        {drivers.length
          ? <ul className={styles.drivers}>{drivers.map(driver => <Text as="li" tone="secondary" key={driver.key}>{driver.text}</Text>)}</ul>
          : <Text tone="muted">{driversUnavailable}</Text>}
      </CardBody>
    </Card>
  );
}
