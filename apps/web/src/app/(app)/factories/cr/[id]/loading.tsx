import { useT } from "@/lib/i18n";
import styles from "./factory360.module.css";

export default async function LoadingFactory360() {
  const { t } = await useT();
  return (
    <section aria-busy="true" aria-label={t("f360.loading", "Loading Factory 360 profile")}>
      <p className="sq-caption" role="status">{t("f360.loading", "Loading Factory 360 profile")} — {t("f360.loading.detail", "retrieving the selected registration, license and source metadata.")}</p>
      <div className={styles.loadingWorkspace} aria-hidden="true">
        <div className={`sq-surface ${styles.panel} ${styles.loadingPanel}`}><span className="sq-skeleton" /></div>
        <div className={`sq-surface ${styles.panel} ${styles.loadingPanel}`}><span className="sq-skeleton" /><span className="sq-skeleton" /><span className="sq-skeleton" /></div>
        <div className={`sq-surface ${styles.panel} ${styles.loadingPanel}`}><span className="sq-skeleton" /><span className="sq-skeleton" /></div>
      </div>
    </section>
  );
}
