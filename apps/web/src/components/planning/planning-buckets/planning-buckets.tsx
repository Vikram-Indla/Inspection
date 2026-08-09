import styles from "./planning-buckets.module.css";

export type PlanningBucketStrings = {
  aria: string;
  needsPlanning: string;
  highRisk: string;
  draft: string;
  returned: string;
  published: string;
  expiring: string;
  expired: string;
  aiSuggested: string;
  notConfigured: string;
};

export type PlanningBucketCounts = {
  draft: number | null;
  returned: number | null;
  published: number | null;
  expired: number | null;
};

type Bucket = { key: string; label: string; count: number | null; href: string | null };

export default function PlanningBuckets({ strings, counts, activeTab, hrefFor, empty }: {
  strings: PlanningBucketStrings;
  counts: PlanningBucketCounts;
  activeTab: string;
  hrefFor: (tab: string) => string;
  empty: string;
}) {
  const buckets: Bucket[] = [
    { key: "needsPlanning", label: strings.needsPlanning, count: null, href: null },
    { key: "highRisk", label: strings.highRisk, count: null, href: null },
    { key: "draft", label: strings.draft, count: counts.draft, href: hrefFor("draft") },
    { key: "returned", label: strings.returned, count: counts.returned, href: hrefFor("returned") },
    { key: "published", label: strings.published, count: counts.published, href: hrefFor("published") },
    { key: "expiring", label: strings.expiring, count: null, href: null },
    { key: "expired", label: strings.expired, count: counts.expired, href: hrefFor("expired") },
    { key: "aiSuggested", label: strings.aiSuggested, count: null, href: null },
  ];
  return (
    <nav className={styles.root} aria-label={strings.aria}>
      {buckets.map(bucket => bucket.href ? (
        <a
          className={styles.chip}
          href={activeTab === bucket.key ? hrefFor("") : bucket.href}
          aria-current={activeTab === bucket.key ? "true" : undefined}
          data-active={activeTab === bucket.key ? "" : undefined}
          key={bucket.key}
        >
          <span className={styles.count}>{bucket.count ?? empty}</span>
          <span className={styles.label}>{bucket.label}</span>
        </a>
      ) : (
        <span className={styles.chip} data-muted="" title={strings.notConfigured} key={bucket.key}>
          <span className={styles.count}>{empty}</span>
          <span className={styles.label}>{bucket.label}</span>
        </span>
      ))}
    </nav>
  );
}
