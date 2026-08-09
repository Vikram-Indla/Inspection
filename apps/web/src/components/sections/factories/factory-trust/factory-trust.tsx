import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-trust.module.css";

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
        <p className={styles.label}>{strings.lastSynchronisation}</p>
        <p className={styles.body} dir="auto">{lastSynchronised}</p>

        <p className={styles.label}>{strings.dataSources}</p>
        <ul className={styles.sources}>
          {sources.map(source => (
            <li className={styles.source} key={source.key}>
              <span>{source.label}</span>
              <StatusPill tone={source.tone}>{source.state}</StatusPill>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
