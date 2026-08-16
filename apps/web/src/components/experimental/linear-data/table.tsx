import type { ReactNode } from "react";
import { Text } from "@/components/experimental/linear";
import styles from "./table.module.css";

export type TableColumn<Row> = {
  key: string;
  header: string;
  numeric?: boolean;
  isRowHeader?: boolean;
  cell: (row: Row) => ReactNode;
};

export function EmptyBlock({ title, description }: { title: string; description?: string }) {
  return (
    <div className={styles.empty}>
      <Text role="body" tone="strong" weight="medium">{title}</Text>
      {description ? <Text role="caption" tone="muted">{description}</Text> : null}
    </div>
  );
}

export function DataTable<Row>({ caption, columns, rows, getRowId, empty }: {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  empty: { title: string; description?: string };
}) {
  if (rows.length === 0) return <EmptyBlock title={empty.title} description={empty.description} />;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col" className={column.numeric ? styles.numeric : undefined}>
                <Text role="caption" tone="muted" weight="medium" as="span">{column.header}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={getRowId(row)}>
              {columns.map(column => (
                column.isRowHeader ? (
                  <th key={column.key} scope="row">{column.cell(row)}</th>
                ) : (
                  <td key={column.key} className={column.numeric ? styles.numeric : undefined}>
                    {column.cell(row)}
                  </td>
                )
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
