import React from "react";

export type StatusRole =
  | "critical"
  | "major"
  | "warning"
  | "compliant"
  | "info"
  | "pending"
  | "draft"
  | "onhold"
  | "completed"
  | "disabled";

export const STATUS_LABELS: Record<StatusRole, string> = {
  critical: "Critical",
  major: "Major",
  warning: "Warning",
  compliant: "Compliant",
  info: "Informational",
  pending: "Pending",
  draft: "Draft",
  onhold: "On hold",
  completed: "Completed",
  disabled: "Inactive",
};

export interface StatusBadgeProps {
  /** fixed semantic meanings — the 10 canonical roles */
  status?: StatusRole;
  dot?: boolean;
  /** custom label (e.g. Arabic); defaults to the canonical English label */
  children?: React.ReactNode;
}

export function StatusBadge({ status = "pending", dot = true, children }: StatusBadgeProps) {
  return (
    <span className={"badge badge-" + status}>
      {dot && <i className="dot" aria-hidden="true" />}
      {children || STATUS_LABELS[status]}
    </span>
  );
}
