import React from "react";

/* SAQEEL signature: Inspection Status Spine — lifecycle progression of one
   inspection. Canonical stages (subset per context). */
export const SPINE_STAGES: Record<string, string> = {
  assignment: "Assigned",
  scheduled: "Scheduled",
  enroute: "En route",
  arrived: "Arrived",
  inprogress: "Inspection in progress",
  findings: "Findings raised",
  corrective: "Corrective action",
  review: "Supervisor review",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
  onhold: "On hold",
  reopened: "Reopened",
};

const stateGlyph: Record<string, string> = { done: "✓", blocked: "!", overdue: "!", reopened: "↻" };

export interface StatusSpineStage {
  stage?: string;
  label?: string;
  state?: "done" | "current" | "pending" | "blocked" | "overdue" | "reopened";
  time?: string;
  actor?: string;
  note?: string;
}

export interface StatusSpineProps {
  stages?: StatusSpineStage[];
  orientation?: "vertical" | "horizontal";
  compact?: boolean;
}

export function StatusSpine({ stages = [], orientation = "vertical", compact }: StatusSpineProps) {
  const cls = "spine" + (orientation === "horizontal" ? " is-horizontal" : "") + (compact ? " is-compact" : "");
  return (
    <ol className={cls}>
      {stages.map((s, i) => {
        const state = s.state || "pending";
        const nodeCls =
          "spine-node" +
          (state === "done"
            ? " is-done"
            : state === "current"
              ? " is-current"
              : state === "blocked"
                ? " is-blocked"
                : state === "overdue"
                  ? " is-overdue"
                  : "");
        return (
          <li key={i} className={nodeCls} aria-current={state === "current" ? "step" : undefined}>
            <span className="spine-dot" aria-hidden="true">
              {stateGlyph[state] || ""}
            </span>
            <span className="spine-body">
              <span className="spine-title">{s.label || SPINE_STAGES[s.stage || ""] || s.stage}</span>
              {(s.time || s.actor) && <span className="spine-meta">{[s.actor, s.time].filter(Boolean).join(" · ")}</span>}
              {s.note && (
                <span className="spine-meta" style={{ color: "var(--text-secondary)" }}>
                  {s.note}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
