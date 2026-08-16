import type { ReactNode } from "react";
import styles from "./surface.module.css";

export type LinearNoticeTone = "neutral" | "accent" | "danger";

const noticeToneClass = {
  neutral: "",
  accent: styles.noticeAccent,
  danger: styles.noticeDanger,
} as const;

export function Card({ as = "div", flush = false, labelledBy, children }: {
  as?: "div" | "section" | "article";
  flush?: boolean;
  labelledBy?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag className={flush ? `${styles.card} ${styles.flush}` : styles.card} aria-labelledby={labelledBy}>
      {children}
    </Tag>
  );
}

export function Notice({ tone = "neutral", live, children }: {
  tone?: LinearNoticeTone;
  live?: "status" | "alert";
  children: ReactNode;
}) {
  return (
    <div className={`${styles.notice} ${noticeToneClass[tone]}`} role={live}>
      {children}
    </div>
  );
}

export function Divider() {
  return <hr className={styles.divider} />;
}
