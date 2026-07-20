import React from "react";
export function Sidebar({ brand = "Inspection", brandMark, collapsed, groups = [], activeId, onNavigate, footer }) {
  return (
    <nav className={"sidebar" + (collapsed ? " is-collapsed" : "")} aria-label="Main">
      <div className="sidebar-brand">{brandMark || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nav-indicator)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>}<span className="brand-label">{brand}</span></div>
      <div style={{ flex: 1, overflowY: "auto", paddingBlock: "var(--space-2)" }}>
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && <div className="sidebar-group">{g.label}</div>}
            {g.items.map((it) => (
              <button key={it.id} className={"nav-item" + (it.id === activeId ? " is-active" : "")}
                title={collapsed ? it.label : undefined}
                onClick={() => onNavigate && onNavigate(it.id)}>
                {it.icon}<span className="nav-label">{it.label}</span>
                {it.count != null && <span className="nav-count">{it.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      {footer}
    </nav>
  );
}