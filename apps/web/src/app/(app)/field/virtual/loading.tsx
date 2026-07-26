import styles from "./virtual.module.css";

export default function FieldVirtualLoading() {
  return (
    <main className={styles.wrap} aria-busy="true" aria-label="Loading remote inspection sessions">
      <div className={styles.loadingCard}>
        <span className={styles.loadingLine} />
        <span className={styles.loadingLineShort} />
      </div>
      <div className={styles.loadingCard}>
        <span className={styles.loadingLine} />
        <span className={styles.loadingLineShort} />
      </div>
    </main>
  );
}
