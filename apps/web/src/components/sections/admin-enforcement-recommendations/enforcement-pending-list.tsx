import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { EnforcementRecommendationsMessages } from "@/features/admin-enforcement-recommendations/strings";
import type { PendingRow } from "@/features/admin-enforcement-recommendations/types";
import type { Locale } from "@/lib/i18n";
import EnforcementRecommendationCard from "./enforcement-recommendation-card";
import styles from "./enforcement-recs.module.css";

export default function EnforcementPendingList({ pending, canDecide, strings, locale }: {
  pending: readonly PendingRow[];
  canDecide: boolean;
  strings: EnforcementRecommendationsMessages;
  locale: Locale;
}) {
  if (pending.length === 0) {
    return <EmptyState variant="inline" icon="enforcement" title={strings.empty} />;
  }

  return (
    <div className={styles.cardList}>
      {pending.map(row => (
        <EnforcementRecommendationCard key={row.id} row={row} canDecide={canDecide} strings={strings} locale={locale} />
      ))}
    </div>
  );
}
