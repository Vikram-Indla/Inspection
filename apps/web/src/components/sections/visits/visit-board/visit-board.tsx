"use client";
import { useMemo, useState } from "react";
import Stack from "@/components/saqeel/stack/stack";
import Button from "@/components/saqeel/button/button";
import type { VisitBoardRow } from "@/features/visits/rows";
import type { VisitsBoardStrings } from "@/features/visits/board-strings";
import type { VisitReassignmentInspector } from "@/features/visits/queries";
import VisitSpine from "./visit-spine";
import VisitTable from "./visit-table";
import VisitBulkActions from "./visit-bulk-actions";
import type { DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import styles from "./visit-board.module.css";

export default function VisitBoard({ rows, inspectors, reassignmentAvailable, visitTypeOptions, total, shown, nextHref, strings, routeBase, locale, datePresets, monthLabels }: {
  rows: readonly VisitBoardRow[];
  inspectors: readonly VisitReassignmentInspector[];
  reassignmentAvailable: boolean;
  visitTypeOptions: readonly { readonly value: string; readonly label: string }[];
  total: number;
  shown: number;
  locale: "ar" | "en";
  datePresets: readonly DateRangePreset[];
  monthLabels: { previous: string; next: string };
  nextHref: string | null;
  strings: VisitsBoardStrings;
  routeBase: string;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedRows = useMemo(
    () => rows.filter(row => selected.has(row.id)),
    [rows, selected],
  );
  const activeVisit = activeId === null ? null : rows.find(row => row.id === activeId) ?? null;

  const toggleRow = (id: string) => setSelected(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(previous => {
    const allSelected = rows.length > 0 && rows.every(row => previous.has(row.id));
    return allSelected ? new Set<string>() : new Set(rows.map(row => row.id));
  });

  return (
    <Stack gap="default">
      <VisitSpine visit={activeVisit} strings={strings} />

      {selectedRows.length > 0 ? (
        <VisitBulkActions
          selectedRows={selectedRows}
          inspectors={inspectors}
          reassignmentAvailable={reassignmentAvailable}
          visitTypeOptions={visitTypeOptions}
          strings={strings}
          routeBase={routeBase}
          locale={locale}
          datePresets={datePresets}
          monthLabels={monthLabels}
          onClearSelection={() => setSelected(new Set())}
        />
      ) : null}

      <VisitTable
        rows={rows}
        selected={selected}
        activeId={activeId}
        strings={strings}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onPreview={setActiveId}
      />

      <div className={styles.footer}>
        <span className={styles.count}>
          {strings.showing.replace("{shown}", String(shown)).replace("{total}", String(total))}
        </span>
        {nextHref ? <Button variant="tertiary" href={nextHref}>{strings.loadMore}</Button> : null}
      </div>
    </Stack>
  );
}
