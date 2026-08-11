import { Card, CardBody, CardHeader, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { FactoryRiskDriver } from "@/components/sections/factories/factory-risk/factory-risk";
import styles from "./factory-risk-outlook.module.css";
import { Text } from "@/components/saqeel/type";

export type FactoryRiskOutlookStrings = {
  readonly title: string;
  readonly predictedRisk: string;
  readonly predictedUnavailable: string;
  readonly whyHighRisk: string;
  readonly driversUnavailable: string;
  readonly modelVersion: string;
  readonly latestChange: string;
  readonly nextBestAction: string;
  readonly nextBestActionBody: string;
  readonly nextBestActionLink: string;
};

export default function FactoryRiskOutlook({
  score,
  band,
  noScoreLabel,
  modelVersion,
  drivers,
  latestChange,
  actionHref,
  strings,
}: {
  score: string;
  band: { readonly label: string; readonly tone: StatusTone } | null;
  noScoreLabel: string;
  modelVersion: string;
  drivers: readonly FactoryRiskDriver[];
  latestChange: string;
  actionHref: string;
  strings: FactoryRiskOutlookStrings;
}) {
  return (
    <Card as="section" labelledBy="factory-outlook-title">
      <CardHeader
        level="h2"
        titleId="factory-outlook-title"
        title={strings.title}
        trailing={band
          ? <StatusPill tone={band.tone}>{band.label}</StatusPill>
          : <StatusPill tone="neutral">{noScoreLabel}</StatusPill>}
      />
      <CardBody gap="tight">
        <Text role="label" tone="muted">{strings.predictedRisk}</Text>
        <Text tone="secondary">{strings.predictedUnavailable}</Text>

        <Text role="label" tone="muted">{strings.whyHighRisk}</Text>
        <CardValueSlot><CardValue kind="number">{score}</CardValue></CardValueSlot>
        {drivers.length === 0
          ? <Text tone="secondary">{strings.driversUnavailable}</Text>
          : (
            <ul className={styles.drivers}>
              {drivers.map(driver => (
                <Text as="li" tone="secondary" numeric key={driver.key}>{driver.text}</Text>
              ))}
            </ul>
          )}
        <Text tone="muted">{strings.modelVersion}: {modelVersion}</Text>
        <Text tone="muted">{strings.latestChange}: {latestChange}</Text>

        <Text role="label" tone="muted">{strings.nextBestAction}</Text>
        <Text tone="secondary">{strings.nextBestActionBody}</Text>
        <Button variant="secondary" size="sm" href={actionHref}>{strings.nextBestActionLink}</Button>
      </CardBody>
    </Card>
  );
}
