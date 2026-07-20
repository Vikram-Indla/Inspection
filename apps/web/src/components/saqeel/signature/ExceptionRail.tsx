import React from "react";

/* SAQEEL signature: Operational Exception Rail — one severity/exception
   language everywhere: distinct SHAPE + colour + label per state, plus a
   4px table rail. Never colour alone. */

export type ExceptionTone =
  | "critical"
  | "major"
  | "warning"
  | "pending"
  | "onhold"
  | "info"
  | "compliant"
  | "completed"
  | "disabled";

export const EXC_LABELS: Record<ExceptionTone, string> = {
  critical: "Critical",
  major: "Major",
  warning: "Warning",
  pending: "Pending",
  onhold: "On hold",
  info: "Informational",
  compliant: "Compliant",
  completed: "Completed",
  disabled: "Inactive",
};

export interface ExceptionMarkProps {
  tone?: ExceptionTone;
  label?: string;
  /** icon-only contexts (map, dense tables) — keeps a screen-reader label */
  hideLabel?: boolean;
}

export function ExceptionMark({ tone = "info", label, hideLabel }: ExceptionMarkProps) {
  return (
    <span className={"exc exc-" + tone}>
      <i className="exc-mark" aria-hidden="true" />
      {!hideLabel && (label || EXC_LABELS[tone])}
      {hideLabel && <span className="sr-only">{label || EXC_LABELS[tone]}</span>}
    </span>
  );
}

export interface RailCellProps {
  tone?: ExceptionTone;
}

/* Table rail cell: <td className="rail-td"><RailCell tone="critical"/></td> */
export function RailCell({ tone }: RailCellProps) {
  return (
    <i
      style={{
        display: "block",
        width: 4,
        height: "100%",
        background: tone ? "var(--status-" + tone + ")" : "transparent",
      }}
      aria-hidden="true"
    />
  );
}
