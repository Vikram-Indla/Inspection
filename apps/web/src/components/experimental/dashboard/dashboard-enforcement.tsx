import { Badge, Button, CardBody } from "@/components/experimental/linear";
import { EmptyBlock } from "@/components/experimental/linear-data";
import { TrendBars, type TrendPoint as LinearTrendPoint } from "@/components/experimental/linear-charts/charts";
import { SectionCard } from "@/components/experimental/dashboard-parts/dashboard-chrome";

export type EnforcementTrendStrings = {
  readonly title: string;
  readonly comparison: string;
  readonly noBaseline: string;
  readonly restricted: string;
  readonly seriesLabel: string;
  readonly footnote: string;
  readonly action: string;
};

export type IncomingPoint = {
  readonly key: string;
  readonly percent: number;
  readonly label: string;
  readonly caption?: string;
  readonly value?: string;
};

export default function EnforcementTrendCard({ points, comparison, readable, libraryHref, strings }: {
  points: readonly IncomingPoint[];
  comparison: string;
  readable: boolean;
  libraryHref: string;
  strings: EnforcementTrendStrings;
}) {
  const scaled: readonly LinearTrendPoint[] = points.map(point => ({
    label: point.caption ?? point.label,
    percent: point.percent,
    display: point.value ?? point.label,
  }));

  return (
    <SectionCard
      id="dashboard-enforcement-trend"
      title={strings.title}
      description={strings.footnote}
      actions={readable ? <Badge label={comparison} /> : undefined}
    >
      <CardBody>
        {readable
          ? <TrendBars label={strings.seriesLabel} points={scaled} />
          : <EmptyBlock title={strings.restricted} />}
        <div>
          <Button variant="quiet" href={libraryHref} label={strings.action}>{strings.action}</Button>
        </div>
      </CardBody>
    </SectionCard>
  );
}
