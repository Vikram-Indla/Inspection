/** Modal — accessible title/description relationships, mandatory close, Escape, focus trap + restore. Governed confirmations restate version + scope + mandatory reason. */
export interface ModalProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}
export declare function Modal(props: ModalProps): JSX.Element;
