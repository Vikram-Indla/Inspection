import { redirect } from "next/navigation";
import { buildDashboardMetrics } from "@/app/(app)/dashboard/metrics";
import Button from "@/components/saqeel/button/button";
import { fetchDashboardSnapshot } from "@/features/dashboard/client";
import { withView, type DashboardScope } from "@/features/dashboard/scope";
import type { DashboardSnapshot } from "@/features/dashboard/types";
import { fill, getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { buildInspectorKpiProjection } from "@/lib/dashboard-kpi/inspector-projection";
import { buildDashboardKpiProjection } from "@/lib/dashboard-kpi/projection";
import type { MetricScope } from "@/lib/dashboard-kpi/contract";
import type { DashboardPersona } from "@/lib/dashboard-role";
import styles from "./dashboard-sections.module.css";
import ExplainProvider from "../explain-panel/explain-panel";
import DashboardNotice from "../dashboard-notice/dashboard-notice";
import StrategicView from "../strategic-view/strategic-view";
import OperationalView from "../operational-view/operational-view";
import SearchResults from "../search-results/search-results";
import RoleSummary from "../role-summary/role-summary";
import DashboardToolbar from "../dashboard-toolbar/dashboard-toolbar";

function refreshedLabel(nowMs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(nowMs));
}

function projectionFor(
  persona: DashboardPersona,
  snapshot: DashboardSnapshot,
  scope: DashboardScope,
  partialSources: string[],
) {
  const metricScope: MetricScope = {
    fromMs: scope.scope.fromMs,
    toMs: scope.scope.toMs,
    fromDate: scope.scope.fromDate,
    toDate: scope.scope.toDate,
    timezone: "Asia/Riyadh",
    region: scope.region || null,
    filters: scope.query ? { q: scope.query } : {},
  };
  const metrics = buildDashboardMetrics({
    visits: snapshot.visits,
    inspections: snapshot.inspections,
    reviews: snapshot.reviews,
    responses: snapshot.responses,
    checklistItems: snapshot.checklistItems,
    violations: snapshot.violations,
    geo: snapshot.geo,
    audit: snapshot.audit,
    factories: snapshot.factories,
    sla: snapshot.sla,
    slaWarnAtFraction: snapshot.gates.slaWarnAtFraction,
    scope: scope.scope,
    today: scope.today,
    region: scope.region,
    nowMs: scope.nowMs,
  });
  const projection = buildDashboardKpiProjection(metrics, {
    scope: metricScope,
    policyVersionId: snapshot.policy.policyVersionId,
    targets: snapshot.policy.targets,
    cyclePolicyConfigured: snapshot.gates.cyclePolicyConfigured,
    refreshedAt: new Date(scope.nowMs).toISOString(),
    generatedAtMs: scope.nowMs,
    failedSources: partialSources,
  });
  const roleProjection = persona === "inspector"
    ? buildInspectorKpiProjection({
        visits: snapshot.visits
          .filter(row => Boolean(row.window_start))
          .map(row => ({ id: row.id, window_start: row.window_start!, operational_state: row.operational_state })),
        inspections: snapshot.inspections.map(row => ({
          id: row.id, visit_id: row.visit_id, status: row.status, submitted_at: row.submitted_at,
        })),
        reviews: snapshot.reviews.map(row => ({
          inspection_id: row.inspection_id, status: row.status, decision: row.decision, decided_at: row.decided_at,
        })),
        responses: snapshot.responses,
        syncQueueCount: 0,
        nowMs: scope.nowMs,
        policyVersionId: snapshot.policy.policyVersionId,
        targets: snapshot.policy.targets,
        refreshedAt: new Date(scope.nowMs).toISOString(),
        sourceStatus: partialSources.length ? "partial" : "live",
      })
    : projection;
  return { metrics, projection, roleProjection };
}

export default async function DashboardSections({ locale, scope }: {
  locale: Locale;
  scope: DashboardScope;
}) {
  const { common, dashboard } = getMessages(locale);
  const result = await fetchDashboardSnapshot(scope);
  if (result.status === "unauthenticated") redirect(localeHref(locale, "/login"));
  if (result.status === "no-workspace") redirect(localeHref(locale, "/launch/no-workspace"));

  if (result.status === "unavailable") {
    return (
      <DashboardNotice tone="danger" pill={common.state.unavailable} title={dashboard.partial.title}>
        <p className={styles.text}>{dashboard.partial.retry}</p>
      </DashboardNotice>
    );
  }

  const { persona, snapshot } = result.payload;
  const resolved = withView(scope, result.payload.view);

  if (scope.requestedView) {
    return (
      <DashboardNotice
        tone="warning"
        pill={common.state.notConfigured}
        title={dashboard.unsupported.title}
        actions={
          <div className={styles.actions}>
            <Button variant="primary" href={localeHref(locale, "/dashboard?view=strategic")} label={dashboard.perspective.strategic}>
              {dashboard.perspective.strategic}
            </Button>
            <Button variant="secondary" href={localeHref(locale, "/dashboard?view=operational")} label={dashboard.perspective.operational}>
              {dashboard.perspective.operational}
            </Button>
          </div>
        }
      >
        <p className={styles.text}>{fill(dashboard.unsupported.detail, { view: scope.requestedView })}</p>
      </DashboardNotice>
    );
  }

  const partialSources = snapshot.failedSources.map(key => dashboard.source[key]);
  const { metrics, projection, roleProjection } = projectionFor(persona, snapshot, resolved, partialSources);

  return (
    <ExplainProvider
      strings={{
        close: common.action.close,
        blockedTitle: dashboard.metric.blockedTitle,
        drillFallback: dashboard.metric.drill,
      }}
    >
      <div className={styles.stack} data-sqx-cards="flush">
        {partialSources.length ? (
        <DashboardNotice tone="danger" pill={dashboard.partial.title} title={dashboard.partial.sources}>
          <p className={styles.text}>{partialSources.join(" · ")}</p>
          <p className={styles.text}>{dashboard.partial.retry}</p>
        </DashboardNotice>
      ) : null}

      <DashboardToolbar
        locale={locale} scope={resolved} view={resolved.view}
        refreshedAt={refreshedLabel(scope.nowMs)}
      />
      <RoleSummary
        locale={locale} persona={persona} projection={roleProjection} partialSources={partialSources}
      />
      <SearchResults
        locale={locale} query={scope.query} factories={snapshot.factories}
        visits={snapshot.visits} inspections={snapshot.inspections}
      />
      {resolved.view === "strategic"
        ? <StrategicView
            locale={locale} scope={resolved} metrics={metrics} projection={projection}
            factories={snapshot.factories} partialSources={partialSources}
          />
        : <OperationalView
            locale={locale} metrics={metrics} projection={projection}
            partialSources={partialSources}
          />}
      </div>
    </ExplainProvider>
  );
}
