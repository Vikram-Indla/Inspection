import Link from "next/link";
import { type ReactNode } from "react";
import styles from "./list-row.module.css";

export function ListRows({ children, label, labelledBy, bleed = true }: {
  children: ReactNode;
  label?: string;
  labelledBy?: string;
  bleed?: boolean;
}) {
  return (
    <div
      className={styles.rows}
      data-bleed={bleed ? "" : undefined}
      role="list"
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
}

export function ListRow({ badge, leading, title, description, meta, trailing, href, pressed, onSelect }: {
  badge?: ReactNode;
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  /**
   * Renders the row as a toggle whose target is the whole row, the same
   * stretched-hit-area contract as `href`. Use for a row that selects rather
   * than navigates; `pressed` carries the current state.
   */
  pressed?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className={styles.row} role="listitem" data-selected={pressed ? "" : undefined}>
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <span className={styles.body}>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        <span className={styles.title} dir="auto">
          {href
            ? <Link className={styles.link} href={href} prefetch={false}>{title}</Link>
            : onSelect
              ? (
                <button className={styles.link} type="button" aria-pressed={pressed} onClick={onSelect}>
                  {title}
                </button>
              )
              : title}
        </span>
        {description ? <span className={styles.description} dir="auto">{description}</span> : null}
      </span>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </div>
  );
}
