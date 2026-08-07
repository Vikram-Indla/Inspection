import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type SummaryStat = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly action: string;
};

export type RegionStat = {
  readonly name: string;
  readonly href: string;
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
              value={stat.value}
              action={
                <Button variant="tertiary" size="sm" href={stat.href} label={stat.action}>
                  {stat.action}
                </Button>
              }
            />
          ))}
        </CardGrid>
      </CardBody>
    </Card>
  );
}

export function OperationsRegions({ title, description, unavailable, regions }: {
  title: string;
  description: string;
  unavailable: string;
  regions: readonly RegionStat[];
}) {
  return (
    <Card as="section" labelledBy="operations-regions">
      <CardHeader
        level="h2"
        titleId="operations-regions"
        title={title}
        description={description}
      />
      <CardBody>
        <CardGrid min="sm">
          {regions.map(region => (
            <StatCard
              key={region.name}
              label={region.name}
              href={region.href}
              status={<StatusPill tone="warning" size="sm" ping>{unavailable}</StatusPill>}
              sub={region.detail}
            />
          ))}
        </CardGrid>
      </CardBody>
    </Card>
  );
}
