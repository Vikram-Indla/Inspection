import { Text } from "@/components/saqeel/type";
import styles from "./audit.module.css";

export function AuditCode({ value }: { value: unknown }) {
  const json = value == null ? "—" : JSON.stringify(value, null, 2);
  return (
    <div className={styles.code}>
      <Text as="code" role="mono" dir="ltr">{json}</Text>
    </div>
  );
}
