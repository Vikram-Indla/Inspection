import React from "react";
export function Steps({ steps = [], current = 0 }) {
  return (
    <ol className="steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="step-line" aria-hidden="true" />}
          <li className={"step" + (i < current ? " is-done" : i === current ? " is-current" : "")}
            aria-current={i === current ? "step" : undefined}>
            <span className="step-dot">{i < current ? "✓" : i + 1}</span><span>{s}</span>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}