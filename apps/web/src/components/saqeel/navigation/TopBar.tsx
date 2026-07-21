import React from "react";

export interface TopBarProps {
  /** leading slot: collapse toggle, breadcrumb */
  start?: React.ReactNode;
  /** global search input */
  search?: React.ReactNode;
  /** trailing slot: notifications, language, theme, user menu */
  end?: React.ReactNode;
  children?: React.ReactNode;
}

export function TopBar({ start, search, end, children }: TopBarProps) {
  return (
    <header className="topbar">
      {start}
      {search && (
        <div className="grow" style={{ maxWidth: 420 }}>
          {search}
        </div>
      )}
      <div className="grow" />
      <div className="row">
        {end}
        {children}
      </div>
    </header>
  );
}

export interface PageHeaderProps {
  breadcrumb?: React.ReactNode;
  title: React.ReactNode;
  /** identifiers, status badge, last-updated */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function PageHeader({ breadcrumb, title, meta, actions, tabs }: PageHeaderProps) {
  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {breadcrumb}
      <div className="page-header">
        <div className="stack" style={{ gap: "var(--space-1)" }}>
          <h2 className="t-page-title">{title}</h2>
          {meta && (
            <div className="row t-meta" style={{ flexWrap: "wrap" }}>
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
      {tabs}
    </div>
  );
}
