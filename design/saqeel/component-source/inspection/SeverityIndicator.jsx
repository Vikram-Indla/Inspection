import React from "react";
const LABELS = { critical: "Critical", major: "Major", warning: "Minor", info: "Observation" };
export function SeverityIndicator({ severity = "major", label }) {
  return (
    <span className="row" style={{ gap: 6, fontSize: "var(--type-label-size)", fontWeight: 500, color: "var(--status-" + severity + "-text)" }}>
      <span aria-hidden="true" style={{ display: "inline-flex", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <i key={i} style={{ width: 4, height: 10 + i * 3, alignSelf: "flex-end",
            background: (severity === "critical" ? 3 : severity === "major" ? 2 : 1) > i ? "var(--status-" + severity + ")" : "var(--border-strong)" }} />
        ))}
      </span>
      {label || LABELS[severity]}
    </span>
  );
}