import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
import styles from "./planning-denied.module.css";

export default function PlanningDenied({ title, body }: { title: string; body: string }) {
  return (
    <section className={styles.root}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="restricted" size="lg" />
      </span>
      <Heading level={1} visual="heading">{title}</Heading>
      <div className={styles.body}><Text tone="secondary">{body}</Text></div>
    </section>
  );
}
