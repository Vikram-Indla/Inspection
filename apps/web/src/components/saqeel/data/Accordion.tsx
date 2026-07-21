import React from "react";

export interface AccordionSection {
  title: React.ReactNode;
  meta?: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
}

export interface AccordionProps {
  sections?: AccordionSection[];
}

export function Accordion({ sections = [] }: AccordionProps) {
  return (
    <div className="accordion">
      {sections.map((s, i) => (
        <details key={i} open={s.open}>
          <summary>
            {s.title}
            {s.meta && (
              <span className="t-meta" style={{ marginInlineStart: "auto", fontWeight: 400 }}>
                {s.meta}
              </span>
            )}
          </summary>
          <div className="accordion-body">{s.content}</div>
        </details>
      ))}
    </div>
  );
}
