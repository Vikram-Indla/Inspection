import styles from "./count-badge.module.css";

export type CountBadgeTone = "neutral" | "accent" | "danger";

export default function CountBadge({ value, tone = "neutral", label }: {
  value: number | string;
  tone?: CountBadgeTone;
  label?: string;
}) {
  return (
    <span className={styles.root} data-tone={tone} aria-label={label}>
      {value}
    </span>
  );
}
