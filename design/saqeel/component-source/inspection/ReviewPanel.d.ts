export interface ReviewPanelProps {
  /** what is being decided — counts, compliance score, key findings */
  summary?: React.ReactNode;
  onApprove?: () => void;
  /** disabled until a reason is entered */
  onReject?: () => void;
  onEscalate?: () => void;
  reason?: string;
  onReason?: (v: string) => void;
  /** terminal state replaces the controls */
  decision?: "approved" | "rejected" | "escalated";
  busy?: boolean;
}
