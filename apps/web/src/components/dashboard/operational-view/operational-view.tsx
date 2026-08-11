import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
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
import RequirementRegister from "../requirement-register/requirement-register";
import MetricCard, { MetricCardModel, MetricCardStrings } from "../metric-card/metric-card";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;
type WorkloadRow = DashboardMetrics["operational"]["workload"][number];

const MAX_ROWS = 8;

export default function OperationalView({ locale, metrics, projection, partialSources, roleMetricIds }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  partialSources: readonly string[];
  roleMetricIds: readonly string[];
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
        { ...copy.today.planned, value: String(operational.todayVisits.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
        {
          ...copy.today.completion,
          value: operational.todayCompletionRate === null ? null : `${operational.todayCompletionRate}%`,
          emptyLabel: common.state.unavailable,
          href: localeHref(locale, "/execution"),
        },
      ],
    },
    {
      id: "dashboard-execution-status",
      title: copy.groups.execution,
      models: [
        { ...copy.today.active, value: String(operational.activeField), emptyLabel: common.state.unavailable, href: localeHref(locale, "/operations") },
        { ...copy.today.overdue, value: String(operational.overdueRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
      ],
    },
    {
      id: "dashboard-approvals",
      title: copy.groups.approvals,
      models: [
        { ...copy.today.awaiting, value: String(operational.pendingApprovalsCount), emptyLabel: common.state.unavailable, href: localeHref(locale, "/reviews") },
        { ...copy.today.returned, value: String(operational.returnedRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/execution") },
      ],
    },
    {
      id: "dashboard-operational-exceptions",
      title: copy.groups.exceptions,
      models: [
        { ...copy.today.highPriority, value: String(operational.highPriorityRows.length), emptyLabel: common.state.unavailable, href: localeHref(locale, "/planning") },
      ],
      footnote: copy.priorities.footnote,
    },
  ];

  const requirementStrip = buildMetricStrip(
    projection,
    unrepresented(OPERATIONAL_REQUIREMENT_IDS, OPERATIONAL_CARD_IDS, roleMetricIds),
    locale,
    partialSources,
  );

  const capacityColumns: DataColumn<WorkloadRow>[] = [
    {
      key: "inspector", header: copy.capacity.inspector, isRowHeader: true,      cell: row => row.nameResolved
        ? <span className={styles.name} dir="auto">{row.name}</span>
        : <StatusPill tone="neutral">{copy.capacity.unresolved}</StatusPill>,
    },
    {
      key: "workload", header: copy.capacity.workload, align: "end", numeric: true,
      cell: row => row.active,
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

      <Card as="section" labelledBy="dashboard-operational-requirement">
        <CardHeader
          level="h2"
          titleId="dashboard-operational-requirement"
          title={copy.requirement.title}
          description={copy.requirement.description}
        />
        <CardBody gap="tight">
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
            rows={operational.workload.slice(0, MAX_ROWS)}
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
