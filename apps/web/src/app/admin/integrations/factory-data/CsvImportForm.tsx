"use client";

import { useActionState, useState } from "react";
import { stageFactoryCsv, type FactoryDataResult } from "./actions";

const SCHEMA_VERSION = "factory360-v2-staging-1";
const REQUIRED = ["cr_number", "license_number", "plant_number"];

export default function CsvImportForm() {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(stageFactoryCsv, {});
  const [preview, setPreview] = useState<{ name: string; headers: string[]; rows: number; errors: string[] } | null>(null);

  async function inspect(file?: File) {
    if (!file) { setPreview(null); return; }
    const firstLines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const headers = (firstLines[0] ?? "").split(",").map(value => value.trim().replace(/^"|"$/g, ""));
    const errors = REQUIRED.filter(header => !headers.includes(header)).map(header => `CSV_REQUIRED_HEADER_MISSING: ${header}`);
    setPreview({ name: file.name, headers, rows: Math.max(0, firstLines.length - 1), errors });
  }

  return (
    <form action={action} className="stack" style={{ gap: "var(--ax-space-200)" }}>
      <input type="hidden" name="schema_version" value={SCHEMA_VERSION} />
      <label className="ax-field" style={{ maxInlineSize: "none" }}>
        <span className="ax-field__label">CSV file</span>
        <input className="ax-input" type="file" name="csv_file" accept=".csv,text/csv" required onChange={event => void inspect(event.target.files?.[0])} />
      </label>
      <p className="t-caption">Schema <bdi>{SCHEMA_VERSION}</bdi>. Required identity columns: <bdi>{REQUIRED.join(", ")}</bdi>. Files are staged for reconciliation; this action never overwrites factory truth.</p>
      {preview ? <div className="ax-surface" style={{ padding: "var(--ax-space-200)" }} aria-live="polite">
        <strong>{preview.name}</strong><p className="t-caption">{preview.rows} data rows · {preview.headers.length} columns</p>
        <p className="t-caption"><bdi>{preview.headers.join(" · ")}</bdi></p>
        {preview.errors.map(error => <p key={error} role="alert" style={{ color: "var(--ax-color-critical)" }}>{error}</p>)}
      </div> : null}
      {state.error ? <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div> : null}
      {state.ok ? <div className="ax-banner ax-banner--success" role="status"><div>Batch <bdi>{state.batchId}</bdi> staged: {state.pendingReconciliation} pending reconciliation, {state.rejected} rejected with safe row errors. Zero rows are accepted until governed reconciliation.</div></div> : null}
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending || !!preview?.errors.length}>{pending ? "Staging…" : "Stage validated batch"}</button>
    </form>
  );
}
