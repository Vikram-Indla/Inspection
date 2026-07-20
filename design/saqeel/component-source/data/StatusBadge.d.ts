export interface StatusBadgeProps {
  /** fixed semantic meanings — see readme "Status semantics" */
  status?: "critical" | "major" | "warning" | "compliant" | "info" | "pending" | "draft" | "onhold" | "completed" | "disabled";
  dot?: boolean;
  /** custom label (e.g. Arabic); defaults to the canonical English label */
  children?: React.ReactNode;
}
