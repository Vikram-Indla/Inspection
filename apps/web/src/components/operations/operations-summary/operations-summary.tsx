import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardGrid, CardHeader, CardValue } from "@/components/saqeel/card/card";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type SummaryStat = {
  readonly label: string;
  readonly value: string;
  readonly configured: boolean;
  readonly href?: string;
  readonly action?: string;
};

export type RegionStat = {
  readonly name: string;
  readonly href: string;
  readonly active: string;
  readonly detail: string;
};

export function OperationsSummary({ title, stats }: {
  title: string;
  stats: readonly SummaryStat[];
}) {
  return (
    <Card as="section" labelledBy="operations-summary">
      <CardHeader level="h2" titleId="operations-summary" title={title} />
      <CardBody>
        <CardGrid min="sm">
          {stats.map(stat => (
            <StatCard
              key={stat.label}
              label={stat.label}
              status={stat.configured ? undefined : <CardValue kind="text" size="md">{stat.value}</CardValue>}
              value={stat.value}
              action={stat.href && stat.action
                ? (
                  <Button variant="tertiary" size="sm" href={stat.href} label={stat.action}>
                    {stat.action}
                  </Button>
                )
                : undefined}
            />
          ))}
        </CardGrid>
      </CardBody>
    </Card>
  );
}

export function OperationsRegions({ title, unavailable, regions }: {
  title: string;
  unavailable: string;
  regions: readonly RegionStat[];
}) {
  return (
    <Card as="section" labelledBy="operations-regions">
      <CardHeader
        level="h2"
        titleId="operations-regions"
        title={title}
        trailing={<StatusPill tone="warning" ping={false}>{unavailable}</StatusPill>}
      />
      <CardBody>
        <CardGrid min="sm">
          {regions.map(region => (
            <StatCard
              key={region.name}
              label={region.name}
              href={region.href}
              value={region.active}
              sub={region.detail}
            />
          ))}
        </CardGrid>
      </CardBody>
    </Card>
  );
}
