"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Heading, Text } from "@/components/saqeel/type";
import ExecutionCalendar from "@/components/sections/execution/execution-calendar/execution-calendar";
import ExecutionEmptyState from "@/components/sections/execution/execution-empty-state/execution-empty-state";
import ExecutionRescheduleDialog from "@/components/sections/execution/execution-reschedule-dialog/execution-reschedule-dialog";
import ExecutionTable from "@/components/sections/execution/execution-table/execution-table";
import ExecutionToolbar from "@/components/sections/execution/execution-toolbar/execution-toolbar";
import ExecutionVisitDialog from "@/components/sections/execution/execution-visit-dialog/execution-visit-dialog";
import { loadExecutionVisitDetail } from "@/app/(app)/execution/actions";
import type { ExecutionVisitDetailRead } from "@/app/(app)/execution/read-model";
import { buildLabels } from "@/features/execution/labels";
import { executionMessages } from "@/features/execution/strings";
import type {
  CalendarMode, ExecutionFilters, ExecutionRow, ExecutionView, FilterKey, RescheduleRequest,
} from "@/features/execution/types";
import {
  dayKey, filterOptions, filterRows, hasActiveFilters, markersOf, missingCoordinateCount, scopeRows, startOfWeek,
} from "@/features/execution/view";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./execution-workspace.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function ExecutionWorkspace({
  rows, currentUserId, locale, totalVisibleRows, omittedRows, nowMs,
}: {
  rows: readonly ExecutionRow[];
  currentUserId: string;
  locale: Locale;
  totalVisibleRows: number;
  omittedRows: number;
  nowMs: number;
}) {
  const messages = executionMessages(locale);
  const labels = useMemo(() => buildLabels(locale), [locale]);
  const weekStart = useMemo(() => startOfWeek(nowMs), [nowMs]);
  const todayKey = useMemo(() => dayKey(nowMs), [nowMs]);

  const [view, setView] = useState<ExecutionView>("mine");
  const [mode, setMode] = useState<CalendarMode>("week");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ExecutionFilters>({});
  const [selected, setSelected] = useState<ExecutionRow | null>(null);
  const [detail, setDetail] = useState<ExecutionVisitDetailRead | null>(null);
  const [reschedule, setReschedule] = useState<RescheduleRequest | null>(null);
  const requestRef = useRef(0);

  const scoped = scopeRows(rows, view, currentUserId);
  const visible = filterRows(scoped, query, filters);
  const options = filterOptions(scoped);
  const active = hasActiveFilters(query, filters);
  const missing = missingCoordinateCount(visible);

  const openVisit = (row: ExecutionRow) => {
    const request = requestRef.current + 1;
    requestRef.current = request;
    setSelected(row);
    setDetail(null);
    void loadExecutionVisitDetail(row.id).then(loaded => {
      if (requestRef.current !== request) return;
      setSelected(current => current?.id === row.id && loaded.status === "ok" ? loaded.visit : current);
      setDetail(loaded);
    });
  };

  const clearFilters = () => {
    setFilters({});
    setQuery("");
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Heading level={1}>{messages.title}</Heading>
        <nav className={styles.journey} aria-label={messages.journey.label}>
          <Button variant="secondary" size="sm" href="/operations" label={messages.journey.operations}>
            {messages.journey.operations}
          </Button>
          <Button variant="secondary" size="sm" href="/operations/live" label={messages.journey.live}>
            {messages.journey.live}
          </Button>
          <Button variant="secondary" size="sm" href="/reviews" label={messages.journey.reviews}>
            {messages.journey.reviews}
          </Button>
        </nav>
      </div>

      {totalVisibleRows > rows.length ? (
        <EmptyState variant="inline" tone="info" icon="risk"
          title={messages.notice.boundedTitle}
          description={fill(messages.notice.boundedBody, {
            shown: labels.count(rows.length), total: labels.count(totalVisibleRows),
          })} />
      ) : null}

      {omittedRows ? (
        <EmptyState variant="inline" tone="warning" icon="risk"
          title={messages.notice.degradedTitle}
          description={omittedRows === 1
            ? messages.notice.degradedBodyOne
            : fill(messages.notice.degradedBody, { count: labels.count(omittedRows) })} />
      ) : null}

      <ExecutionCalendar rows={visible} weekStart={weekStart} todayKey={todayKey} mode={mode} onModeChange={setMode}
        onOpen={openVisit} onReschedule={(row, date) => setReschedule({ row, date })}
        strings={messages.calendar} labels={labels} />

      <ExecutionToolbar view={view} onViewChange={setView} query={query} onQueryChange={setQuery}
        filters={filters} onFilterChange={(key: FilterKey, value) =>
          setFilters(previous => ({ ...previous, [key]: value || undefined }))}
        options={options} active={active} onClear={clearFilters}
        viewStrings={messages.view} filterStrings={messages.filters} labels={labels} />

      {view === "map" ? (
        <section className={styles.map}>
          {missing ? (
            <EmptyState variant="inline" tone="info" icon="map"
              title={messages.notice.coordinatesTitle}
              description={missing === 1
                ? messages.notice.coordinatesBodyOne
                : fill(messages.notice.coordinatesBody, { count: labels.count(missing) })} />
          ) : null}
          <Text tone="muted">{messages.map.note}</Text>
          {markersOf(visible).length ? (
            <div className={styles.mapCanvas}>
              <GeoMap center={[23.8859, 45.0792]} zoom={5} markers={markersOf(visible)}
                selectedId={selected?.id} fitMarkers height="100%" ariaLabel={messages.map.label}
                onMarkerClick={id => {
                  const row = visible.find(candidate => candidate.id === id);
                  if (row) openVisit(row);
                }} />
            </div>
          ) : (
            <EmptyState icon="map" title={messages.empty.mapTitle} description={messages.empty.mapBody} />
          )}
        </section>
      ) : visible.length ? (
        <ExecutionTable rows={visible} view={view} strings={messages.table}
          empty={{ title: messages.empty.filteredTitle }} labels={labels} onOpen={openVisit} />
      ) : (
        <ExecutionEmptyState filtered={active} total={labels.count(totalVisibleRows)}
          strings={messages.empty}
          clearAction={active ? (
            <Button variant="secondary" size="sm" label={messages.empty.filteredAction} onClick={clearFilters}>
              {messages.empty.filteredAction}
            </Button>
          ) : undefined} />
      )}

      {selected ? (
        <ExecutionVisitDialog row={selected} detail={detail} isMine={selected.inspectorId === currentUserId}
          strings={messages.detail} table={messages.table} labels={labels}
          onClose={() => setSelected(null)} />
      ) : null}

      {reschedule ? (
        <ExecutionRescheduleDialog request={reschedule} strings={messages.reschedule}
          labels={labels} onClose={() => setReschedule(null)} />
      ) : null}
    </div>
  );
}
