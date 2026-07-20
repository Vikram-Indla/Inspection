/** Data table (V4.1) — sort buttons managing aria-sort, caption API, unique row-selection names, indeterminate select-all, per-row failure states (P03).
 * @startingPoint section="Data" subtitle="Enterprise data table" viewport="700x320" */
export interface DataTableColumn<Row = any> {
  key: string;
  label: React.ReactNode;
  render?: (row: Row) => React.ReactNode;
  numeric?: boolean;
  sortable?: boolean;
  sort?: "ascending" | "descending";
}
export interface DataTableProps<Row = any> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** Screen-reader table caption (purpose + units) */
  caption?: string;
  selectable?: boolean;
  rowKey?: (row: Row, index: number) => string | number;
  /** Row identity used in each selection checkbox's accessible name */
  rowLabel?: (row: Row) => string;
  rowState?: (row: Row) => string | undefined;
  onSelectionChange?: (keys: (string | number)[]) => void;
  onSort?: (key: string, direction: "ascending" | "descending") => void;
  className?: string;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
