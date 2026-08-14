import Link from "next/link";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import { Text } from "@/components/saqeel/type";
import styles from "./review-tabs.module.css";

export type ReviewTab = { key: string; label: string; count: number };

/**
 * Query state, not component state (WEB-004 §1, design authority §8: "Tabs and
 * filters are query state, never subroutes").
 *
 * These were a `useState` index, so a reviewer could not link a colleague to the
 * version comparison they were looking at, and a decision that reloaded the page
 * dropped them back to the checklist. Links also make the switcher work before
 * hydration.
 */
export default function ReviewTabs({ tabs, active, basePath }: {
  tabs: readonly ReviewTab[];
  active: string;
  basePath: string;
}) {
  return (
    <div className={styles.root} role="tablist">
      {tabs.map(tab => (
        <Link
          key={tab.key}
          className={styles.tab}
          role="tab"
          aria-selected={tab.key === active}
          href={tab.key === tabs[0]?.key ? basePath : `${basePath}?tab=${tab.key}`}
          scroll={false}
          prefetch={false}
        >
          <Text role="label" tone="inherit" as="span">{tab.label}</Text>
          <CountBadge value={tab.count} tone={tab.key === active ? "accent" : "neutral"} superscript />
        </Link>
      ))}
    </div>
  );
}
