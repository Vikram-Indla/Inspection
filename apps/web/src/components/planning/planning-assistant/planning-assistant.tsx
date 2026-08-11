import Icon from "@/components/saqeel/icon/icon";
import styles from "./planning-assistant.module.css";

export type PlanningAssistantStrings = {
  aria: string;
  advisory: string;
  stripTitle: string;
  insightsEmptyTitle: string;
};

export default function PlanningAssistant({ strings }: {
  strings: PlanningAssistantStrings;
}) {
  return (
    <section className={styles.root} aria-label={strings.aria}>
      <h2 className={styles.heading}>
        <Icon name="ai" size="sm" />
        {strings.stripTitle}
      </h2>
      <span className={styles.status}>{strings.insightsEmptyTitle}</span>
      <span className={styles.advisory}>{strings.advisory}</span>
    </section>
  );
}
