import { type ReactNode } from "react";
import PingDot, { type PingDotTone } from "@/components/saqeel/ping-dot/ping-dot";
import styles from "./status-pill.module.css";

export type StatusTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending";

const PING_TONE: Readonly<Record<StatusTone, PingDotTone>> = {
  neutral: "neutral",
  pending: "neutral",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

export default function StatusPill({ children, tone = "neutral", ping = true, title }: {
  children: ReactNode;
  tone?: StatusTone;
  ping?: boolean;
  title?: string;
}) {
  return (
    <span className={styles.pill} data-tone={tone} data-ping={ping ? "" : undefined} title={title}>
      {ping ? <PingDot tone={PING_TONE[tone]} size="sm" /> : null}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
