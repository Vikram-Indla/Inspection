import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
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
};

export default function FactoryRiskOutlook({
  modelVersion,
  drivers,
  latestChange,
  strings,
}: {
  modelVersion: string;
  drivers: readonly FactoryRiskDriver[];
  latestChange: string | null;
  strings: FactoryRiskOutlookStrings;
}) {
  return (
    <Card as="section" labelledBy="factory-outlook-title">
      <CardHeader level="h2" titleId="factory-outlook-title" title={strings.title} />
      <CardBody gap="tight">
        <Text role="label" tone="muted">{strings.predictedRisk}</Text>
        <Text tone="secondary">{strings.predictedUnavailable}</Text>

        <Text role="label" tone="muted">{strings.whyHighRisk}</Text>
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
        {latestChange ? <Text tone="muted">{strings.latestChange}: {latestChange}</Text> : null}

        <Text role="label" tone="muted">{strings.nextBestAction}</Text>
        <Text tone="secondary">{strings.nextBestActionBody}</Text>
      </CardBody>
    </Card>
  );
}
