import styles from "./live.module.css";

export default function Loading() {
  return (
    <div className={styles.page} role="status" aria-busy="true" aria-label="Loading live operations">
      <div className={styles.header}>
        <strong className={styles.disclosure}>Projected route — not live GPS</strong>
        <span className={styles.skeletonLine} />
      </div>
      <div className={styles.counters}>
        {Array.from({ length: 3 }, (_, index) => <span className={styles.skeletonCounter} key={index} />)}
      </div>
      <div className={styles.workspace}>
        <span className={styles.skeletonMap} />
        <span className={styles.skeletonList} />
      </div>
    </div>
  );
}
