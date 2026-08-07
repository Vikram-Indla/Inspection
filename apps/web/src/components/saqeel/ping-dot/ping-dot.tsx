import styles from "./ping-dot.module.css";

export type PingDotTone =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type PingDotProps = {
  tone?: PingDotTone;
  size?: "sm" | "md";
  pulse?: boolean;
  label?: string;
};

export default function PingDot({
  tone = "accent",
  size = "md",
  pulse = true,
  label,
}: PingDotProps) {
  return (
    <span
      className={styles.root}
      data-tone={tone}
      data-size={size}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pulse ? <span className={styles.wave} /> : null}
      <span className={styles.core} />
    </span>
  );
}
