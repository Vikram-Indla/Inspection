import { CardGrid } from "@/components/saqeel/card/card";
import StatCard from "@/components/saqeel/stat-card/stat-card";

export type PlanningBucketStrings = {
  aria: string;
  draft: string;
  returned: string;
  published: string;
  expired: string;
  notConfigured: string;
  activeNote: string;
};

export type PlanningBucketCounts = {
  draft: number | null;
  returned: number | null;
  published: number | null;
  expired: number | null;
};

export default function PlanningBuckets({ strings, counts, activeTab, hrefFor }: {
  strings: PlanningBucketStrings;
  counts: PlanningBucketCounts;
  activeTab: string;
  hrefFor: (tab: string) => string;
}) {
  const buckets = [
    { key: "draft", label: strings.draft, count: counts.draft },
    { key: "returned", label: strings.returned, count: counts.returned },
    { key: "published", label: strings.published, count: counts.published },
    { key: "expired", label: strings.expired, count: counts.expired },
  ];
  return (
    <section role="group" aria-label={strings.aria}>
      <CardGrid min="sm">
        {buckets.map(bucket => (
          <StatCard
            key={bucket.key}
            label={bucket.label}
            value={bucket.count ?? strings.notConfigured}
            href={activeTab === bucket.key ? hrefFor("") : hrefFor(bucket.key)}
            sub={activeTab === bucket.key ? strings.activeNote : undefined}
          />
        ))}
      </CardGrid>
    </section>
  );
}
