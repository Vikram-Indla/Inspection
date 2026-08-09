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
import type { PlanningListParams } from "@/lib/planning/visit-list";
import { fill, type Messages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./planning-screen.module.css";

type PlanningMessages = Messages["planning"];

export default function PlanningScreen({ workspace, params, sp, locale, messages, canExport, canCreate, canApprove, formId, createVisit }: {
  workspace: Extract<PlanningWorkspace, { ok: true }>;
  params: PlanningListParams;
  sp: PlanningSearchParams;
  locale: Locale;
  messages: PlanningMessages;
  canExport: boolean;
  canCreate: boolean;
  canApprove: boolean;
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
    { tabs: tabLabels, empty: messages.table.empty, referenceUnavailable: messages.table.referenceUnavailable },
    workspace.visitTypes,
    workspace.priorities,
  );
  const hasFilters = Boolean(params.search) || params.tab !== "all"
    || Object.values(params.filters).some(Boolean);
  const tabs = ["all", "draft", "pending_supervision", "published", "returned", "cancelled", "expired"].map(tab => ({
    value: tab === "all" ? "" : tab,
    label: workspace.countsAvailable
      ? `${tabLabels[tab]} · ${count(tab) ?? messages.table.empty}`
      : tabLabels[tab],
  }));
  const related = [
    { href: "/planning/plans", label: messages.related.plans },
    { href: "/tasks", label: messages.related.tasks },
    ...(canApprove ? [{ href: "/planning/supervision", label: messages.related.supervision }] : []),
    { href: "/visits", label: messages.related.visits },
  ];

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
      <PlanningAssistant
        strings={messages.assistant}
        counts={{ returned: count("returned"), draft: count("draft") }}
        canCreate={canCreate}
      />
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
        empty={messages.table.empty}
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
          methods: Object.entries(messages.methods).map(([value, label]) => ({ value, label })),
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
        empty={messages.table.empty}
        locale={locale}
        viewerId={workspace.viewerId}
      />
      <nav className={styles.related} aria-label={messages.related.aria}>
        {related.map(link => (
          <a className={styles.relatedLink} href={link.href} key={link.href}>{link.label}</a>
        ))}
      </nav>
    </div>
  );
}
