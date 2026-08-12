import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import styles from "./publish-readiness.module.css";

export type ReadinessGate = {
  readonly key: string;
  readonly label: string;
  readonly state: "met" | "unmet" | "optional";
};

export type PublishReadinessStrings = {
  readonly heading: string;
  readonly met: string;
  readonly unmet: string;
  readonly optional: string;
};

/**
 * The publish gates, each as text plus a tone rather than a tick glyph.
 *
 * An unmet gate and an optional one are different facts: an inspector is a
 * suggestion a planner may leave open for the supervisor, so it renders as
 * neutral rather than as a failure the planner has to clear.
 */
export default function PublishReadiness({ gates, strings }: {
  gates: readonly ReadinessGate[];
  strings: PublishReadinessStrings;
}) {
  const toneOf = (state: ReadinessGate["state"]) =>
    state === "met" ? "success" : state === "unmet" ? "danger" : "neutral";
  const statusOf = (state: ReadinessGate["state"]) =>
    state === "met" ? strings.met : state === "unmet" ? strings.unmet : strings.optional;

  return (
    <Card as="section" labelledBy="single-visit-readiness">
      <CardHeader level="h2" titleId="single-visit-readiness" title={strings.heading} />
      <CardBody>
        <ul className={styles.gates}>
          {gates.map(gate => (
            <li className={styles.gate} key={gate.key}>
              <Text as="span" tone="secondary">{gate.label}</Text>
              <StatusPill tone={toneOf(gate.state)}>{statusOf(gate.state)}</StatusPill>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
