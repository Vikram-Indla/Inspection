import Button from "@/components/saqeel/button/button";
import styles from "./factory-actions.module.css";
import { Text } from "@/components/saqeel/type";

export type FactoryActionsStrings = {
  readonly planSingle: string;
  readonly startPlan: string;
  readonly supervisionNote: string;
};

export default function FactoryActions({ planSingleHref, immediateHref, strings }: {
  planSingleHref: string;
  immediateHref: string;
  strings: FactoryActionsStrings;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        <Button variant="secondary" href={planSingleHref} label={strings.planSingle}>{strings.planSingle}</Button>
        <Button variant="secondary" href={immediateHref} label={strings.startPlan}>{strings.startPlan}</Button>
      </div>
      <Text tone="muted" live="status">{strings.supervisionNote}</Text>
    </div>
  );
}
