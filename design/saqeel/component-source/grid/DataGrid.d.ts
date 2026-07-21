/** @startingPoint section="Data" subtitle="Flagship operational grid — sort, select, expand, densities" viewport="700x380" */
export interface DataGridProps {
  columns?: Array<{
    id: string; header: React.ReactNode;
    /** custom cell renderer; defaults to row[id] */
    cell?: (row: any) => React.ReactNode;
    sortable?: boolean;
    /** sticky inline-start identifying column */
    pinned?: boolean;
    numeric?: boolean; truncate?: boolean;
    width?: number | string; align?: "start" | "end" | "center";
  }>;
  rows?: any[];
  rowKey?: (row: any, i: number) => string | number;
  selectable?: boolean;
  selected?: Set<any>;
  onSelect?: (keys: Set<any>) => void;
  /** multi-column sort: shift-click appends */
  sort?: Array<{ id: string; dir: "asc" | "desc" }>;
  onSort?: (sort: Array<{ id: string; dir: "asc" | "desc" }>) => void;
  density?: "comfortable" | "compact";
  /** search / filters / saved views / column controls / export slot */
  toolbar?: React.ReactNode;
  bulkActions?: React.ReactNode;
  expandRow?: (row: any) => React.ReactNode;
  expandedKeys?: Set<any>;
  onExpand?: (key: any) => void;
  rowActions?: (row: any) => React.ReactNode;
  onRowClick?: (row: any) => void;
  page?: number; pageCount?: number; onPage?: (p: number) => void; total?: number;
  loading?: boolean;
  error?: React.ReactNode;
  empty?: React.ReactNode;
  maxHeight?: number | string;
}
