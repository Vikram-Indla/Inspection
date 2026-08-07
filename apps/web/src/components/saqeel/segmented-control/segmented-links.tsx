import Link from "next/link";
import { type CSSProperties } from "react";
import styles from "./segmented-control.module.css";

export type SegmentedLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly lang?: string;
};

type TrackStyle = CSSProperties &
  Record<"--sqx-segment-count" | "--sqx-segment-index", string>;

export default function SegmentedLinks({ items, current, label, size = "md", tone = "subtle" }: {
  items: readonly SegmentedLink[];
  current: string;
  label: string;
  size?: "sm" | "md";
  tone?: "subtle" | "accent";
}) {
  const activeIndex = Math.max(items.findIndex(item => item.id === current), 0);
  const style: TrackStyle = {
    "--sqx-segment-count": String(items.length),
    "--sqx-segment-index": String(activeIndex),
  };

  return (
    <nav className={styles.root} aria-label={label} data-size={size} data-tone={tone} style={style}>
      <span className={styles.pill} aria-hidden="true" />
      {items.map(item => (
        <Link
          className={styles.segment}
          key={item.id}
          href={item.href}
          lang={item.lang}
          prefetch={false}
          aria-current={item.id === current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
