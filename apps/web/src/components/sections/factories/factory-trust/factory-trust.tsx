import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-trust.module.css";
import { Text } from "@/components/saqeel/type";

export type FactorySourceState = {
  readonly key: string;
  readonly label: string;
  readonly state: string;
  readonly tone: StatusTone;
};

export default function FactoryTrust({ lastSynchronised, sources, strings }: {
  lastSynchronised: string;
  sources: readonly FactorySourceState[];
  strings: {
    readonly title: string;
    readonly lastSynchronisation: string;
    readonly dataSources: string;
  };
}) {
  return (
    <Card as="section" labelledBy="factory-trust-title">
      <CardHeader level="h2" titleId="factory-trust-title" title={strings.title} />
      <CardBody gap="tight">
        <Text role="label" tone="muted">{strings.lastSynchronisation}</Text>
        <Text tone="secondary" dir="auto">{lastSynchronised}</Text>

        <Text role="label" tone="muted">{strings.dataSources}</Text>
        <ul className={styles.sources}>
          {sources.map(source => (
            <li className={styles.source} key={source.key}>
              <Text role="label" tone="secondary">{source.label}</Text>
              <StatusPill tone={source.tone}>{source.state}</StatusPill>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
