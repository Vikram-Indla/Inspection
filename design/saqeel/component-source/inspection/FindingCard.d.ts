export interface FindingCardProps {
  kind?: "finding" | "violation" | "corrective";
  refCode?: string;
  severity?: "critical" | "major" | "warning" | "info";
  title: string;
  description?: string;
  /** the regulation clause this maps to */
  requirement?: string;
  due?: string;
  evidenceCount?: number;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}
