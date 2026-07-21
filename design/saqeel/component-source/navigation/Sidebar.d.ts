/** @startingPoint section="Navigation" subtitle="Graphite application sidebar with groups, counts, collapse" viewport="700x320" */
export interface SidebarProps {
  brand?: string;
  brandMark?: React.ReactNode;
  collapsed?: boolean;
  groups?: Array<{ label?: string; items: Array<{ id: string; label: string; icon?: React.ReactNode; count?: number }> }>;
  activeId?: string;
  onNavigate?: (id: string) => void;
  footer?: React.ReactNode;
}
