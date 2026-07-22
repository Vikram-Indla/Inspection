"use client";
// M04-215 production path: the official report is a print-faithful HTML page;
// browser print-to-PDF is the sanctioned PDF generator (no fake download).
export type PrintReportStrings = { print: string; hint: string; back: string };

export default function PrintReport({ strings, backHref }: { strings: PrintReportStrings; backHref: string }) {
  return (
    <div className="row no-print" style={{ justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4) var(--space-6)" }}>
      <a className="sq-link" href={backHref}>← {strings.back}</a>
      <div className="row" style={{ alignItems: "center", gap: "var(--space-4)" }}>
        <span className="t-caption">{strings.hint}</span>
        <button className="btn btn-primary btn-lg btn-touch" onClick={() => window.print()}>{strings.print}</button>
      </div>
    </div>
  );
}
