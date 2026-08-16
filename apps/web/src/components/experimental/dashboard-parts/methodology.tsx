import { Button, Text } from "@/components/experimental/linear";
import type { MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import styles from "./parts.module.css";

export function MethodologyDisclosure({ entry, label }: {
  entry: MethodologyEntry | undefined;
  label: string;
}) {
  if (!entry) return null;

  return (
    <details className={styles.disclosure}>
      <summary className={styles.summary}>
        <Text role="caption" tone="muted" as="span">{label}</Text>
      </summary>
      <div className={styles.detail}>
        {entry.blockedNote ? <Text role="caption" tone="strong">{entry.blockedNote}</Text> : null}
        {entry.rows.map(row => (
          <div className={styles.detailRow} key={row.label}>
            <Text role="caption" tone="muted" as="span">{row.label}</Text>
            <Text role="caption" as="span">{row.value}</Text>
          </div>
        ))}
        {entry.drillRoute ? (
          <div>
            <Button variant="quiet" href={entry.drillRoute}>{entry.drillLabel}</Button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
