export interface DrawerProps {
  open?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}
