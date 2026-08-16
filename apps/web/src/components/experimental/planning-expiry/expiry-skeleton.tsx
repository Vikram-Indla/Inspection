import { Card, linearTheme } from "@/components/experimental/linear";
import { getMessages } from "@/i18n/messages";
import { RULE_TYPES } from "@/app/(app)/admin/planning/expiry/types";
import type { Locale } from "@/lib/i18n";
import screen from "./expiry-screen.module.css";
import styles from "./expiry-skeleton.module.css";

const ROWS_PER_SECTION = [3, 2, 2, 3] as const;

export default function ExpirySkeleton({ locale }: { locale: Locale }) {
  const copy = getMessages(locale).adminPlanningExpiry;

  return (
    <div className={linearTheme.root}>
      <div className={screen.page} role="status" aria-busy="true" aria-label={copy.loading}>
        <div className={screen.band}>
          <div className={screen.header}>
            <div className={`${styles.bone} ${styles.title}`} />
            <div className={`${styles.bone} ${styles.subtitle}`} />
          </div>
          <div className={`${styles.bone} ${styles.notice}`} />
        </div>

        <div className={screen.sections}>
          {RULE_TYPES.map((ruleType, index) => (
            <Card as="section" key={ruleType}>
              <div className={styles.card}>
                <div className={`${styles.bone} ${styles.sectionHeading}`} />
                <div className={styles.rows}>
                  <div className={`${styles.bone} ${styles.headerRow}`} />
                  {Array.from({ length: ROWS_PER_SECTION[index] ?? 2 }, (_, row) => (
                    <div className={`${styles.bone} ${styles.row}`} key={row} />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
