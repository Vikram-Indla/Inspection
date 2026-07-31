"use client";
import React from "react";

export interface InspectionCardProps {
  id: string;
  facility: string;
  type?: string;
  status?: string;
  /** localized label; defaults to the status token name */
  statusLabel?: string;
  inspector?: string;
  due?: string;
  /** colour the due text when overdue/near-due */
  dueTone?: "critical" | "warning";
  variant?: "summary" | "assignment" | "queue";
  selected?: boolean;
  onOpen?: () => void;
  /* ── facts row ────────────────────────────────────────────────────────────
     A fourth line the review queue needs: the preliminary figure, supporting
     counts and a lifecycle flag. Omit them all and the row does not render, so
     existing callers are unaffected. */
  /** tabular figure, e.g. "78.4% preliminary" */
  score?: string;
  /** supporting counts, e.g. ["3 violations"] */
  facts?: string[];
  /** lifecycle flag closing the row, e.g. "Penalty proposed" */
  flag?: string;
  /** status token behind `flag`; defaults to warning */
  flagStatus?: string;
}

/* Summary / assignment / queue item — one component, three densities via variant. */
export function InspectionCard({
  id,
  facility,
  type,
  status = "pending",
  statusLabel,
  inspector,
  due,
  dueTone,
  onOpen,
  variant = "summary",
  selected,
  score,
  facts = [],
  flag,
  flagStatus = "warning",
}: InspectionCardProps) {
  const compact = variant === "queue";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 4 : "var(--space-2)",
        padding: compact ? "var(--space-2) var(--space-3)" : "var(--space-3) var(--space-4)",
        textAlign: "start",
        width: "100%",
        cursor: onOpen ? "pointer" : "default",
        font: "inherit",
        borderColor: selected ? "var(--action-primary)" : undefined,
        background: selected ? "var(--accent-soft)" : "var(--surface-primary)",
      }}
    >
      <span className="row" style={{ justifyContent: "space-between", width: "100%" }}>
        <span className="id-code">{id}</span>
        <span className={"badge badge-" + status}>
          <i className="dot" aria-hidden="true" />
          {statusLabel || status}
        </span>
      </span>
      <span style={{ fontWeight: 600, fontSize: compact ? "var(--type-compact-size)" : "var(--type-heading-size)" }}>
        {facility}
      </span>
      <span className="row t-meta" style={{ justifyContent: "space-between", width: "100%" }}>
        <span>{[type, inspector].filter(Boolean).join(" · ")}</span>
        {due && (
          <span style={{ color: dueTone ? "var(--status-" + dueTone + "-text)" : undefined, fontWeight: dueTone ? 500 : 400 }}>
            {due}
          </span>
        )}
      </span>
      {(score || facts.length > 0 || flag) && (
        /* gap 6 rather than .row's --space-2: the facts sit tighter than the lines above,
           and the flag badge drops to 10px so it reads as a marker, not a second status. */
        <span className="row" style={{ gap: 6 }}>
          {score && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
              {score}
            </span>
          )}
          {facts.map((f, i) => (
            <span key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {f}
            </span>
          ))}
          {flag && (
            <span className={"badge badge-" + flagStatus} style={{ fontSize: 10 }}>
              <i className="dot" aria-hidden="true" />
              {flag}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
