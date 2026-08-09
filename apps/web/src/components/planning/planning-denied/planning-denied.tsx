import Icon from "@/components/saqeel/icon/icon";
import styles from "./planning-denied.module.css";

export default function PlanningDenied({ title, body }: { title: string; body: string }) {
  return (
    <section className={styles.root}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name="restricted" size="lg" />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.body}>{body}</p>
    </section>
  );
}
