export interface ToastProps {
  tone?: "success" | "critical" | "info" | "warning";
  title: string;
  onDismiss?: () => void;
  children?: React.ReactNode;
}
