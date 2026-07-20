"use client";
// M04-215 production path: the official report is a print-faithful HTML page;
// browser print-to-PDF is the sanctioned PDF generator (no fake download).
export type PrintReportStrings = { print: string; hint: string; back: string };

export default function PrintReport({ strings, backHref }: { strings: PrintReportStrings; backHref: string }) {
  return (
    <div className="row no-print" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--ax-space-200)", padding: "var(--ax-space-200) var(--ax-space-300)" }}>
      <a className="ax-link" href={backHref}>← {strings.back}</a>
      <div className="row" style={{ alignItems: "center", gap: "var(--ax-space-200)" }}>
        <span className="ax-caption">{strings.hint}</span>
        <button className="ax-btn ax-btn--prominent" onClick={() => window.print()}>{strings.print}</button>
      </div>
    </div>
  );
}
