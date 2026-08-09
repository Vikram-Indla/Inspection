"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Icon from "@/components/saqeel/icon/icon";
import type { VisitBoardRow } from "@/features/visits/rows";
import type { VisitsBoardStrings } from "@/features/visits/board-strings";
import styles from "./visit-board.module.css";

export default function VisitTable({ rows, selected, activeId, strings, onToggleRow, onToggleAll, onPreview }: {
  rows: readonly VisitBoardRow[];
  selected: ReadonlySet<string>;
  activeId: string | null;
  strings: VisitsBoardStrings;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onPreview: (id: string) => void;
}) {
  const allSelected = rows.length > 0 && rows.every(row => selected.has(row.id));
  const fill = (template: string, value: string) => template.replace("{id}", value);

  const columns: DataColumn<VisitBoardRow>[] = [
    {
      key: "select",
      header: strings.selectAll,
      width: "min",
      headerControl: (
        <input className={styles.check} type="checkbox" checked={allSelected}
          onChange={onToggleAll} aria-label={strings.selectAll} />
      ),
      cell: row => (
        <input className={styles.check} type="checkbox" checked={selected.has(row.id)}
          onChange={() => onToggleRow(row.id)} aria-label={fill(strings.selectRow, row.selectionLabel)} />
      ),
    },
    {
      key: "visit",
      header: strings.colVisit,
      isRowHeader: true,
      cell: row => (
        <span className={styles.visitCell}>
          <span className={styles.visitLead}>
            <button type="button" className={styles.preview} onClick={() => onPreview(row.id)}
              aria-pressed={row.id === activeId} aria-label={fill(strings.preview, row.selectionLabel)}>
              <bdi>{row.reference}</bdi>
            </button>
            <CellLink href={row.href}>
              <Icon name="externalLink" size="sm" label={fill(strings.openDetail, row.selectionLabel)} />
            </CellLink>
          </span>
          {row.planLabel ? <CellMuted>{row.planLabel}</CellMuted> : null}
        </span>
      ),
    },
    {
      key: "factory",
      header: strings.colFactory,
      cell: row => (
        <span className={styles.stackCell}>
          <span dir="auto">{row.factoryName}</span>
          {row.factoryIdentifiers ? <CellMuted>{row.factoryIdentifiers}</CellMuted> : null}
        </span>
      ),
    },
    { key: "typeMode", header: strings.colTypeMode, cell: row => `${row.typeLabel} · ${row.modeLabel}` },
    {
      key: "planning",
      header: strings.colPlanning,
      cell: row => <StatusPill tone={row.planningTone}>{row.planningLabel}</StatusPill>,
    },
    {
      key: "operational",
      header: strings.colOperational,
      cell: row => <StatusPill tone={row.operationalTone}>{row.operationalLabel}</StatusPill>,
    },
    { key: "inspector", header: strings.colInspector, cell: row => row.inspectorName },
    {
      key: "window",
      header: strings.colWindow,
      numeric: true,
      cell: row => <CellTime dateTime={row.windowStartIso}>{row.windowStart}</CellTime>,
    },
  ];

  return (
    <Card as="section" labelledBy="visit-table-heading">
      <CardHeader level="h2" titleId="visit-table-heading" title={strings.caption} />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          getRowSelected={row => selected.has(row.id)}
          empty={{ icon: "calendar", title: strings.noMatchTitle, description: strings.noMatchBody }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
