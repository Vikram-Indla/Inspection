import React from "react";
const toneColor = { success: "var(--status-compliant)", critical: "var(--status-critical)", info: "var(--status-info)", warning: "var(--status-warning)" };
export function Toast({ tone = "success", title, children, onDismiss }) {
  return (
    <div className="toast" role="status">
      <span className="toast-accent" style={{ background: toneColor[tone] }} />
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{title}</div>
        {children && <div className="t-meta">{children}</div>}
      </div>
      {onDismiss && <button className="btn btn-ghost btn-sm btn-icon" aria-label="Dismiss" onClick={onDismiss}>✕</button>}
    </div>
  );
}