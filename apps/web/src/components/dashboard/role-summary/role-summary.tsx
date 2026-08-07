import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import MetricStrip from "@/components/dashboard/metric-strip/metric-strip";
import { buildMetricStrip, metricStripStrings } from "@/features/dashboard/strip";
import { getMessages } from "@/i18n/messages";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import { ROLE_DASHBOARD_METRICS, type DashboardPersona } from "@/lib/dashboard-role";
import type { Locale } from "@/lib/i18n";

export default function RoleSummary({ locale, persona, projection, partialSources }: {
  locale: Locale;
  persona: DashboardPersona;
  projection: DashboardKpiProjection;
  partialSources: readonly string[];
}) {
  const { dashboard } = getMessages(locale);
  const strip = buildMetricStrip(projection, ROLE_DASHBOARD_METRICS[persona], locale, partialSources);

  return (
    <Card as="section" labelledBy="dashboard-role-summary">
      <CardHeader
        level="h2"
        titleId="dashboard-role-summary"
        eyebrow={dashboard.yourWork.eyebrow}
        title={dashboard.persona[persona]}
        trailing={<StatusPill tone="info" ping>{dashboard.yourWork.scoped}</StatusPill>}
      />
      <CardBody>
        <MetricStrip
          metrics={strip.metrics}
          methodology={strip.methodology}
          strings={metricStripStrings(locale)}
        />
      </CardBody>
    </Card>
  );
}
