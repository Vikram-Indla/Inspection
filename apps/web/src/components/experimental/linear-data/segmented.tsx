import Link from "next/link";
import styles from "./segmented.module.css";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  href: string;
};

export function Segmented<T extends string>({ label, options, current }: {
  label: string;
  options: readonly SegmentedOption<T>[];
  current: T;
}) {
  return (
    <nav className={styles.group} aria-label={label}>
      {options.map(option => (
        <Link
          key={option.value}
          className={option.value === current ? `${styles.item} ${styles.selected}` : styles.item}
          href={option.href}
          aria-current={option.value === current ? "page" : undefined}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
