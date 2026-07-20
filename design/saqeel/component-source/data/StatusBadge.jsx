import React from "react";
export const STATUS_LABELS = { critical: "Critical", major: "Major", warning: "Warning", compliant: "Compliant", info: "Informational", pending: "Pending", draft: "Draft", onhold: "On hold", completed: "Completed", disabled: "Inactive" };
export function StatusBadge({ status = "pending", dot = true, children }) {
  return (
    <span className={"badge badge-" + status}>
      {dot && <i className="dot" aria-hidden="true" />}
      {children || STATUS_LABELS[status]}
    </span>
  );
}