import Icon from "@/components/saqeel/icon/icon";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import styles from "./planning-assistant.module.css";

export type PlanningAssistantStrings = {
  aria: string;
  insightsTitle: string;
  insightsEmptyTitle: string;
  insightsEmptyBody: string;
  recommendationsTitle: string;
  recommendationsEmptyTitle: string;
  recommendationsEmptyBody: string;
  quickTitle: string;
  quick: {
    planBulk: string;
    planSingle: string;
    planImmediate: string;
    reviewReturned: string;
    reviewDrafts: string;
    visitManagement: string;
  };
};

export type QuickActionCounts = {
  returned: number | null;
  draft: number | null;
};

export default function PlanningAssistant({ strings, counts, canCreate }: {
  strings: PlanningAssistantStrings;
  counts: QuickActionCounts;
  canCreate: boolean;
}) {
  const quick = [
    ...(canCreate ? [
      { href: "/planning/bulk", label: strings.quick.planBulk, count: null },
      { href: "/planning/single", label: strings.quick.planSingle, count: null },
      { href: "/planning/immediate", label: strings.quick.planImmediate, count: null },
    ] : []),
    { href: "/planning?tab=returned", label: strings.quick.reviewReturned, count: counts.returned },
    { href: "/planning?tab=draft", label: strings.quick.reviewDrafts, count: counts.draft },
    { href: "/planning/visits", label: strings.quick.visitManagement, count: null },
  ];
  return (
    <section className={styles.root} aria-label={strings.aria}>
      <div className={styles.column}>
        <h2 className={styles.heading}>
          <Icon name="ai" size="sm" />
          {strings.insightsTitle}
        </h2>
        <EmptyState size="sm" variant="inline" title={strings.insightsEmptyTitle} description={strings.insightsEmptyBody} />
      </div>
      <div className={styles.column}>
        <h2 className={styles.heading}>
          <Icon name="ai" size="sm" />
          {strings.recommendationsTitle}
        </h2>
        <EmptyState size="sm" variant="inline" title={strings.recommendationsEmptyTitle} description={strings.recommendationsEmptyBody} />
      </div>
      <div className={styles.column}>
        <h2 className={styles.heading}>
          <Icon name="ai" size="sm" />
          {strings.quickTitle}
        </h2>
        <div className={styles.quickGrid}>
          {quick.map(action => (
            <a className={styles.quickAction} href={action.href} key={action.href}>
              <span className={styles.quickLabel}>{action.label}</span>
              {action.count !== null ? <CountBadge value={action.count} /> : null}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
