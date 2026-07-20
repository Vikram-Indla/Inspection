import React from "react";
export function Modal({ open, title, children, actions, onClose, width = 480 }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined} style={{ width: "min(" + width + "px, 100%)" }}>
        {title && <div className="dialog-title">{title}</div>}
        <div className="dialog-body">{children}</div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}