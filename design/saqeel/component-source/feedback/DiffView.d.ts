export interface DiffViewProps {
  rows?: Array<{ field: string; before: React.ReactNode; after: React.ReactNode; meta?: string }>;
  /** present = conflict-resolution mode with per-row keep/accept */
  onKeep?: (row: any, choice: "before" | "after") => void;
}
