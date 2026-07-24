import Shell from "@/components/Shell";
import { useT } from "@/lib/i18n";
import styles from "./operations.module.css";

// SCR-WEB-500 — loading state (web.md: every screen needs loading/empty/error states)
export default async function Loading() {
  const { t } = await useT();
  return (
    <Shell current="/operations" title={t("ops.title", "Operations Center")}>
      <div className={styles.page} role="status" aria-label={t("ops.loading.title", "Loading Operations Center…")} aria-busy="true">
        <div className={styles.viewSwitch} aria-hidden="true">
          <span className={styles.viewLink}>{t("ops.views.map", "Operations Map")}</span>
          <span className={styles.viewLink}>{t("ops.views.performance", "National Performance")}</span>
        </div>
        <div className={styles.loadingGrid} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => <div className={styles.skeleton} key={index} />)}
        </div>
        <div className={styles.loadingPanel} aria-hidden="true" />
        <span className="sq-caption">{t("ops.loading.desc", "Fetching visits, geo events, corrective actions and notifications through RLS.")}</span>
      </div>
    </Shell>
  );
}
