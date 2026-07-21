import React from "react";

export interface DescriptionListProps {
  items?: Array<{ term: string; detail: React.ReactNode }>;
  columns?: number;
}

export function DescriptionList({ items = [], columns = 1 }: DescriptionListProps) {
  return (
    <dl
      className="desc"
      style={columns > 1 ? { gridTemplateColumns: "repeat(" + columns + ", minmax(120px, max-content) 1fr)" } : undefined}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <dt>{it.term}</dt>
          <dd>{it.detail}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
