"use client";
import React from "react";

export type ToastTone = "success" | "critical" | "info" | "warning";

const toneColor: Record<ToastTone, string> = {
  success: "var(--status-compliant)",
  critical: "var(--status-critical)",
  info: "var(--status-info)",
  warning: "var(--status-warning)",
};

export interface ToastProps {
  tone?: ToastTone;
  title: string;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function Toast({ tone = "success", title, children, onDismiss }: ToastProps) {
  return (
    <div className="toast" role="status">
      <span className="toast-accent" style={{ background: toneColor[tone] }} />
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{title}</div>
        {children && <div className="t-meta">{children}</div>}
      </div>
      {onDismiss && (
        <button className="btn btn-ghost btn-sm btn-icon" aria-label="Dismiss" onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  );
}
