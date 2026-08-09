import { useT } from "@/lib/i18n";
import { IconBlocked } from "@/app/icons";
import styles from "./responsive.module.css";

export async function QueueUnauthorized() {
  const { t } = await useT();
  return (
    <div className={styles.reviewRoot} data-screen-id="REV-S01">
      <h1 className={styles.semanticTitle}>{t("review.list.unauthTitle", "You don’t have access to the review queue")}</h1>
      <section className="sq-surface cd-panelpad cd-result" role="alert">
        <div className="cd-result__row">
          <div className="cd-result__icon cd-result__icon--critical" aria-hidden="true"><IconBlocked size={24} /></div>
          <div className="cd-stack">
            <h2>{t("review.list.unauthTitle", "You don’t have access to the review queue")}</h2>
            <p>{t("review.list.unauthBody", "This queue needs an allowed role — Admin, Planner, Supervisor, or assigned Inspector — with matching scope. Being visible in navigation does not mean you have access.")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
