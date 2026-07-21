import React from "react";
export function Stepper({ steps = [], className = "" }) {
  return <ol className={"ax-stepper " + className}>
    {steps.map((s, i) => <li key={i} className={s.state === "done" ? "is-done" : s.state === "active" ? "is-active" : s.state === "blocked" ? "is-blocked" : ""}>
      <span className="ax-step__dot">{s.state === "done" ? "✓" : s.state === "blocked" ? "!" : i + 1}</span>{s.label}
    </li>)}
  </ol>;
}
