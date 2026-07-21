import React from "react";
export function Accordion({ sections = [] }) {
  return (
    <div className="accordion">
      {sections.map((s, i) => (
        <details key={i} open={s.open}>
          <summary>{s.title}{s.meta && <span className="t-meta" style={{ marginInlineStart: "auto", fontWeight: 400 }}>{s.meta}</span>}</summary>
          <div className="accordion-body">{s.content}</div>
        </details>
      ))}
    </div>
  );
}