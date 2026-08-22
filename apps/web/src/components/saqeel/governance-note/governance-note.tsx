import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import styles from "./governance-note.module.css";

export default function GovernanceNote({ label, lines }: {
  label: string;
  lines: readonly string[];
}) {
  if (!lines.length) return null;
  return (
    <details className={styles.root}>
      <summary className={styles.trigger} aria-label={label}>
        <Icon name="info" size="sm" />
      </summary>
      <div className={styles.note}>
        <ul className={styles.list}>
          {lines.map(line => (
            <li key={line}><Text tone="secondary" as="span" dir="auto">{line}</Text></li>
          ))}
        </ul>
      </div>
    </details>
  );
}
