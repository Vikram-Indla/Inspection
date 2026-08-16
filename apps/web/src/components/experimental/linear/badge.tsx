import styles from "./badge.module.css";

export function Badge({ label, live = false }: { label: string; live?: boolean }) {
  return (
    <span className={live ? `${styles.badge} ${styles.live}` : styles.badge}>
      {live ? <span className={styles.dot} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
