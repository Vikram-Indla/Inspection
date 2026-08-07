import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import MetricCard, { type MetricCardModel, type MetricCardStrings } from "@/components/dashboard/metric-card/metric-card";
import MetricStrip from "@/components/dashboard/metric-strip/metric-strip";
import { buildMetricStrip, metricStripStrings, OPERATIONAL_REQUIREMENT_IDS } from "@/features/dashboard/strip";
import { fill, getMessages } from "@/i18n/messages";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./operational-view.module.css";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;

const MAX_ROWS = 8;

export default function OperationalView({ locale, metrics, projection, partialSources }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  partialSources: readonly string[];
}) {
  const { common, dashboard } = getMessages(locale);
  const copy = dashboard.operational;
  const operational = metrics.operational;
  const strings: MetricCardStrings = {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    definition: dashboard.metric.definition,
  };

  const today: MetricCardModel[] = [
    { ...copy.today.planned, value: String(operational.todayVisits.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
    {
      ...copy.today.completion,
      value: operational.todayCompletionRate === null ? null : `${operational.todayCompletionRate}%`,
      emptyLabel: common.state.unavailable,
      href: localeHref(locale, "/execution"),
    },
    { ...copy.today.active, value: String(operational.activeField), emptyLabel: common.state.unavailable, href: localeHref(locale, "/operations") },
    { ...copy.today.overdue, value: String(operational.overdueRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
    { ...copy.today.awaiting, value: String(operational.pendingApprovalsCount), emptyLabel: common.state.unavailable, href: localeHref(locale, "/reviews") },
    { ...copy.today.returned, value: String(operational.returnedRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
    { ...copy.today.highPriority, value: String(operational.highPriorityRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
  ];

  const requirementStrip = buildMetricStrip(projection, OPERATIONAL_REQUIREMENT_IDS, locale, partialSources);
  const workload = operational.workload.slice(0, MAX_ROWS);

  return (
    <div className={styles.stack}>
      <Card as="section" labelledBy="dashboard-operational-priorities">
        <CardHeader
          level="h2"
          titleId="dashboard-operational-priorities"
          title={copy.priorities.title}
          description={fill(copy.priorities.summary, {
            high: operational.highPriorityRows.length,
            overdue: operational.overdueRows.length,
          })}
        />
        <CardBody gap="tight">
          <p className={styles.footnote}>{copy.priorities.footnote}</p>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="dashboard-todays-operations">
        <CardHeader level="h2" titleId="dashboard-todays-operations" title={copy.today.title} />
        <CardBody>
          <CardGrid min="md">
            {today.map(model => <MetricCard key={model.title} model={model} strings={strings} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="dashboard-operational-requirement">
        <CardHeader
          level="h2"
          titleId="dashboard-operational-requirement"
          title={copy.requirement.title}
          description={copy.requirement.description}
        />
        <CardBody>
          <MetricStrip
            metrics={requirementStrip.metrics}
            methodology={requirementStrip.methodology}
            strings={metricStripStrings(locale)}
          />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="dashboard-inspector-capacity">
        <CardHeader
          level="h2"
          titleId="dashboard-inspector-capacity"
          title={copy.capacity.title}
          trailing={<StatusPill tone="neutral" size="sm">{copy.capacity.note}</StatusPill>}
        />
        <CardBody gap="tight">
          {workload.length ? (
            <div className={styles.table}>
              <div className={styles.head} aria-hidden="true">
                <span className={styles.headCell}>{copy.capacity.inspector}</span>
                <span className={styles.headCell} data-align="end">{copy.capacity.workload}</span>
                <span className={styles.headCell} data-align="end">{copy.capacity.dailyCapacity}</span>
              </div>
              {workload.map(row => (
                <div className={styles.row} key={row.id}>
                  <span className={styles.name}>
                    {row.nameResolved
                      ? row.name
                      : <StatusPill tone="neutral" size="sm">{copy.capacity.unresolved}</StatusPill>}
                  </span>
                  <span className={styles.count}>{row.active}</span>
                  <span className={styles.capacity}>
                    <StatusPill tone="warning" size="sm" ping>{common.state.notConfigured}</StatusPill>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="access" title={copy.capacity.emptyTitle} description={copy.capacity.empty} />
          )}
        </CardBody>
        <CardFooter>
          <Button variant="secondary" size="sm" href={localeHref(locale, "/execution")} label={copy.capacity.action}>
            {copy.capacity.action}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
