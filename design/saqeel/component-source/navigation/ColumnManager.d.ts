export interface ColumnManagerProps {
  columns?: Array<{ id: string; header: string; hidden?: boolean; pinned?: boolean }>;
  onChange?: (columns: any[]) => void;
}
