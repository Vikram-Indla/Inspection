import React from "react";

export interface TimelineItem {
  title: React.ReactNode;
  detail?: React.ReactNode;
  actor?: string;
  time?: string;
  accent?: boolean;
  tone?: string;
}

export interface TimelineProps {
  items?: TimelineItem[];
}

export function Timeline({ items = [] }: TimelineProps) {
  return (
    <ol className="timeline">
      {items.map((it, i) => (
        <li key={i}>
          <span
            className={"tl-dot" + (it.accent ? " is-accent" : "")}
            style={it.tone ? { background: "var(--status-" + it.tone + ")" } : undefined}
          />
          <div className="tl-title">{it.title}</div>
          {it.detail && (
            <div className="t-compact" style={{ color: "var(--text-secondary)" }}>
              {it.detail}
            </div>
          )}
          <div className="tl-meta">{[it.actor, it.time].filter(Boolean).join(" · ")}</div>
        </li>
      ))}
    </ol>
  );
}
