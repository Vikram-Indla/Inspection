"use client";
import React from "react";
import SaqeelBrandMark from "@/components/SaqeelBrandMark";

export interface SidebarGroup {
  label?: string;
  items: Array<{ id: string; label: string; icon?: React.ReactNode; count?: number }>;
}

export interface SidebarProps {
  brand?: string;
  brandMark?: React.ReactNode;
  collapsed?: boolean;
  groups?: SidebarGroup[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  footer?: React.ReactNode;
}

export function Sidebar({
  brand = "Inspection",
  brandMark,
  collapsed,
  groups = [],
  activeId,
  onNavigate,
  footer,
}: SidebarProps) {
  return (
    <nav className={"sidebar" + (collapsed ? " is-collapsed" : "")} aria-label="Main">
      <div className="sidebar-brand">
        {brandMark || (
          <SaqeelBrandMark className="sidebar-brand__mark" />
        )}
        <span className="brand-label">{brand}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBlock: "var(--space-2)" }}>
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && <div className="sidebar-group">{g.label}</div>}
            {g.items.map((it) => (
              <button
                key={it.id}
                className={"nav-item" + (it.id === activeId ? " is-active" : "")}
                title={collapsed ? it.label : undefined}
                onClick={() => onNavigate && onNavigate(it.id)}
              >
                {it.icon}
                <span className="nav-label">{it.label}</span>
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
