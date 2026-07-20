"use client";
import React from "react";

export interface BreadcrumbProps {
  items?: Array<{ label: string; href?: string; onClick?: (e: React.MouseEvent) => void }>;
}

export function Breadcrumb({ items = [] }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className="sep" aria-hidden="true">
              /
            </span>
          )}
          {i < items.length - 1 && it.href != null ? (
            <a href={it.href} onClick={it.onClick}>
              {it.label}
            </a>
          ) : (
            <span aria-current="page" style={{ color: "var(--text-secondary)" }}>
              {it.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export interface TabsProps {
  tabs?: Array<{ id: string; label: string; count?: number }>;
  value?: string;
  vertical?: boolean;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs = [], value, onChange, vertical }: TabsProps) {
  return (
    <div
      className="tabs"
      role="tablist"
      style={
        vertical
          ? { flexDirection: "column", borderBlockEnd: 0, borderInlineEnd: "1px solid var(--border-subtle)" }
          : undefined
      }
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          className="tab"
          aria-selected={t.id === value}
          style={
            vertical
              ? {
                  textAlign: "start",
                  borderBlockEnd: 0,
                  borderInlineEnd: t.id === value ? "2px solid var(--action-primary)" : "2px solid transparent",
                  marginBlockEnd: 0,
                  marginInlineEnd: -1,
                }
              : undefined
          }
          onClick={() => onChange && onChange(t.id)}
        >
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export interface StepsProps {
  steps?: string[];
  /** 0-based index of the current step */
  current?: number;
}

export function Steps({ steps = [], current = 0 }: StepsProps) {
  return (
    <ol className="steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="step-line" aria-hidden="true" />}
          <li
            className={"step" + (i < current ? " is-done" : i === current ? " is-current" : "")}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="step-dot">{i < current ? "✓" : i + 1}</span>
            <span>{s}</span>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

export interface PaginationProps {
  page?: number;
  pageCount?: number;
  onChange?: (page: number) => void;
}

export function Pagination({ page = 1, pageCount = 1, onChange }: PaginationProps) {
  const go = (p: number) => onChange && onChange(Math.min(Math.max(1, p), pageCount));
  const pages: Array<number | "…"> = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Previous">
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={"e" + i} className="t-meta">
            …
          </span>
        ) : (
          <button
            key={p}
            className={"page-btn" + (p === page ? " is-active" : "")}
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="page-btn"
        disabled={page === pageCount}
        onClick={() => go(page + 1)}
        aria-label="Next"
      >
        ›
      </button>
    </nav>
  );
}
