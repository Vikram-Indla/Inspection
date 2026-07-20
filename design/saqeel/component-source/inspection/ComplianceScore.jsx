import React from "react";
export function ComplianceScore({ value = 0, size = 64, label = "Compliance" }) {
  const tone = value >= 90 ? "compliant" : value >= 70 ? "warning" : "critical";
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  return (
    <div className="row" style={{ gap: "var(--space-3)" }}>
      <svg width={size} height={size} role="img" aria-label={label + " " + value + "%"}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={"var(--status-" + tone + ")"} strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="butt"
          transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"} />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
          style={{ font: "600 " + size / 4 + "px var(--font-body)", fill: "var(--text-primary)" }}>{value}%</text>
      </svg>
      <div className="stack" style={{ gap: 2 }}>
        <span className="t-label">{label}</span>
        <span className={"badge badge-" + tone}><i className="dot" aria-hidden="true" />{tone === "compliant" ? "Compliant" : tone === "warning" ? "Needs attention" : "Non-compliant"}</span>
      </div>
    </div>
  );
}