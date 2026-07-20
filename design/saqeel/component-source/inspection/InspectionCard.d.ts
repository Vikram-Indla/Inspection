export interface InspectionCardProps {
  id: string;
  facility: string;
  type?: string;
  status?: string;
  /** localized label; defaults to the status token name */
  statusLabel?: string;
  inspector?: string;
  due?: string;
  /** colour the due text when overdue/near-due */
  dueTone?: "critical" | "warning";
  variant?: "summary" | "assignment" | "queue";
  selected?: boolean;
  onOpen?: () => void;
}
