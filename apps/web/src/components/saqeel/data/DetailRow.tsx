import React from "react";

export interface DetailRowProps {
  /** the field name */
  term: string;
  /** the field value — node so it can carry a Badge, DueDate, id-code etc. */
  value?: React.ReactNode;
  /** secondary line under the term: where the value came from, or why it is fixed */
  hint?: string;
}

/* Term + hint + value. This is the row the built screens actually use — /reviews alone
   renders twelve of them, and the same shape appears across Factory 360, Planning and the
   compliance surfaces under the ad-hoc names detail-row / desc-row / kv-row / record-row.

   DescriptionList is the sibling for the plain case: it is a real <dl> and its `term` is a
   string, so it cannot carry the hint line. Reach for that one when there is no hint and the
   semantic list matters; reach for this one when the term needs its provenance underneath.

   Layout comes entirely from existing utilities — .row (saqeel-components.css:369) for the
   flex/gap, .grow (:370) so the label block takes the slack, .t-compact and .t-caption
   (tokens.css:262,265) for the type ramp. .t-caption already resolves to --text-muted, so the
   hint needs no colour of its own. `text-align: end` rather than `right` keeps RTL free. */
export function DetailRow({ term, value, hint }: DetailRowProps) {
  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="grow">
        <div className="t-compact">{term}</div>
        {hint && <div className="t-caption">{hint}</div>}
      </div>
      {value != null && (
        <div className="t-compact" style={{ textAlign: "end", minInlineSize: 0 }}>
          {value}
        </div>
      )}
    </div>
  );
}

export interface DetailListProps {
  items?: Array<DetailRowProps>;
}

/* Stacked DetailRows. .stack (saqeel-components.css:368) already gives the column and the
   --space-3 rhythm the screens use between rows. */
export function DetailList({ items = [] }: DetailListProps) {
  return (
    <div className="stack">
      {items.map((it, i) => (
        <DetailRow key={i} term={it.term} value={it.value} hint={it.hint} />
      ))}
    </div>
  );
}
