import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import TrendBars, { type TrendPoint } from "@/components/saqeel/trend-bars/trend-bars";

export type EnforcementTrendStrings = {
  readonly title: string;
  readonly comparison: string;
  readonly noBaseline: string;
  readonly restricted: string;
  readonly seriesLabel: string;
  readonly footnote: string;
  readonly action: string;
};

export default function EnforcementTrend({ points, comparison, tone, readable, libraryHref, strings }: {
  points: readonly TrendPoint[];
  comparison: string;
  tone: StatusTone;
  readable: boolean;
  libraryHref: string;
  strings: EnforcementTrendStrings;
}) {
  return (
    <Card as="section" labelledBy="dashboard-enforcement-trend">
      <CardHeader
        level="h2"
        titleId="dashboard-enforcement-trend"
        title={strings.title}
        description={strings.footnote}
        trailing={readable ? <StatusPill tone={tone}>{comparison}</StatusPill> : undefined}
      />
      <CardBody gap="tight">
        {readable
          ? <TrendBars points={points} tone={tone} label={strings.seriesLabel} />
          : <EmptyState icon="restricted" size="sm" title={strings.restricted} />}
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="sm" href={libraryHref} label={strings.action}>
          {strings.action}
        </Button>
      </CardFooter>
    </Card>
  );
}
