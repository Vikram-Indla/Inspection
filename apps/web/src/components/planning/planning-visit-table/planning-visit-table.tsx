"use client";

import { useState, type MouseEvent } from "react";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { PlanningVisitView } from "@/features/planning/view";
import BulkBar, { type BulkBarStrings } from "./bulk-bar";
import VisitDrawer, { type VisitDrawerStrings } from "./visit-drawer";
import styles from "./planning-visit-table.module.css";

export type PlanningTableStrings = {
  caption: string;
  columns: Record<string, string>;
  selectAll: string;
  selectRow: string;
  openRow: string;
};

const COLUMN_KEYS = [
  "visitId", "factory", "cr", "license", "visitType",
  "window", "inspector", "priority", "status", "lastUpdated",
] as const;

export default function PlanningVisitTable({ rows, strings, bulkBar, drawer }: {
  rows: PlanningVisitView[];
  strings: PlanningTableStrings;
  bulkBar: BulkBarStrings;
  drawer: VisitDrawerStrings;
}) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const toggleAll = () => setSelected(allSelected ? [] : rows.map(row => row.id));
  const toggleOne = (id: string) => setSelected(current =>
    current.includes(id) ? current.filter(entry => entry !== id) : [...current, id]);
  const openRow = (event: MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((event.target as HTMLElement).closest("a, button, input, label")) return;
    setOpenId(id);
  };
  const openVisit = rows.find(row => row.id === openId) ?? null;

  return (
    <div className={styles.root}>
      {selected.length > 0 ? (
        <BulkBar count={selected.length} strings={bulkBar} onClear={() => setSelected([])} />
      ) : null}
      <div className={styles.scroll}>
        <table className={styles.table} data-testid="planning-visit-table">
          <caption className={styles.caption}>{strings.caption}</caption>
          <thead>
            <tr>
              <th className={styles.head} scope="col" data-width="min">
                <input
                  className={styles.check}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={strings.selectAll}
                />
              </th>
              {COLUMN_KEYS.map(key => (
                <th className={styles.head} scope="col" key={key}>{strings.columns[key]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                className={styles.row}
                data-selected={selected.includes(row.id) ? "" : undefined}
                onClick={event => openRow(event, row.id)}
                key={row.id}
              >
                <td className={styles.cell}>
                  <input
                    className={styles.check}
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggleOne(row.id)}
                    aria-label={strings.selectRow.replace("{ref}", row.reference)}
                  />
                </td>
                <td className={styles.cell}>
                  <button
                    className={styles.reference}
                    type="button"
                    onClick={() => setOpenId(row.id)}
                    aria-label={strings.openRow.replace("{ref}", row.reference)}
                  >
                    {row.reference}
                  </button>
                </td>
                <td className={styles.cell}>{row.factory}</td>
                <td className={styles.cell} data-numeric="">{row.cr}</td>
                <td className={styles.cell} data-numeric="">{row.license}</td>
                <td className={styles.cell}>{row.visitType}</td>
                <td className={styles.cell} data-numeric="">{row.window}</td>
                <td className={styles.cell}>{row.inspector}</td>
                <td className={styles.cell}>{row.priority}</td>
                <td className={styles.cell}>
                  <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                </td>
                <td className={styles.cell} data-numeric="">{row.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {openVisit ? <VisitDrawer visit={openVisit} strings={drawer} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
