import React from "react";
/* SAQEEL signature: Operational Exception Rail — one severity/exception
   language everywhere: distinct SHAPE + colour + label per state, plus a
   4px table rail. Never colour alone. */
export const EXC_LABELS = { critical: "Critical", major: "Major", warning: "Warning", pending: "Pending", onhold: "On hold", info: "Informational", compliant: "Compliant", completed: "Completed", disabled: "Inactive" };
export function ExceptionMark({ tone = "info", label, hideLabel }) {
  return (
    <span className={"exc exc-" + tone}>
      <i className="exc-mark" aria-hidden="true"></i>
      {!hideLabel && (label || EXC_LABELS[tone])}
      {hideLabel && <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{label || EXC_LABELS[tone]}</span>}
    </span>
  );
}
/* Table rail cell: <td className="rail-td"><RailCell tone="critical"/></td> */
export function RailCell({ tone }) {
  return <i style={{ display: "block", width: 4, height: "100%", background: tone ? "var(--status-" + tone + ")" : "transparent" }} aria-hidden="true" />;
}