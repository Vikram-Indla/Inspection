"use client";
import { useActionState } from "react";
import { requestOcrExtraction, type OcrActionResult } from "./actions";

export type OcrRow = {
  id: string; evidenceType: string; capturedAt: string;
  inspectionId: string | null; linkedType: string; linkedId: string;
  lastExtraction: { status: string; text: string | null } | null;
};
export type OcrStrings = {
  extract: string; extracting: string; extracted: string; noText: string; unavailable: string;
  openInspection: string;
};

function extractAction(_: OcrActionResult, formData: FormData) {
  return requestOcrExtraction(String(formData.get("evidence_id") ?? ""));
}

export function OcrRowView({ row, strings: s }: { row: OcrRow; strings: OcrStrings }) {
  const [state, action, pending] = useActionState<OcrActionResult, FormData>(extractAction, {});
  const shown = state.text !== undefined ? state : (row.lastExtraction ? { text: row.lastExtraction.text ?? undefined, status: row.lastExtraction.status } : {});
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h3>{row.evidenceType} <span className="ax-caption ax-numeric">{row.capturedAt}</span></h3>
          {row.inspectionId && <a className="ax-link ax-caption" href={`/field/inspection/${row.inspectionId}`}>{s.openInspection}</a>}
        </div>
        <form action={action}>
          <input type="hidden" name="evidence_id" value={row.id} />
          <button className="ax-btn" disabled={pending}>{pending ? s.extracting : s.extract}</button>
        </form>
      </div>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      {shown.status === "unavailable" && <p className="ax-caption">{s.unavailable}</p>}
      {shown.status === "no_text_found" && <p className="ax-caption">{s.noText}</p>}
      {shown.text && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-150)" }}>
          <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{s.extracted}</p>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--ax-font-mono, monospace)" }}>{shown.text}</pre>
        </div>
      )}
    </div>
  );
}
