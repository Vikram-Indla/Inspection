export interface SplitButtonProps {
  variant?: "primary" | "secondary" | "danger";
  onClick?: (e: any) => void;
  /** opens the overflow menu (menu itself supplied by the consumer) */
  onMenu?: (e: any) => void;
  menuLabel?: string;
  children?: React.ReactNode;
}
