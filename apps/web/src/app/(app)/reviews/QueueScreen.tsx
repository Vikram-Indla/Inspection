import { useT } from "@/lib/i18n";
import { buildQueueRows, buildRiskOptions, buildStatusOptions } from "@/features/reviews/queue-rows";
import { buildQueueStrings } from "@/features/reviews/strings";
import type { LoadedQueue } from "@/features/reviews/types";
import { ReviewQueue } from "./ReviewQueue";
import styles from "./responsive.module.css";

export async function QueueScreen({ loaded }: { loaded: LoadedQueue }) {
  const { t, locale } = await useT();
  const rows = buildQueueRows(loaded, t, locale);
  return (
    <div className={styles.reviewRoot} data-screen-id="REV-S01" data-saqeel-screen="SCR-WEB-300">
      <h1 className={styles.semanticTitle}>{t("review.list.title", "Inspection review queue")}</h1>
      <div className="sq-banner" role="note"><div><strong>{t("review.list.scanTitle", "Review overview")}</strong> — {t("review.list.scanBody", "Opening only lets you look. Starting and deciding are separate actions, and we record both.")}</div></div>
      {loaded.reviewDays == null && <div className="sq-banner sq-banner--warning" role="note"><div><strong>{t("review.list.missingSlaTitle", "Deadline settings missing")}</strong> — {t("review.list.missingSlaBody", "No review deadline is configured. Rows show as unavailable instead of on time.")}</div></div>}
      {loaded.degraded && <div className="sq-banner sq-banner--warning" role="alert"><div><strong>{t("review.list.degradedTitle", "Some linked information is not available")}</strong> — {t("review.list.degradedBody", "The queue loaded, but one or more linked sources could not be read. Those details show as unavailable.")}</div></div>}
      {rows.length === 0 ? (
        <section className="sq-surface cd-panelpad cd-result" role="status">
          <div className="cd-result__row">
            <div className="cd-result__icon cd-result__icon--ok" aria-hidden="true">✓</div>
            <div className="cd-stack">
              <h2>{t("review.list.empty", "No inspections waiting for review")}</h2>
              <p>{t("review.list.emptyBody", "No reviews in your scope are waiting for a decision.")}</p>
            </div>
          </div>
        </section>
      ) : (
        <ReviewQueue rows={rows} statusOptions={buildStatusOptions(t)} riskOptions={buildRiskOptions(loaded, t)} strings={buildQueueStrings(t)} />
      )}
      <div className="sq-banner sq-banner--warning" role="note"><div><strong>{t("review.list.submissionBlockTitle", "New submissions unavailable")}</strong> — {t("review.list.submissionBlockBody", "New inspection submissions cannot be sent right now. Existing review records in your scope are still available.")}</div></div>
      <div className="sq-banner sq-banner--immutable"><div><strong>{t("review.list.immutableTitle", "Decisions cannot be changed")}</strong> {t("review.list.immutableBody", "— decided reviews cannot be edited. Each resubmission creates a new, saved version.")}</div></div>
    </div>
  );
}
