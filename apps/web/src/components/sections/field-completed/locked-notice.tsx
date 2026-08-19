import Icon from "@/components/saqeel/icon/icon";
import { Text } from "@/components/saqeel/type";
import styles from "./completed.module.css";

export default function LockedNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.locked} role="status">
      <Icon name="restricted" size="sm" />
      <Text role="label" tone="success" as="span">{children}</Text>
    </div>
  );
}
