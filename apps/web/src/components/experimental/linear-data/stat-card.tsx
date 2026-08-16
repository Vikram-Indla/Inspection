import type { ReactNode } from "react";
import Link from "next/link";
import { Text } from "@/components/experimental/linear";
import styles from "./stat-card.module.css";

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function MetricValue({ kind = "number", muted = false, children }: {
  kind?: "number" | "text";
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.value} ${kind === "text" ? styles.valueText : ""} ${muted ? styles.empty : ""}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, emptyLabel, note, href, valueKind = "number", footer }: {
  label: string;
  value: string | null;
  emptyLabel: string;
  note?: string;
  href?: string;
  valueKind?: "number" | "text";
  footer?: ReactNode;
}) {
  const body = (
    <>
      <Text role="caption" tone="muted" as="span">{label}</Text>
      <span className={`${styles.value} ${valueKind === "text" ? styles.valueText : ""} ${value === null ? styles.empty : ""}`}>
        {value ?? emptyLabel}
      </span>
      {note ? <Text role="caption" tone="muted" as="span">{note}</Text> : null}
    </>
  );

  return (
    <div className={styles.card}>
      {href ? <Link className={styles.link} href={href}>{body}</Link> : body}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
