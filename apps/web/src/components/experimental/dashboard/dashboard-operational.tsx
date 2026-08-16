import { Badge, Button, CardBody, Heading, Text } from "@/components/experimental/linear";
import { DataTable, type TableColumn } from "@/components/experimental/linear-data";
import { BarCell } from "@/components/experimental/linear-charts/charts";
import {
  buildCoverage,
  buildMetricStrip,
  requirementRegisterStrings,
  stateSlices,
  unrepresented,
  OPERATIONAL_CARD_IDS,
  OPERATIONAL_REQUIREMENT_IDS,
} from "@/features/dashboard/strip";
import { getMessages } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { SectionCard } from "@/components/experimental/dashboard-parts/dashboard-chrome";
import { MetricCard, MetricGrid, type MetricCardModel, type MetricCardStrings } from "@/components/experimental/dashboard-parts/metric-card";
import { MeasureCoveragePanel, RequirementRegister } from "@/components/experimental/dashboard-parts/coverage";
import { ActivityTrend, PipelineBreakdown } from "./dashboard-pipeline";
import styles from "./dashboard-screen.module.css";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;
type WorkloadRow = DashboardMetrics["operational"]["workload"][number];

const MAX_ROWS = 8;

export default function DashboardOperational({ locale, metrics, projection, partialSources, roleMetricIds, period }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  partialSources: readonly string[];
  roleMetricIds: readonly string[];
  period: { readonly from: string | null; readonly to: string | null };
}) {
  const { common, dashboard } = getMessages(locale);
  const copy = dashboard.operational;
  const charts = dashboard.charts;
  const operational = metrics.operational;
  const unavailable = common.state.unavailable;
  const cardStrings: MetricCardStrings = {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    definition: dashboard.metric.definition,
  };

  const groups = [
    {
      id: "dashboard-todays-operations",
      title: copy.today.title,
      models: [
        { ...copy.today.planned, value: formatCount(operational.todayVisits.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/execution") },
        {
          ...copy.today.completion,
          value: operational.todayCompletionRate === null ? null : formatPercent(operational.todayCompletionRate, locale),
          emptyLabel: unavailable,
          href: localeHref(locale, "/execution"),
        },
      ] as readonly MetricCardModel[],
      breakdown: { slices: stateSlices(operational.todayVisits), total: operational.todayVisits.length, copy: charts.todayStates },
      footnote: undefined,
    },
    {
      id: "dashboard-execution-status",
      title: copy.groups.execution,
      models: [
        { ...copy.today.active, value: formatCount(operational.activeField, locale), emptyLabel: unavailable, href: localeHref(locale, "/operations") },
        { ...copy.today.overdue, value: formatCount(operational.overdueRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/planning") },
      ] as readonly MetricCardModel[],
      breakdown: { slices: stateSlices(operational.activeFieldRows), total: operational.activeField, copy: charts.activeField },
      footnote: undefined,
    },
    {
      id: "dashboard-approvals",
      title: copy.groups.approvals,
      models: [
        { ...copy.today.awaiting, value: formatCount(operational.pendingApprovalsCount, locale), emptyLabel: unavailable, href: localeHref(locale, "/reviews") },
        { ...copy.today.returned, value: formatCount(operational.returnedRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/execution") },
      ] as readonly MetricCardModel[],
      breakdown: undefined,
      footnote: undefined,
    },
    {
      id: "dashboard-operational-exceptions",
      title: copy.groups.exceptions,
      models: [
        { ...copy.today.highPriority, value: formatCount(operational.highPriorityRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/planning") },
      ] as readonly MetricCardModel[],
      breakdown: undefined,
      footnote: copy.priorities.footnote,
    },
  ] as const;

  const requirementIds = unrepresented(OPERATIONAL_REQUIREMENT_IDS, OPERATIONAL_CARD_IDS, roleMetricIds);
  const requirementStrip = buildMetricStrip(projection, requirementIds, locale, partialSources);
  const coverage = buildCoverage(projection, requirementIds, locale);

  const capacityRows = operational.workload.slice(0, MAX_ROWS);
  const capacityPeak = Math.max(...capacityRows.map(row => row.active), 1);

  const capacityColumns: readonly TableColumn<WorkloadRow>[] = [
    {
      key: "inspector",
      header: copy.capacity.inspector,
      isRowHeader: true,
      cell: row => row.nameResolved
        ? <Text role="caption" as="span">{row.name}</Text>
        : <Badge label={copy.capacity.unresolved} />,
    },
    {
      key: "workload",
      header: copy.capacity.workload,
      numeric: true,
      cell: row => (
        <BarCell
          display={formatCount(row.active, locale)}
          percent={(row.active / capacityPeak) * 100}
          muted={!row.nameResolved}
        />
      ),
    },
    {
      key: "capacity",
      header: copy.capacity.dailyCapacity,
      numeric: true,
      cell: () => <Badge label={common.state.notConfigured} />,
    },
  ];

  return (
    <div className={styles.stack}>
      {groups.map(group => (
        <SectionCard id={group.id} key={group.id} title={group.title}>
          <CardBody>
            <MetricGrid>
              {group.models.map(model => <MetricCard key={model.title} model={model} strings={cardStrings} />)}
            </MetricGrid>
            {group.breakdown && group.breakdown.slices.length ? (
              <>
                <Heading level={3} role="bodyLg">{group.breakdown.copy.title}</Heading>
                <PipelineBreakdown
                  slices={group.breakdown.slices}
                  total={group.breakdown.total}
                  locale={locale}
                  strings={group.breakdown.copy}
                />
              </>
            ) : null}
            {group.footnote ? <Text role="caption" tone="muted">{group.footnote}</Text> : null}
          </CardBody>
        </SectionCard>
      ))}

      <SectionCard
        id="dashboard-pipeline-breakdown"
        title={charts.pipeline.title}
        description={charts.pipeline.description}
      >
        <CardBody>
          <PipelineBreakdown
            slices={operational.pipeline}
            total={operational.pipelineTotal}
            locale={locale}
            strings={charts.pipeline}
          />
        </CardBody>
      </SectionCard>

      <SectionCard
        id="dashboard-activity-trend"
        title={charts.activity.title}
        description={charts.activity.description}
      >
        <CardBody>
          <ActivityTrend
            occurredAt={operational.timeline.map(event => event.occurred_at)}
            from={period.from}
            to={period.to}
            locale={locale}
            strings={charts.activity}
          />
        </CardBody>
      </SectionCard>

      <SectionCard
        id="dashboard-operational-requirement"
        title={copy.requirement.title}
        description={copy.requirement.description}
      >
        <CardBody>
          <MeasureCoveragePanel
            coverage={coverage}
            locale={locale}
            strings={charts.coverage}
            headingId="dashboard-operational-blocked"
          />
          <RequirementRegister
            metrics={requirementStrip.metrics}
            methodology={requirementStrip.methodology}
            strings={requirementRegisterStrings(locale)}
          />
        </CardBody>
      </SectionCard>

      <SectionCard
        id="dashboard-inspector-capacity"
        title={copy.capacity.title}
        description={copy.capacity.note}
      >
        <CardBody>
          <DataTable
            caption={copy.capacity.title}
            columns={capacityColumns}
            rows={capacityRows}
            getRowId={row => row.id}
            empty={{ title: copy.capacity.emptyTitle, description: copy.capacity.empty }}
          />
          <div>
            <Button variant="quiet" href={localeHref(locale, "/execution")} label={copy.capacity.action}>
              {copy.capacity.action}
            </Button>
          </div>
        </CardBody>
      </SectionCard>
    </div>
  );
}
