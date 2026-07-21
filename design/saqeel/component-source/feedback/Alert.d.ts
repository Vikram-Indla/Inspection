export interface AlertProps {
  tone?: "critical" | "warning" | "info" | "success" | "immutable";
  title?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}
