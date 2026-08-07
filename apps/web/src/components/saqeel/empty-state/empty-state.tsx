import { type ReactNode } from "react";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./empty-state.module.css";

export default function EmptyState({ icon, title, description, action, size = "md" }: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <div className={styles.root} data-size={size} role="status">
      {icon ? (
        <span className={styles.badge} aria-hidden="true">
          <Icon name={icon} size="md" />
        </span>
      ) : null}
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
