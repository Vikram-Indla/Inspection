"use client";
import React from "react";

export interface DrawerProps {
  open?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}

export function Drawer({ open, title, children, footer, onClose, width = 420 }: DrawerProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="dialog-backdrop"
        style={{ placeItems: "stretch end", padding: 0, zIndex: "var(--z-drawer)" as unknown as number }}
        onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
      />
      <aside className="drawer" role="dialog" aria-modal="true" style={{ width: "min(" + width + "px, 92vw)" }}>
        <div className="drawer-header">
          <span className="t-heading">{title}</span>
          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && (
          <div className="dialog-actions" style={{ borderBlockStart: "1px solid var(--border-subtle)" }}>
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
