import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import styles from "./info-note.module.css";

export default function InfoNote({ label, children }: {
  label: string;
  children: string;
}) {
  return (
    <details className={styles.root}>
      <summary className={styles.trigger} aria-label={label}>
        <Icon name="info" size="sm" />
      </summary>
      <div className={styles.note}>
        <Text tone="secondary" dir="auto">{children}</Text>
      </div>
    </details>
  );
}
