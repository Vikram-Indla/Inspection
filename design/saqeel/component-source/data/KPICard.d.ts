export interface KPICardProps {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaDirection?: "up" | "down";
  caption?: string;
  /** tint the value with a status colour when the number itself is a state */
  tone?: "critical" | "warning" | "compliant";
}
