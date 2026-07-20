import React from "react";
import { SeverityIndicator } from "./SeverityIndicator.jsx";
/* Finding / violation / corrective-action — kind switches the header vocabulary. */
export function FindingCard({ kind = "finding", refCode, severity = "major", title, description, requirement, due, evidenceCount, actions, children }) {
  const kindLabel = { finding: "Finding", violation: "Violation", corrective: "Corrective action" }[kind];
  return (
    <div className="panel" style={{ borderInlineStartWidth: 3, borderInlineStartColor: "var(--status-" + severity + ")" }}>
      <div className="panel-header" style={{ paddingBlock: "var(--space-2)" }}>
        <span className="row">
          <span className="t-label" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{kindLabel}</span>
          {refCode && <span className="id-code">{refCode}</span>}
        </span>
        <SeverityIndicator severity={severity} />
      </div>
      <div className="panel-body stack" style={{ gap: "var(--space-2)", paddingBlock: "var(--space-3)" }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {description && <div className="t-compact" style={{ color: "var(--text-secondary)" }}>{description}</div>}
        {requirement && <div className="t-caption">Requirement: {requirement}</div>}
        <div className="row t-meta" style={{ gap: "var(--space-4)" }}>
          {due && <span>Due {due}</span>}
          {evidenceCount != null && <span>{evidenceCount} evidence items</span>}
        </div>
        {children}
        {actions && <div className="row">{actions}</div>}
      </div>
    </div>
  );
}