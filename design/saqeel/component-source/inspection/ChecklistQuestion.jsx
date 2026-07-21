import React from "react";
/* One inspection checklist question: compliant / violation / n-a answer,
   with note + evidence affordances. Group inside Accordion sections. */
export function ChecklistQuestion({ number, question, requirement, value, onChange, note, onNote, evidenceCount, onEvidence, readOnly }) {
  const opts = [
    { v: "compliant", label: "Compliant" },
    { v: "violation", label: "Violation" },
    { v: "na", label: "N/A" },
  ];
  return (
    <div className="stack" style={{ gap: "var(--space-2)", paddingBlock: "var(--space-3)", borderBlockEnd: "1px solid var(--border-subtle)" }}>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <span className="t-label" style={{ fontVariantNumeric: "tabular-nums", minWidth: 28 }}>{number}</span>
        <div className="grow">
          <div className="t-compact" style={{ fontWeight: 500 }}>{question}</div>
          {requirement && <div className="t-caption">{requirement}</div>}
        </div>
      </div>
      <div className="row" style={{ paddingInlineStart: 28, flexWrap: "wrap" }}>
        <div className="seg" role="group">
          {opts.map((o) => (
            <button key={o.v} type="button" className="seg-opt" disabled={readOnly} aria-pressed={value === o.v}
              style={value === o.v && o.v === "violation" ? { background: "var(--status-critical-soft)", color: "var(--status-critical-text)" } : undefined}
              onClick={() => onChange && onChange(o.v)}>{o.label}</button>
          ))}
        </div>
        {onNote && <button type="button" className="btn btn-ghost btn-sm" onClick={onNote}>{note ? "Edit note" : "Add note"}</button>}
        {onEvidence && <button type="button" className="btn btn-ghost btn-sm" onClick={onEvidence}>Evidence{evidenceCount ? " (" + evidenceCount + ")" : ""}</button>}
      </div>
      {note && <div className="t-caption" style={{ paddingInlineStart: 28 }}>{note}</div>}
    </div>
  );
}