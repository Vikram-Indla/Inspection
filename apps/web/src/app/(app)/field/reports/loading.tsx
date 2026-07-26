import styles from "./reports.module.css";

export default function FieldReportsLoading() {
  return (
    <main className={styles.wrap} aria-busy="true" aria-live="polite">
      <div className={styles.loading}>
        <span className={styles.loadingLine} />
        <span className={styles.loadingLine} />
        <span className={styles.loadingLine} />
      </div>
    </main>
  );
}
