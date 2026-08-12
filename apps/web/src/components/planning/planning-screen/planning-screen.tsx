import { type ReactNode } from "react";
import VisitViewNavigation from "@/app/(app)/visits/VisitViewNavigation";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import PlanningHeader from "@/components/planning/planning-header/planning-header";
import PlanningAssistant from "@/components/planning/planning-assistant/planning-assistant";
import PlanningBuckets from "@/components/planning/planning-buckets/planning-buckets";
import PlanningToolbar from "@/components/planning/planning-toolbar/planning-toolbar";
import PlanningVisitTable from "@/components/planning/planning-visit-table/planning-visit-table";
import PlanningDrafts from "@/components/planning/planning-drafts/planning-drafts";
import { planningHref } from "@/features/planning/links";
import { buildPlanningVisitViews } from "@/features/planning/view";
import type { PlanningSearchParams, PlanningWorkspace } from "@/features/planning/queries";
import { PLANNING_METHODS, type PlanningListParams } from "@/lib/planning/visit-list";
import { fill, type Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./planning-screen.module.css";

type PlanningMessages = Messages["planning"];

export default function PlanningScreen({ workspace, params, sp, locale, messages, canExport, formId, createVisit }: {
  workspace: Extract<PlanningWorkspace, { ok: true }>;
  params: PlanningListParams;
  sp: PlanningSearchParams;
  locale: Locale;
  messages: PlanningMessages;
  canExport: boolean;
  formId: string;
  createVisit: ReactNode;
}) {
  const count = (tab: string) => workspace.countsAvailable
    ? workspace.counts[tab as keyof typeof workspace.counts]
    : null;
  const tabLabels: Record<string, string> = { ...messages.tabs };
  const rows = buildPlanningVisitViews(
    workspace.rows,
    workspace.lastUpdates,
    locale,
    {
      tabs: tabLabels,
      noValue: messages.table.noValue,
      notConfigured: messages.table.notConfigured,
      referenceUnavailable: messages.table.referenceUnavailable,
    },
    workspace.visitTypes,
    workspace.priorities,
  );
  const hasFilters = Boolean(params.search) || params.tab !== "all"
    || Object.values(params.filters).some(Boolean);
  const tabs = ["all", "draft", "pending_supervision", "published", "returned", "cancelled", "expired"].map(tab => {
    const tabCount = workspace.countsAvailable ? count(tab) : null;
    if (tab === "all") return { value: "", label: messages.toolbar.status };
    return {
      value: tab,
      label: tabCount === null ? tabLabels[tab] : `${tabLabels[tab]} · ${tabCount}`,
    };
  });
  return (
    <div className={styles.root}>
      <VisitViewNavigation active="list" basePath="/planning" ariaLabel={messages.views.aria} labels={messages.views} />
      <PlanningHeader
        title={messages.title}
        actionsLabel={messages.header.actionsAria}
        refresh={{ label: messages.header.refresh, busyLabel: messages.header.refreshing }}
        exporting={{
          label: messages.header.export,
          busyLabel: messages.header.exporting,
          unauthorized: messages.header.exportUnauthorized,
          unavailable: messages.header.exportUnavailable,
          cappedNote: messages.header.exportCapped,
        }}
        savedViews={messages.savedViews}
        params={params}
        canExport={canExport}
        createVisit={createVisit}
      />
      <PlanningAssistant strings={messages.assistant} />
      <PlanningBuckets
        strings={messages.buckets}
        counts={{
          draft: count("draft"),
          returned: count("returned"),
          published: count("published"),
          expired: count("expired"),
        }}
        activeTab={params.tab}
        hrefFor={tab => planningHref(sp, { tab, page: "" })}
      />
      <PlanningToolbar
        strings={messages.toolbar}
        options={{
          tabs,
          visitTypes: workspace.visitTypes,
          priorities: workspace.priorities,
          inspectors: workspace.inspectors,
          regions: workspace.regions,
          cities: workspace.cities,
          methods: PLANNING_METHODS.map(value => ({ value, label: messages.methods[value] })),
          sortKeys: Object.keys(messages.toolbar.sort),
        }}
        params={params}
        formId={formId}
        locale={locale}
        hasFilters={hasFilters}
      />
      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState icon="calendar" title={messages.emptyStates.filteredTitle} description={messages.emptyStates.filteredBody} />
        ) : (
          <EmptyState
            icon="calendar"
            title={messages.emptyStates.noneTitle}
            description={workspace.total > 0
              ? fill(messages.emptyStates.noneWithTotal, { total: workspace.total })
              : messages.emptyStates.noneBody}
          />
        )
      ) : (
        <>
          <PlanningVisitTable rows={rows} strings={messages.table} bulkBar={messages.bulkBar} drawer={messages.drawer} />
          <div className={styles.pager}>
            <span className={styles.pagerSummary}>
              {fill(messages.pagination.summary, {
                shown: rows.length, total: workspace.total, page: workspace.page, pages: workspace.totalPages,
              })}
            </span>
            <span className={styles.pagerLinks}>
              {workspace.page > 1 ? (
                <a className={styles.pagerLink} href={planningHref(sp, { page: String(workspace.page - 1) })}>
                  {messages.pagination.previous}
                </a>
              ) : null}
              {workspace.page < workspace.totalPages ? (
                <a className={styles.pagerLink} href={planningHref(sp, { page: String(workspace.page + 1) })}>
                  {messages.pagination.next}
                </a>
              ) : null}
            </span>
          </div>
        </>
      )}
      <PlanningDrafts
        drafts={workspace.drafts}
        strings={messages.drafts}
        methods={{ ...messages.methods }}
        referenceUnavailable={messages.table.referenceUnavailable}
        noValue={messages.table.noValue}
        locale={locale}
        viewerId={workspace.viewerId}
      />
    </div>
  );
}
