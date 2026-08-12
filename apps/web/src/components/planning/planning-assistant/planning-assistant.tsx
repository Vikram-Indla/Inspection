import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
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
      <Heading level={2} tone="inherit">
        <span className={styles.headingInk}>
          <Icon name="ai" size="sm" />
          {strings.stripTitle}
        </span>
      </Heading>
      <span className={styles.status}><Text as="span" tone="secondary">{strings.insightsEmptyTitle}</Text></span>
      <span className={styles.advisory}><Text as="span" tone="muted">{strings.advisory}</Text></span>
    </section>
  );
}
