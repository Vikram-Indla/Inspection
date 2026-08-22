import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ActivityTrend from "../activity-trend/activity-trend";
import PipelineBreakdown, { type PipelineSlice } from "../pipeline-breakdown/pipeline-breakdown";

export default function OperationalCharts({ locale, pipeline, pipelineTotal, occurredAt, from, to }: {
  locale: Locale;
  pipeline: readonly PipelineSlice[];
  pipelineTotal: number;
  occurredAt: readonly string[];
  from: string | null;
  to: string | null;
}) {
  const copy = getMessages(locale).dashboard.charts;

  return (
    <>
      <Card as="section" labelledBy="dashboard-pipeline-breakdown">
        <CardHeader
          level="h2"
          titleId="dashboard-pipeline-breakdown"
          title={copy.pipeline.title}
        />
        <CardBody gap="tight">
          <PipelineBreakdown
            slices={pipeline}
            total={pipelineTotal}
            locale={locale}
            strings={copy.pipeline}
          />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="dashboard-activity-trend">
        <CardHeader
          level="h2"
          titleId="dashboard-activity-trend"
          title={copy.activity.title}
        />
        <CardBody gap="tight">
          <ActivityTrend
            occurredAt={occurredAt}
            from={from}
            to={to}
            locale={locale}
            strings={copy.activity}
          />
        </CardBody>
      </Card>
    </>
  );
}
