import type { ReactNode } from "react";
import { Heading, Text, type LinearHeadingLevel } from "./text";
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

export function CardHeader({ level, titleId, title, description, actions }: {
  level: LinearHeadingLevel;
  titleId: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <Heading level={level} role="bodyLg" id={titleId}>{title}</Heading>
        {actions}
      </div>
      {description ? <Text role="caption" tone="muted">{description}</Text> : null}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

export function Divider() {
  return <hr className={styles.divider} />;
}
