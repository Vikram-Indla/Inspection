import styles from "./count-badge.module.css";

export type CountBadgeTone = "neutral" | "accent" | "danger";

// A count riding alongside a label — export row counts, tab counts, list
// totals. Rounded square rather than a pill: a pill reads as a status, and a
// count is not one. IRP renders these as its default soft Label, which is the
// same treatment.
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
