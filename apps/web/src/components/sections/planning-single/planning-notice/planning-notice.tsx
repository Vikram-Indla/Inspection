import { type ReactNode } from "react";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./planning-notice.module.css";

export type NoticeTone = "info" | "warning" | "danger";

/**
 * An inline notice inside the planning form.
 *
 * Tone is carried by the surface **and** by the pill's own text, so the
 * distinction between advisory and blocking survives greyscale and does not
 * depend on colour alone.
 */
export default function PlanningNotice({ tone, label, children }: {
  tone: NoticeTone;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.root} data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
      {label ? <StatusPill tone={tone}>{label}</StatusPill> : null}
      <p className={styles.body}>{children}</p>
    </div>
  );
}
