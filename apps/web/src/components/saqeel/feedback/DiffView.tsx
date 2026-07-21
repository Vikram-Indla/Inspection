"use client";
import React from "react";

export interface DiffRow {
  field: string;
  before: React.ReactNode;
  after: React.ReactNode;
  meta?: string;
}

export interface DiffViewProps {
  rows?: DiffRow[];
  /** present = conflict-resolution mode with per-row keep/accept */
  onKeep?: (row: DiffRow, choice: "before" | "after") => void;
}

/* Field-level diff for version comparison and sync-conflict resolution.
   del = critical-soft strikethrough, ins = compliant-soft. */
export function DiffView({ rows = [], onKeep }: DiffViewProps) {
  return (
    <div className="panel">
      {rows.map((r, i) => (
        <div
          key={i}
          className="stack"
          style={{
            gap: 4,
            padding: "var(--space-3) var(--space-4)",
            borderBlockEnd: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <span className="t-label">{r.field}</span>
          <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
            <span
              style={{
                background: "var(--status-critical-soft)",
                color: "var(--status-critical-text)",
                textDecoration: "line-through",
                padding: "1px 6px",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--type-compact-size)",
              }}
            >
              {r.before}
            </span>
            <span aria-hidden="true" className="t-meta">
              →
            </span>
            <span
              style={{
                background: "var(--status-compliant-soft)",
                color: "var(--status-compliant-text)",
                padding: "1px 6px",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--type-compact-size)",
              }}
            >
              {r.after}
            </span>
            {onKeep && (
              <span className="row" style={{ marginInlineStart: "auto", gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onKeep(r, "before")}>
                  Keep original
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => onKeep(r, "after")}>
                  Accept change
                </button>
              </span>
            )}
          </div>
          {r.meta && <span className="t-caption">{r.meta}</span>}
        </div>
      ))}
    </div>
  );
}
