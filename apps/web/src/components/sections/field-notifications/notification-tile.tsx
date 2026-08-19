import Icon from "@/components/saqeel/icon/icon";
import type { NotificationVisual } from "@/features/field-notifications/meta";
import styles from "./notifications.module.css";

export default function NotificationTile({ visual, size = "md" }: {
  visual: NotificationVisual;
  size?: "md" | "lg";
}) {
  return (
    <span className={styles.tile} data-tone={visual.tone} data-size={size} aria-hidden="true">
      <Icon name={visual.icon} size={size === "lg" ? "md" : "sm"} />
    </span>
  );
}
