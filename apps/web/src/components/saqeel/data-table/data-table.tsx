import { type ReactNode } from "react";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import styles from "./data-table.module.css";

export type DataColumn<T> = {
  readonly key: string;
  readonly header: string;
  readonly cell: (row: T) => ReactNode;
  readonly align?: "start" | "end";
  readonly width?: "min" | "auto" | "grow";
  readonly isRowHeader?: boolean;
  readonly numeric?: boolean;
};

export type DataTableEmpty = {
  readonly title: string;
  readonly description?: string;
  readonly icon?: IconName;
};

// `bleed` defaults on because every table in this app sits inside a card
// body: pulling the table out to the card edge is what lines its first
// column up with the card heading, and lets the row hover fill reach the
// card edge instead of floating inside a 24px gutter. Pass bleed={false}
// for a table that does not own the full width of its card body.
export default function DataTable<T>({ rows, columns, getRowId, caption, empty, density = "default", bleed = true }: {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  getRowId: (row: T) => string;
  caption?: string;
  empty: DataTableEmpty;
  density?: "compact" | "default";
  bleed?: boolean;
}) {
  if (!rows.length) {
    return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} size="sm" />;
  }

  return (
    <div className={styles.scroll} data-bleed={bleed ? "" : undefined}>
      <table className={styles.table} data-density={density}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map(column => (
              <th
                className={styles.head}
                key={column.key}
                scope="col"
                data-align={column.align ?? "start"}
                data-width={column.width ?? "auto"}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr className={styles.row} key={getRowId(row)}>
              {columns.map(column => column.isRowHeader ? (
                <th
                  className={styles.rowHead}
                  key={column.key}
                  scope="row"
                  data-label={column.header}
                  data-align={column.align ?? "start"}
                >
                  {column.cell(row)}
                </th>
              ) : (
                <td
                  className={styles.cell}
                  key={column.key}
                  data-label={column.header}
                  data-align={column.align ?? "start"}
                  data-numeric={column.numeric ? "" : undefined}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
