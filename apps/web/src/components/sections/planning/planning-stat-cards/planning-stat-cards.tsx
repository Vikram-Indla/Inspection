import { CardGrid } from "@/components/saqeel/card/card";
import StatCard from "@/components/saqeel/stat-card/stat-card";

export type PlanningStat = {
  readonly key: string;
  readonly label: string;
  readonly count: number | null;
  readonly href: string | null;
  readonly active: boolean;
};

export default function PlanningStatCards({ stats, strings }: {
  stats: readonly PlanningStat[];
  strings: { readonly groupLabel: string; readonly notConfigured: string; readonly activeNote: string };
}) {
  return (
    <section role="group" aria-label={strings.groupLabel}>
      <CardGrid min="sm">
        {stats.map(stat => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.count === null ? strings.notConfigured : stat.count}
            href={stat.href ?? undefined}
            sub={stat.active ? strings.activeNote : undefined}
          />
        ))}
      </CardGrid>
    </section>
  );
}
