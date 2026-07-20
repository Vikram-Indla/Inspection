"use client";
import React from "react";

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

/* Supervisor decision panel — approve / reject / escalate in one component. */
export function ReviewPanel({
  summary,
  onApprove,
  onReject,
  onEscalate,
  reason,
  onReason,
  decision,
  busy,
}: ReviewPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Supervisor review</span>
        {decision && (
          <span
            className={
              "badge badge-" +
              (decision === "approved" ? "compliant" : decision === "rejected" ? "critical" : "major")
            }
          >
            <i className="dot" aria-hidden="true" />
            {decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Escalated"}
          </span>
        )}
      </div>
      <div className="panel-body stack">
        {summary}
        {!decision && (
          <>
            <div className="field">
              <label htmlFor="rev-reason">
                Decision note
                {onReject && (
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              <textarea
                id="rev-reason"
                className="input"
                rows={3}
                value={reason || ""}
                placeholder="Required for rejection or escalation"
                onChange={(e) => onReason && onReason(e.target.value)}
              />
            </div>
            <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
              {onEscalate && (
                <button className="btn btn-secondary btn-touch" disabled={busy} onClick={onEscalate}>
                  Escalate
                </button>
              )}
              {onReject && (
                <button className="btn btn-danger btn-touch" disabled={busy || !reason} onClick={onReject}>
                  Reject
                </button>
              )}
              {onApprove && (
                <button className={"btn btn-primary" + (busy ? " is-loading" : "")} onClick={onApprove}>
                  Approve
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
