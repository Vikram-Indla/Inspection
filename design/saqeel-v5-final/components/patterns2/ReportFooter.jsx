import React from "react";
export function ReportFooter({ reference, generated, refreshed, contracts = "M04-215 · M06-018 · DEC-009 · ENG-12", note, className = "" }) {
  return <footer className={className} style={{ borderBlockStart: "1px solid var(--ax-color-border)", paddingBlockStart: 12, display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" }}>
    <span>{note} Generated <span className="ax-numeric"><bdi>{generated}</bdi></span>{refreshed ? <> · data refreshed <span className="ax-numeric"><bdi>{refreshed}</bdi></span></> : null}</span>
    <span className="ax-numeric"><bdi>{reference}</bdi> · {contracts}</span>
  </footer>;
}
