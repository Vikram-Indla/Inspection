"use client";
import React from "react";

export interface ManagedColumn {
  id: string;
  header: string;
  hidden?: boolean;
  pinned?: boolean;
}

export interface ColumnManagerProps {
  columns?: ManagedColumn[];
  onChange?: (columns: ManagedColumn[]) => void;
}

/* Column visibility + order manager for DataGrid; host in Menu/Drawer. */
export function ColumnManager({ columns = [], onChange }: ColumnManagerProps) {
  const move = (i: number, dir: number) => {
    const next = [...columns];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange && onChange(next);
  };
  const toggle = (i: number) => {
    const next = columns.map((c, k) => (k === i ? { ...c, hidden: !c.hidden } : c));
    onChange && onChange(next);
  };
  return (
    <div className="stack" style={{ gap: 2, minWidth: 220 }}>
      {columns.map((c, i) => (
        <div key={c.id} className="row" style={{ gap: "var(--space-1)", padding: "2px 0" }}>
          <label className="check grow">
            <input type="checkbox" checked={!c.hidden} disabled={c.pinned} onChange={() => toggle(i)} />
            <span>
              {c.header}
              {c.pinned && <span className="t-caption"> · pinned</span>}
            </span>
          </label>
          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
            ↑
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Move down"
            disabled={i === columns.length - 1}
            onClick={() => move(i, 1)}
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}
