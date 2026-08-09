import Stack from "@/components/saqeel/stack/stack";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Button from "@/components/saqeel/button/button";
import VisitScopeBar from "@/components/sections/visits/visit-scope-bar/visit-scope-bar";
import VisitStatusTiles from "@/components/sections/visits/visit-status-tiles/visit-status-tiles";
import VisitFilterBar from "@/components/sections/visits/visit-filter-bar/visit-filter-bar";
import VisitBoard from "@/components/sections/visits/visit-board/visit-board";
import { getMessages, fill } from "@/i18n/messages";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum, sentenceCase } from "@/lib/text";
import type { PlanningListParams, PlanningTab } from "@/lib/planning/visit-list";
import { visitHref, hasActiveVisitFilters, VISIT_PAGE_MAX, type VisitRouteBase, type VisitSearchParams } from "@/features/visits/params";
import { toVisitBoardRow } from "@/features/visits/rows";
import { buildVisitsBoardStrings } from "@/features/visits/board-strings";
import {
  buildVisitSelectOptions, buildVisitStatusTiles, buildVisitFilterChips, VISIT_ADVANCED_KEYS,
} from "@/features/visits/filters";
import type { VisitManagementData } from "@/features/visits/queries";

export default async function VisitManagementScreen({ data, params, sp, routeBase, planningHref, aiPanel }: {
  data: VisitManagementData;
  params: PlanningListParams;
  sp: VisitSearchParams;
  routeBase: VisitRouteBase;
  planningHref: string | null;
  aiPanel?: React.ReactNode;
}) {
  const { t, locale } = await useT();
  const { visit } = getMessages(locale).planning;
  const enumLabel = (value: string) => sentenceCase(t(`enum.${value}`, humaniseEnum(value)));
  const statusLabel = (tab: PlanningTab) => (tab === "all" ? visit.filter.allStatuses : enumLabel(tab));
  const now = Date.now();

  const rows = data.rows.map(row => toVisitBoardRow(row, routeBase, now, {
    enumLabel,
    formatDateTime: iso => formatDateTime(iso, locale),
    expired: enumLabel("expired"),
    campaign: visit.table.campaign,
    plan: visit.table.plan,
    referenceUnavailable: visit.table.referenceUnavailable,
    missing: "—",
  }));

  const messages = {
    allStatuses: visit.filter.allStatuses, allTypes: visit.filter.allTypes, allModes: visit.filter.allModes,
    allRegions: visit.filter.allRegions, allCities: visit.filter.allCities,
    status: visit.filter.status, type: visit.filter.type, mode: visit.filter.mode,
    region: visit.filter.region, city: visit.filter.city, window: visit.filter.window,
    searchLabel: visit.filter.searchLabel, sortLabels: getMessages(locale).planning.filter.sort,
  };
  const options = buildVisitSelectOptions(data, locale, messages, statusLabel, data.countsAvailable, data.counts);
  const optionLabel = (key: (typeof VISIT_ADVANCED_KEYS)[number], value: string) => {
    const source = key === "visitType" ? options.visitTypeOptions
      : key === "executionMode" ? options.modeOptions
        : key === "region" ? options.regionOptions : options.cityOptions;
    return source.find(option => option.value === value)?.label ?? value;
  };
  const advancedCount = VISIT_ADVANCED_KEYS.filter(key => Boolean(params.filters[key])).length;
  const nextLimit = rows.length < data.total && params.pageSize < VISIT_PAGE_MAX
    ? Math.min(params.pageSize * 2, VISIT_PAGE_MAX)
    : null;

  return (
    <Stack gap="default">
      <VisitScopeBar
        basePath={routeBase}
        planningHref={planningHref}
        scope={fill(visit.scope, { shown: rows.length, total: data.total })}
        strings={{
          aria: visit.title, viewsAria: visit.views.aria, list: visit.views.list,
          calendar: visit.views.calendar, workload: visit.views.workload, map: visit.views.map,
          planningLink: visit.planningLink,
        }}
      />

      {aiPanel}

      <VisitStatusTiles
        tiles={buildVisitStatusTiles(routeBase, sp, params, data.counts, data.countsAvailable, statusLabel)}
        strings={{
          groupLabel: visit.filter.statusCounts,
          unavailable: visit.filter.countsUnavailable,
          activeNote: visit.filter.activeFilters,
        }}
      />

      <VisitFilterBar
        locale={locale}
        action={routeBase}
        strings={{
          aria: visit.filter.aria, searchLabel: visit.filter.searchLabel,
          searchPlaceholder: visit.filter.searchPlaceholder, status: visit.filter.status,
          type: visit.filter.type, mode: visit.filter.mode, region: visit.filter.region,
          city: visit.filter.city, window: visit.filter.window, windowEmpty: visit.filter.windowEmpty,
          sortLabel: visit.filter.sortLabel, more: visit.filter.more, apply: visit.filter.apply,
          clearAll: visit.filter.clearAll, activeFilters: visit.filter.activeFilters,
          removeFilter: visit.filter.removeFilter,
          from: getMessages(locale).planning.filter.from, to: getMessages(locale).planning.filter.to,
          pickStart: getMessages(locale).planning.filter.pickStart, pickEnd: getMessages(locale).planning.filter.pickEnd,
          reset: getMessages(locale).planning.filter.reset,
          previousMonth: getMessages(locale).planning.filter.previousMonth,
          nextMonth: getMessages(locale).planning.filter.nextMonth,
        }}
        search={params.search}
        tab={params.tab === "all" ? "" : params.tab}
        statusOptions={options.statusOptions}
        visitType={params.filters.visitType ?? ""}
        visitTypeOptions={options.visitTypeOptions}
        mode={params.filters.executionMode ?? ""}
        modeOptions={options.modeOptions}
        region={params.filters.region ?? ""}
        regionOptions={options.regionOptions}
        city={params.filters.city ?? ""}
        cityOptions={options.cityOptions}
        windowFrom={params.filters.windowFrom ?? ""}
        windowTo={params.filters.windowTo ?? ""}
        datePresets={[]}
        sort={params.sort}
        sortOptions={Object.entries(messages.sortLabels).map(([value, label]) => ({ value, label }))}
        advancedCount={advancedCount}
        chips={buildVisitFilterChips(routeBase, sp, params, messages, statusLabel, optionLabel)}
        clearHref={routeBase}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={hasActiveVisitFilters(params) ? visit.state.noMatchTitle : visit.state.emptyTitle}
          description={hasActiveVisitFilters(params) ? visit.state.noMatchBody : visit.state.emptyBody}
          action={<Button variant="secondary" href={hasActiveVisitFilters(params) ? routeBase : "/planning"}>
            {hasActiveVisitFilters(params) ? visit.filter.clearAll : visit.state.emptyAction}
          </Button>}
        />
      ) : (
        <VisitBoard
          rows={rows}
          inspectors={data.inspectors}
          reassignmentAvailable={data.reassignmentAvailable}
          visitTypeOptions={options.visitTypeOptions.filter(option => option.value.length > 0)}
          total={data.total}
          shown={rows.length}
          nextHref={nextLimit === null ? null : visitHref(routeBase, sp, { limit: String(nextLimit) })}
          strings={buildVisitsBoardStrings(locale)}
          routeBase={routeBase}
        />
      )}
    </Stack>
  );
}
