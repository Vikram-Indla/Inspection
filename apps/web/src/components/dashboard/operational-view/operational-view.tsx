import { formatCount, formatPercent } from "@/app/(app)/dashboard/dashboard-format";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import BarCell from "@/components/saqeel/charts/bar-cell/bar-cell";
import { Text } from "@/components/saqeel/type";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
  buildCoverage,
  buildMetricStrip,
  requirementRegisterStrings,
  unrepresented,
  OPERATIONAL_CARD_IDS,
  OPERATIONAL_REQUIREMENT_IDS,
} from "@/features/dashboard/strip";
import { getMessages } from "@/i18n/messages";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./operational-view.module.css";
import MeasureCoverage from "../measure-coverage/measure-coverage";
import OperationalCharts from "../operational-charts/operational-charts";
import RequirementRegister from "../requirement-register/requirement-register";
import MetricCard, { MetricCardModel, MetricCardStrings } from "../metric-card/metric-card";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;
type WorkloadRow = DashboardMetrics["operational"]["workload"][number];

const MAX_ROWS = 8;

export default function OperationalView({ locale, metrics, projection, partialSources, roleMetricIds, period }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  partialSources: readonly string[];
  roleMetricIds: readonly string[];
  period: { readonly from: string | null; readonly to: string | null };
}) {
  const { common, dashboard } = getMessages(locale);
  const copy = dashboard.operational;
  const operational = metrics.operational;
  const strings: MetricCardStrings = {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    definition: dashboard.metric.definition,
  };

  const groups: readonly {
    readonly id: string;
    readonly title: string;
    readonly models: readonly MetricCardModel[];
    readonly footnote?: string;
  }[] = [
    {
      id: "dashboard-todays-operations",
      title: copy.today.title,
      models: [
        { ...copy.today.planned, value: formatCount(operational.todayVisits.length, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
        {
          ...copy.today.completion,
          value: operational.todayCompletionRate === null ? null : formatPercent(operational.todayCompletionRate, locale),
          emptyLabel: common.state.unavailable,
          href: localeHref(locale, "/execution"),
        },
      ],
    },
    {
      id: "dashboard-execution-status",
      title: copy.groups.execution,
      models: [
        { ...copy.today.active, value: formatCount(operational.activeField, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/operations") },
        { ...copy.today.overdue, value: formatCount(operational.overdueRows.length, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
      ],
    },
    {
      id: "dashboard-approvals",
      title: copy.groups.approvals,
      models: [
        { ...copy.today.awaiting, value: formatCount(operational.pendingApprovalsCount, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/reviews") },
        { ...copy.today.returned, value: formatCount(operational.returnedRows.length, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
      ],
    },
    {
      id: "dashboard-operational-exceptions",
      title: copy.groups.exceptions,
      models: [
        { ...copy.today.highPriority, value: formatCount(operational.highPriorityRows.length, locale), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
      ],
      footnote: copy.priorities.footnote,
    },
  ];

  const requirementIds = unrepresented(OPERATIONAL_REQUIREMENT_IDS, OPERATIONAL_CARD_IDS, roleMetricIds);
  const requirementStrip = buildMetricStrip(projection, requirementIds, locale, partialSources);
  const coverage = buildCoverage(projection, requirementIds, locale);

  const capacityRows = operational.workload.slice(0, MAX_ROWS);
  const capacityPeak = Math.max(...capacityRows.map(row => row.active), 1);

  const capacityColumns: DataColumn<WorkloadRow>[] = [
    {
      key: "inspector", header: copy.capacity.inspector, isRowHeader: true,      cell: row => row.nameResolved
        ? <span className={styles.name} dir="auto">{row.name}</span>
        : <StatusPill tone="neutral">{copy.capacity.unresolved}</StatusPill>,
    },
    {
      key: "workload", header: copy.capacity.workload, align: "end", numeric: true,
      cell: row => (
        <BarCell
          value={row.active}
          display={formatCount(row.active, locale)}
          peak={capacityPeak}
          muted={!row.nameResolved}
        />
      ),
    },
    {
      key: "capacity", header: copy.capacity.dailyCapacity, align: "end", width: "min",
      cell: () => <StatusPill tone="warning">{common.state.notConfigured}</StatusPill>,
    },
  ];

  return (
    <div className={styles.stack}>
      {groups.map(group => (
        <Card as="section" key={group.id} labelledBy={group.id}>
          <CardHeader level="h2" titleId={group.id} title={group.title} />
          <CardBody>
            <CardGrid min="md">
              {group.models.map(model => <MetricCard key={model.title} model={model} strings={strings} />)}
            </CardGrid>
          </CardBody>
          {group.footnote ? (
            <CardFooter>
              <Text tone="muted">{group.footnote}</Text>
            </CardFooter>
          ) : null}
        </Card>
      ))}

      <OperationalCharts
        locale={locale}
        pipeline={operational.pipeline}
        pipelineTotal={operational.pipelineTotal}
        occurredAt={operational.timeline.map(event => event.occurred_at)}
        from={period.from}
        to={period.to}
      />

      <Card as="section" labelledBy="dashboard-operational-requirement">
        <CardHeader
          level="h2"
          titleId="dashboard-operational-requirement"
          title={copy.requirement.title}
          description={copy.requirement.description}
        />
        <CardBody gap="tight">
          <MeasureCoverage
            coverage={coverage}
            locale={locale}
            strings={dashboard.charts.coverage}
            headingId="dashboard-operational-blocked"
          />
          <RequirementRegister
            metrics={requirementStrip.metrics}
            methodology={requirementStrip.methodology}
            strings={requirementRegisterStrings(locale)}
          />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="dashboard-inspector-capacity">
        <CardHeader
          level="h2"
          titleId="dashboard-inspector-capacity"
          title={copy.capacity.title}
          trailing={<StatusPill tone="neutral">{copy.capacity.note}</StatusPill>}
        />
        <CardBody gap="tight">
          <DataTable
            rows={capacityRows}
            columns={capacityColumns}
            getRowId={row => row.id}
            empty={{ icon: "access", title: copy.capacity.emptyTitle, description: copy.capacity.empty }}
          />
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
