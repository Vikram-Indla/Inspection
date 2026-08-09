import { type ReactNode } from "react";
import styles from "./planning-assistant.module.css";

export default function PlanningAssistant({ insights, recommendations, quickActions, label }: {
  insights: ReactNode;
  recommendations: ReactNode;
  quickActions: ReactNode;
  label: string;
}) {
  return (
    <section className={styles.root} aria-label={label}>
      <div className={styles.column}>{insights}</div>
      <div className={styles.column}>{recommendations}</div>
      <div className={styles.column}>{quickActions}</div>
    </section>
  );
}
