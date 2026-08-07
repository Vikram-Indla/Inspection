import Link from "next/link";
import { type ReactNode } from "react";
import styles from "./list-row.module.css";

// One row grammar for every stacked list in the app. Before this, four
// components each declared their own `.row` with different padding, height
// and hover treatment, so two lists sitting in the same column never lined
// up. `bleed` is the only thing that legitimately differs: a list that owns
// the full width of a card body pulls its hover fill out to the card edge,
// a list nested inside a column keeps a smaller inset.
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

export function ListRow({ leading, title, description, meta, trailing, href }: {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}) {
  return (
    <div className={styles.row} role="listitem">
      {leading ? <span className={styles.leading}>{leading}</span> : null}
      <span className={styles.body}>
        {/* dir="auto" on record-derived text: factory and inspector names
            arrive in either script and must not inherit the page direction. */}
        <span className={styles.title} dir="auto">
          {href
            ? <Link className={styles.link} href={href} prefetch={false}>{title}</Link>
            : title}
        </span>
        {description ? <span className={styles.description} dir="auto">{description}</span> : null}
      </span>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </div>
  );
}
