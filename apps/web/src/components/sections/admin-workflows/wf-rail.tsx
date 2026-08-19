import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { WfState, WfValidation } from "@/lib/workflow/validate";
import styles from "./workflows.module.css";

function stateTone(state: WfState): StatusTone {
  if (state.terminal) return "success";
  if (state.initial) return "accent";
  return "neutral";
}

export default function WfRail({ states, validation, strings }: {
  states: readonly WfState[];
  validation: WfValidation;
  strings: AdminWorkflowsMessages;
}) {
  return (
    <div className={styles.rail}>
      <Card as="section">
        <CardHeader level="h3" title={strings.deck.states} />
        <CardBody gap="tight">
          {states.map(state => (
            <div key={state.key} className={styles.stateRow}>
              <StatusPill tone={stateTone(state)}>{state.key}</StatusPill>
              <span className={styles.grow} />
              {state.initial ? <Text role="label" tone="muted">{strings.deck.initial}</Text> : null}
              {state.terminal ? <Text role="label" tone="muted">{strings.deck.terminal}</Text> : null}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader
          level="h3"
          title={strings.deck.validation}
          trailing={<StatusPill tone={validation.ok ? "success" : "danger"}>{validation.ok ? strings.deck.passed : strings.deck.failed}</StatusPill>}
        />
        <CardBody gap="tight">
          {validation.checks.map(check => (
            <div key={check.id} className={styles.validationRow}>
              <Text as="span" tone={check.ok ? "success" : "danger"}>
                <Icon name={check.ok ? "selected" : "dismiss"} size="sm" />
              </Text>
              <Text role="label"><Mono>{check.id}</Mono> {check.why}</Text>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
