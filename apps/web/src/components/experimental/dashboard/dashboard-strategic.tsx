import { CardBody } from "@/components/experimental/linear";
import type { SegmentedOption } from "@/components/experimental/linear-data";
import { complianceBreakdown, type FactoryRef, type ResponseRow } from "@/app/(app)/dashboard/metrics";
import { formatCount, formatPercent } from "@/i18n/numbers";
import {
  buildCoverage,
  buildMetricStrip,
  requirementRegisterStrings,
  unrepresented,
  STRATEGIC_CARD_IDS,
  STRATEGIC_REQUIREMENT_IDS,
} from "@/features/dashboard/strip";
import { enforcementTrendView, type EnforcementTrend } from "@/features/dashboard/enforcement-trend";
import { scopeToSearchParams, DASHBOARD_LENSES, type DashboardLens, type DashboardScope } from "@/features/dashboard/scope";
import { fill, getMessages } from "@/i18n/messages";
import type { DashboardKpiProjection } from "@/lib/dashboard-kpi/contract";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { SectionCard } from "@/components/experimental/dashboard-parts/dashboard-chrome";
import { MetricCard, MetricGrid, type MetricCardModel, type MetricCardStrings } from "@/components/experimental/dashboard-parts/metric-card";
import { ComplianceExplorer } from "@/components/experimental/dashboard-parts/compliance-explorer";
import { MeasureCoveragePanel, RequirementRegister } from "@/components/experimental/dashboard-parts/coverage";
import EnforcementTrendCard from "./dashboard-enforcement";
import styles from "./dashboard-screen.module.css";

type DashboardMetrics = ReturnType<typeof import("@/app/(app)/dashboard/metrics").buildDashboardMetrics>;

function percentOrNull(value: number | null, locale: Locale): string | null {
  return value === null ? null : formatPercent(value, locale);
}

export default function DashboardStrategic({ locale, scope, metrics, projection, factories, partialSources, enforcementTrend, roleMetricIds }: {
  locale: Locale;
  scope: DashboardScope;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  factories: readonly FactoryRef[];
  partialSources: readonly string[];
  enforcementTrend: EnforcementTrend;
  roleMetricIds: readonly string[];
}) {
  const { common, dashboard } = getMessages(locale);
  const strategic = metrics.strategic;
  const topViolation = strategic.violationByRegulation[0];
  const rows = complianceBreakdown(
    strategic.approvedScopedResponses as ResponseRow[],
    scope.lens,
    dashboard.explorer.notRecorded,
  );
  const enforcement = enforcementTrendView(enforcementTrend, dashboard.trend);

  const lensHref = (lens: DashboardLens) => {
    const query = scopeToSearchParams(scope);
    query.set("group", lens);
    return localeHref(locale, `/dashboard?${query.toString()}`);
  };
  const lenses: SegmentedOption<DashboardLens>[] = DASHBOARD_LENSES.map(lens => ({
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
      value: percentOrNull(strategic.complianceRate, locale),
      emptyLabel: common.state.unavailable,
      example: fill(dashboard.national.compliance.example, {
        compliant: strategic.approvedCompliant,
        eligible: strategic.approvedAnsweredForCompliance,
      }),
      href: localeHref(locale, "/analytics"),
    },
    {
      ...dashboard.national.approval,
      value: percentOrNull(strategic.decisionApprovalRate, locale),
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
      value: formatCount(strategic.criticalFactories.length, locale),
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

  const requirementIds = unrepresented(STRATEGIC_REQUIREMENT_IDS, STRATEGIC_CARD_IDS, roleMetricIds);
  const requirementStrip = buildMetricStrip(projection, requirementIds, locale, partialSources);
  const coverage = buildCoverage(projection, requirementIds, locale);

  return (
    <div className={styles.stack}>
      <SectionCard id="dashboard-national-performance" title={dashboard.national.title}>
        <CardBody>
          <MetricGrid>
            {national.map(model => <MetricCard key={model.title} model={model} strings={cardStrings} />)}
          </MetricGrid>
        </CardBody>
      </SectionCard>

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

      <SectionCard id="dashboard-strategic-intervention" title={dashboard.intervention.title}>
        <CardBody>
          <MetricGrid>
            {intervention.map(model => <MetricCard key={model.title} model={model} strings={cardStrings} />)}
          </MetricGrid>
        </CardBody>
      </SectionCard>

      <EnforcementTrendCard
        points={enforcement.points}
        comparison={enforcement.comparison}
        readable={enforcementTrend.readable}
        libraryHref={localeHref(locale, "/enforcement-library")}
        strings={dashboard.trend}
      />

      <SectionCard
        id="dashboard-requirement-coverage"
        title={dashboard.requirement.title}
        description={dashboard.requirement.description}
      >
        <CardBody>
          <MeasureCoveragePanel
            coverage={coverage}
            locale={locale}
            strings={dashboard.charts.coverage}
            headingId="dashboard-strategic-blocked"
          />
          <RequirementRegister
            metrics={requirementStrip.metrics}
            methodology={requirementStrip.methodology}
            strings={requirementRegisterStrings(locale)}
          />
        </CardBody>
      </SectionCard>
    </div>
  );
}
