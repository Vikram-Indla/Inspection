"use client";
// M08-017 — Operations Center CSV export. One button per table (live monitoring,
// SLA watch, high-risk board); each exports the CURRENT region/city-scoped view.
// Rows + headers are formatted server-side and passed in, so this module owns no
// enum labels or i18n — it only escapes and downloads. A UTF-8 BOM is prefixed
// so Arabic factory/inspector names survive Excel (parity with the localization
// export pattern, Manager.tsx).
export type ExportDataset = {
  key: string;
  label: string;
  filename: string;
  headers: string[];
  rows: string[][];
};

export type OpsExportStrings = { heading: string; scopeNote: string };

const BOM = "﻿";

function toCsv(headers: string[], rows: string[][]): string {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))];
  // BOM keeps Arabic intact when the CSV lands in Excel; CRLF for Excel parity.
  return BOM + lines.join("\r\n");
}

function download(ds: ExportDataset) {
  const blob = new Blob([toCsv(ds.headers, ds.rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ds.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OpsExport({ datasets, strings }: { datasets: ExportDataset[]; strings: OpsExportStrings }) {
  return (
    <div className="row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "center" }}>
      <strong>{strings.heading}</strong>
      {datasets.map(ds => (
        <button key={ds.key} type="button" className="ax-btn ax-btn--subtle" disabled={ds.rows.length === 0}
          onClick={() => download(ds)}>
          {ds.label} <span className="ax-numeric">{ds.rows.length}</span>
        </button>
      ))}
      <span className="ax-caption">{strings.scopeNote}</span>
    </div>
  );
}
