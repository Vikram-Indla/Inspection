import React from "react";
const icons = {
  critical: <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0" />,
  warning: <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 12v4" /></>,
  success: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
  immutable: <><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};
export function Alert({ tone = "info", title, children, actions }) {
  // "immutable" = sealed/read-only record banner (neutral + lock), a contractual state.
  return (
    <div className={"alert alert-" + tone} role={tone === "critical" ? "alert" : "status"}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icons[tone]}</svg>
      <div className="grow">
        {title && <div className="alert-title">{title}</div>}
        {children}
        {actions && <div className="row" style={{ marginBlockStart: "var(--space-2)" }}>{actions}</div>}
      </div>
    </div>
  );
}