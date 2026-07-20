export interface FilterBarProps {
  filters?: Array<{ id: string; label: string; value?: string }>;
  onOpenFilter?: (id: string) => void;
  onClearFilter?: (id: string) => void;
  savedViews?: Array<{ id: string; label: string }>;
  activeView?: string;
  onView?: (id: string) => void;
  onSaveView?: () => void;
  /** opens the advanced builder (FilterRule rows in a Drawer) */
  onAdvanced?: () => void;
}
