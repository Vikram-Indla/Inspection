import { Card, CardBody, CardFooter, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { complianceBreakdown, type FactoryRef, type ResponseRow } from "@/app/(app)/dashboard/metrics";
import { buildMetricStrip, metricStripStrings, STRATEGIC_REQUIREMENT_IDS } from "@/features/dashboard/strip";
import type { DashboardLens, DashboardScope } from "@/features/dashboard/scope";
import { scopeToSearchParams, DASHBOARD_LENSES } from "@/features/dashboard/scope";
import { fill, getMessages } from "@/i18n/messages";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./strategic-view.module.css";
import MetricStrip from "../metric-strip/metric-strip";
import MetricCard, { MetricCardModel, MetricCardStrings } from "../metric-card/metric-card";
import ComplianceExplorer from "../compliance-explorer/compliance-explorer";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;

function percentOrNull(value: number | null): string | null {
  return value === null ? null : `${value}%`;
}

export default function StrategicView({ locale, scope, metrics, projection, factories, partialSources }: {
  locale: Locale;
  scope: DashboardScope;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  factories: readonly FactoryRef[];
  partialSources: readonly string[];
}) {
  const { common, dashboard } = getMessages(locale);
  const strategic = metrics.strategic;
  const topViolation = strategic.violationByRegulation[0];
  const rows = complianceBreakdown(
    strategic.approvedScopedResponses as ResponseRow[],
    scope.lens,
    dashboard.explorer.notRecorded,
  );

  const lensHref = (lens: DashboardLens) => {
    const query = scopeToSearchParams(scope);
    query.set("group", lens);
    return localeHref(locale, `/dashboard?${query.toString()}`);
  };
  const lenses: SegmentedItem<DashboardLens>[] = DASHBOARD_LENSES.map(lens => ({
    value: lens, label: common.entity[lens], href: lensHref(lens),
  }));

  const cardStrings: MetricCardStrings = {
    methodology: dashboard.metric.methodology,
    why: dashboard.metric.why,
    definition: dashboard.metric.definition,
  };

  const national: MetricCardModel[] = [
    {
      ...dashboard.national.coverage,
      value: null,
      emptyLabel: common.state.notConfigured,
      example: fill(dashboard.national.coverage.example, { count: strategic.completedInspections }),
      href: localeHref(locale, "/planning"),
    },
    {
      ...dashboard.national.compliance,
      value: percentOrNull(strategic.complianceRate),
      emptyLabel: common.state.unavailable,
      example: fill(dashboard.national.compliance.example, {
        compliant: strategic.approvedCompliant,
        eligible: strategic.approvedAnsweredForCompliance,
      }),
      href: localeHref(locale, "/analytics"),
    },
    {
      ...dashboard.national.approval,
      value: percentOrNull(strategic.decisionApprovalRate),
      emptyLabel: common.state.unavailable,
      example: fill(dashboard.national.approval.example, {
        approved: strategic.approvedScoped,
        decided: strategic.decidedScoped,
      }),
      href: localeHref(locale, "/reviews"),
    },
  ];

  const intervention: MetricCardModel[] = [
    {
      ...dashboard.intervention.topViolation,
      value: topViolation?.label ?? null,
      valueKind: "text",
      emptyLabel: common.state.unavailable,
      example: topViolation
        ? fill(dashboard.intervention.topViolation.example, { count: topViolation.value })
        : dashboard.intervention.topViolation.exampleEmpty,
      href: localeHref(locale, "/admin/regulations"),
    },
    {
      ...dashboard.intervention.critical,
      value: String(strategic.criticalFactories.length),
      emptyLabel: common.state.unavailable,
      example: fill(dashboard.intervention.critical.example, { count: strategic.criticalFactories.length }),
      href: localeHref(locale, "/factories"),
    },
    {
      ...dashboard.intervention.annual,
      value: null,
      emptyLabel: common.state.notConfigured,
      example: fill(dashboard.intervention.annual.example, { count: factories.length }),
      href: localeHref(locale, "/planning"),
    },
  ];

  const requirementStrip = buildMetricStrip(projection, STRATEGIC_REQUIREMENT_IDS, locale, partialSources);

  return (
    <div className={styles.stack}>
      <Card as="section" labelledBy="dashboard-national-performance">
        <CardHeader level="h2" titleId="dashboard-national-performance" title={dashboard.national.title} />
        <CardBody>
          <CardGrid min="md">
            {national.map(model => <MetricCard key={model.title} model={model} strings={cardStrings} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <ComplianceExplorer
        rows={rows}
        lenses={lenses}
        currentLens={scope.lens}
        hrefFor={label => localeHref(locale, `/factories?${scope.lens}=${encodeURIComponent(label)}`)}
        strings={{
          title: dashboard.explorer.title,
          description: dashboard.explorer.description,
          lens: dashboard.explorer.lens,
          lensLabel: common.entity[scope.lens],
          openFactories: dashboard.explorer.openFactories,
          emptyTitle: dashboard.explorer.emptyTitle,
          empty: dashboard.explorer.empty,
          rateHeading: dashboard.explorer.rateHeading,
          countHeading: dashboard.explorer.countHeading,
          footnote: fill(dashboard.explorer.footnote, { lens: common.entity[scope.lens] }),
          missing: common.state.unavailable,
        }}
      />

      <Card as="section" labelledBy="dashboard-strategic-intervention">
        <CardHeader level="h2" titleId="dashboard-strategic-intervention" title={dashboard.intervention.title} />
        <CardBody>
          <CardGrid min="md">
            {intervention.map(model => <MetricCard key={model.title} model={model} strings={cardStrings} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <CardGrid min="lg">
        <Card as="section">
          <CardHeader level="h2" title={dashboard.enforcement.title} />
          <CardBody gap="tight">
            <StatusPill tone="warning" ping>{dashboard.enforcement.blockedTitle}</StatusPill>
            <p className={styles.text}>{dashboard.enforcement.blockedDetail}</p>
          </CardBody>
          <CardFooter>
            <Button variant="secondary" size="sm" href={localeHref(locale, "/enforcement-library")} label={dashboard.enforcement.action}>
              {dashboard.enforcement.action}
            </Button>
          </CardFooter>
        </Card>
        <Card as="section">
          <CardHeader level="h2" eyebrow={dashboard.aiBrief.eyebrow} title={dashboard.aiBrief.title} />
          <CardBody gap="tight">
            <StatusPill tone="accent" ping>{common.state.notConfigured}</StatusPill>
            <p className={styles.text}>{dashboard.aiBrief.detail}</p>
            <p className={styles.footnote}>{dashboard.aiBrief.footnote}</p>
          </CardBody>
        </Card>
      </CardGrid>

      <Card as="section" labelledBy="dashboard-requirement-coverage">
        <CardHeader
          level="h2"
          titleId="dashboard-requirement-coverage"
          title={dashboard.requirement.title}
          trailing={<StatusPill tone="info" ping>{dashboard.requirement.description}</StatusPill>}
        />
        <CardBody>
          <MetricStrip
            metrics={requirementStrip.metrics}
            methodology={requirementStrip.methodology}
            strings={metricStripStrings(locale)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
