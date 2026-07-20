export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  width?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}
