import React from "react";
/* Summary / assignment / queue item — one component, three densities via variant. */
export function InspectionCard({ id, facility, type, status = "pending", statusLabel, inspector, due, dueTone, onOpen, variant = "summary", selected }) {
  const compact = variant === "queue";
  return (
    <button type="button" onClick={onOpen}
      className="panel"
      style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : "var(--space-2)",
        padding: compact ? "var(--space-2) var(--space-3)" : "var(--space-3) var(--space-4)",
        textAlign: "start", width: "100%", cursor: onOpen ? "pointer" : "default", font: "inherit",
        borderColor: selected ? "var(--action-primary)" : undefined,
        background: selected ? "var(--accent-soft)" : "var(--surface-primary)" }}>
      <span className="row" style={{ justifyContent: "space-between", width: "100%" }}>
        <span className="id-code">{id}</span>
        <span className={"badge badge-" + status}><i className="dot" aria-hidden="true" />{statusLabel || status}</span>
      </span>
      <span style={{ fontWeight: 600, fontSize: compact ? "var(--type-compact-size)" : "var(--type-heading-size)" }}>{facility}</span>
      <span className="row t-meta" style={{ justifyContent: "space-between", width: "100%" }}>
        <span>{[type, inspector].filter(Boolean).join(" · ")}</span>
        {due && <span style={{ color: dueTone ? "var(--status-" + dueTone + "-text)" : undefined, fontWeight: dueTone ? 500 : 400 }}>{due}</span>}
      </span>
    </button>
  );
}