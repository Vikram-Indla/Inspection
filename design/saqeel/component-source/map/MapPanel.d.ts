export interface MapPanelProps {
  title?: React.ReactNode;
  /** inline-start or inline-end edge (RTL-aware) */
  position?: "start" | "end";
  width?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}
