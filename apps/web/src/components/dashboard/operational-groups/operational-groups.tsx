import { Card, CardBody, CardFooter, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import { stateSlices } from "@/features/dashboard/strip";
import { getMessages } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import MetricCard, { type MetricCardModel, type MetricCardStrings } from "../metric-card/metric-card";
import PipelineBreakdown from "../pipeline-breakdown/pipeline-breakdown";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;

export default function OperationalGroups({ locale, operational }: {
  locale: Locale;
  operational: DashboardMetrics["operational"];
}) {
  const { common, dashboard } = getMessages(locale);
  const copy = dashboard.operational;
  const charts = dashboard.charts;
  const strings: MetricCardStrings = {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    definition: dashboard.metric.definition,
  };
  const unavailable = common.state.unavailable;

  const groups: readonly {
    readonly id: string;
    readonly title: string;
    readonly models: readonly MetricCardModel[];
    readonly footnote?: string;
    readonly breakdown?: {
      readonly slices: readonly { readonly label: string; readonly value: number }[];
      readonly total: number;
      readonly copy: { readonly title: string; readonly aria: string; readonly total: string };
    };
  }[] = [
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
      ],
      breakdown: {
        slices: stateSlices(operational.todayVisits),
        total: operational.todayVisits.length,
        copy: charts.todayStates,
      },
    },
    {
      id: "dashboard-execution-status",
      title: copy.groups.execution,
      models: [
        { ...copy.today.active, value: formatCount(operational.activeField, locale), emptyLabel: unavailable, href: localeHref(locale, "/operations") },
        { ...copy.today.overdue, value: formatCount(operational.overdueRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/planning") },
      ],
      breakdown: {
        slices: stateSlices(operational.activeFieldRows),
        total: operational.activeField,
        copy: charts.activeField,
      },
    },
    {
      id: "dashboard-approvals",
      title: copy.groups.approvals,
      models: [
        { ...copy.today.awaiting, value: formatCount(operational.pendingApprovalsCount, locale), emptyLabel: unavailable, href: localeHref(locale, "/reviews") },
        { ...copy.today.returned, value: formatCount(operational.returnedRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/execution") },
      ],
    },
    {
      id: "dashboard-operational-exceptions",
      title: copy.groups.exceptions,
      models: [
        { ...copy.today.highPriority, value: formatCount(operational.highPriorityRows.length, locale), emptyLabel: unavailable, href: localeHref(locale, "/planning") },
      ],
      footnote: copy.priorities.footnote,
    },
  ];

  return (
    <>
      {groups.map(group => (
        <Card as="section" key={group.id} labelledBy={group.id}>
          <CardHeader level="h2" titleId={group.id} title={group.title} />
          <CardBody>
            <CardGrid min="md">
              {group.models.map(model => <MetricCard key={model.title} model={model} strings={strings} />)}
            </CardGrid>
            {group.breakdown?.slices.length ? (
              <>
                <Heading level={3} visual="subheading">{group.breakdown.copy.title}</Heading>
                <PipelineBreakdown
                  slices={group.breakdown.slices}
                  total={group.breakdown.total}
                  locale={locale}
                  strings={group.breakdown.copy}
                />
              </>
            ) : null}
          </CardBody>
          {group.footnote ? (
            <CardFooter>
              <Text tone="muted">{group.footnote}</Text>
            </CardFooter>
          ) : null}
        </Card>
      ))}
    </>
  );
}
