import React from "react";

export type SyncState = "synced" | "pending" | "syncing" | "offline" | "conflict" | "failed";

const CONF: Record<SyncState, { tone: string; glyph: string; label: string; spin?: boolean }> = {
  synced: { tone: "compliant", glyph: "✓", label: "Synced" },
  pending: { tone: "pending", glyph: "…", label: "Pending sync" },
  syncing: { tone: "info", glyph: "⟳", label: "Syncing", spin: true },
  offline: { tone: "disabled", glyph: "⊘", label: "Offline — saved on device" },
  conflict: { tone: "critical", glyph: "!", label: "Sync conflict" },
  failed: { tone: "critical", glyph: "✕", label: "Sync failed" },
};

export interface SyncIndicatorProps {
  /** offline-first lifecycle — synced | pending | syncing | offline | conflict | failed */
  state?: SyncState;
  /** localized label override */
  label?: string;
  /** tooltip detail (last sync time, queued count) */
  detail?: string;
}

export function SyncIndicator({ state = "synced", label, detail }: SyncIndicatorProps) {
  const c = CONF[state] || CONF.synced;
  return (
    <span
      className={"exc exc-" + c.tone}
      role="status"
      title={detail}
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
        padding: "3px 10px",
        background: "var(--surface-primary)",
        gap: 6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 11,
          lineHeight: 1,
          animation: c.spin ? "insp-spin 1.2s linear infinite" : "none",
          display: "inline-block",
        }}
      >
        {c.glyph}
      </span>
      {label || c.label}
    </span>
  );
}
