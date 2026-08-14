"use client";

import Button from "@/components/saqeel/button/button";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Mono } from "@/components/saqeel/type";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import type { ExecutionRow, ExecutionView } from "@/features/execution/types";

const RISK_TONES: Record<string, StatusTone> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

export default function ExecutionTable({
  rows, view, strings, empty, labels, onOpen,
}: {
  rows: readonly ExecutionRow[];
  view: ExecutionView;
  strings: ExecutionMessages["table"];
  empty: { title: string; description?: string };
  labels: ExecutionLabels;
  onOpen: (row: ExecutionRow) => void;
}) {
  const shared: DataColumn<ExecutionRow>[] = [
    { key: "ref", header: strings.visitRef, isRowHeader: true, cell: row => <Mono>{row.visitReference}</Mono> },
    { key: "factory", header: strings.factory, cell: row => row.factory },
    { key: "window", header: strings.planningWindow, cell: row => <CellMuted>{labels.range(row.windowStart, row.windowEnd)}</CellMuted> },
    { key: "date", header: strings.executionDate, cell: row => labels.date(row.executionDate) },
    { key: "type", header: strings.visitType, cell: row => labels.enumLabel(row.visitType) },
    { key: "mode", header: strings.visitMode, cell: row => labels.enumLabel(row.visitMode) },
    {
      key: "risk",
      header: strings.risk,
      cell: row => (
        <StatusPill tone={row.risk ? RISK_TONES[row.risk] ?? "neutral" : "neutral"}>
          {labels.enumLabel(row.risk)}
        </StatusPill>
      ),
    },
  ];

  const allColumns: DataColumn<ExecutionRow>[] = [
    { key: "inspector", header: strings.inspector, cell: row => row.inspector ?? <CellMuted>{strings.unassigned}</CellMuted> },
    {
      key: "place",
      header: strings.regionCity,
      cell: row => {
        const place = [row.region, row.city].filter(Boolean).join(" · ");
        return place ? place : <CellMuted>{strings.notRecorded}</CellMuted>;
      },
    },
  ];

  const stateColumn: DataColumn<ExecutionRow> = {
    key: "state",
    header: strings.operationalState,
    cell: row => <StatusPill tone="info">{labels.enumLabel(row.operationalState)}</StatusPill>,
  };

  const mineColumns: DataColumn<ExecutionRow>[] = [
    { key: "prep", header: strings.preparation, cell: row => labels.enumLabel(row.planningStatus) },
    { key: "report", header: strings.reportType, cell: row => row.reportType ?? <CellMuted>{strings.notConfigured}</CellMuted> },
  ];

  const locationColumn: DataColumn<ExecutionRow> = {
    key: "coords",
    header: strings.locationData,
    cell: row => <CellMuted>{row.lat != null ? strings.coordinatesRecorded : strings.coordinatesMissing}</CellMuted>,
  };

  const actionColumn: DataColumn<ExecutionRow> = {
    key: "action",
    header: strings.action,
    align: "end",
    width: "min",
    cell: row => (
      <Button variant="tertiary" size="sm" label={strings.view} onClick={() => onOpen(row)}>
        {strings.view}
      </Button>
    ),
  };

  const columns = view === "all"
    ? [...shared, ...allColumns, stateColumn, locationColumn, actionColumn]
    : [...shared, stateColumn, ...mineColumns, actionColumn];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      caption={strings.caption}
      empty={{ title: empty.title, description: empty.description, icon: "search" }}
    />
  );
}
