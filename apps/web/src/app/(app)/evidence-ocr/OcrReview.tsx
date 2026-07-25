"use client";
import { useActionState, useState } from "react";
import { requestOcrExtraction, type OcrActionResult } from "./actions";

export type OcrRow = {
  id: string; evidenceType: string; capturedAt: string;
  inspectionId: string | null; linkedType: string; linkedId: string;
  lastExtraction: { status: string; text: string | null } | null;
};
export type OcrStrings = {
  extract: string; extracting: string; extracted: string; noText: string; unavailable: string;
  openInspection: string; notExtracted: string; failedBadge: string; extractedBadge: string;
  extractHint: string; failedBody: string; copy: string; copied: string; copyHint: string;
  advisory: string; linked: string; captured: string; retry: string;
};

function extractAction(_: OcrActionResult, formData: FormData) {
  return requestOcrExtraction(String(formData.get("evidence_id") ?? ""));
}

// Status → badge maps onto the shared status scale; "no extraction yet" is a
// held state, not a failure.
function statusBadge(status: string | undefined): string {
  if (status === "extracted") return "badge-compliant";
  if (status === "failed") return "badge-warning";
  if (status === "unavailable") return "badge-critical";
  if (status === "no_text_found") return "badge-draft";
  return "badge-onhold";
}

function ThumbIcon({ isDocument }: { isDocument: boolean }) {
  return (
    <div aria-hidden="true" style={{ inlineSize: 96, blockSize: 96, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", display: "grid", placeItems: "center", color: "var(--text-muted)", flex: "none" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 28, height: 28 }}>
        {isDocument
          ? <path d="M14 3v5h5M6 3h9l4 4v14H6z" />
          : <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>}
      </svg>
    </div>
  );
}

export function OcrRowView({ row, strings: s }: { row: OcrRow; strings: OcrStrings }) {
  const [state, action, pending] = useActionState<OcrActionResult, FormData>(extractAction, {});
  const [copied, setCopied] = useState(false);
  const shown = state.text !== undefined || state.status
    ? { text: state.text, status: state.status }
    : (row.lastExtraction ? { text: row.lastExtraction.text ?? undefined, status: row.lastExtraction.status } : { text: undefined, status: undefined });
  const isDocument = row.evidenceType.toLowerCase().includes("doc");
  const badgeLabel = shown.status === "extracted" ? s.extractedBadge
    : shown.status === "failed" ? s.failedBadge
      : shown.status === "unavailable" ? s.unavailable
        : shown.status === "no_text_found" ? s.noText
          : s.notExtracted;

  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div className="row" style={{ gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)", alignItems: "flex-start" }}>
        <ThumbIcon isDocument={isDocument} />
        <div style={{ minInlineSize: 0, flex: 1 }}>
          <div className="row" style={{ gap: "var(--space-2)", justifyContent: "space-between" }}>
            <b>{row.evidenceType} · <span className="id-code">{row.linkedId}</span></b>
            <span className={`badge ${statusBadge(shown.status)}`}>{badgeLabel}</span>
          </div>
          <div className="t-caption" style={{ marginBlockStart: 2 }}>
            {row.inspectionId ? <>{s.linked} <span className="id-code">{row.inspectionId}</span> · </> : null}
            {s.captured} <span className="numeric">{row.capturedAt}</span>
          </div>
          {row.inspectionId && <a className="sq-link t-caption" href={`/field/inspection/${row.inspectionId}`}>{s.openInspection}</a>}
        </div>
      </div>

      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        {state.error && <div className="sq-banner sq-banner--critical" role="alert"><div>{state.error}</div></div>}

        {shown.status === "extracted" && shown.text ? (
          <>
            <div className="t-label" style={{ marginBlockEnd: "var(--space-2)" }}>{s.extracted}</div>
            <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--font-mono, monospace)" }}>{shown.text}</pre>
              <span className="t-caption">{s.advisory}</span>
            </div>
            <div className="row" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-2)" }}>
              {/* Manual copy only. Nothing here writes an authoritative field. */}
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { void navigator.clipboard?.writeText(shown.text ?? "").then(() => setCopied(true)).catch(() => setCopied(false)); }}>
                {copied ? s.copied : s.copy}
              </button>
              <span className="t-caption" style={{ alignSelf: "center" }}>{s.copyHint}</span>
            </div>
          </>
        ) : shown.status === "failed" || shown.status === "unavailable" ? (
          <>
            <div className="alert alert-immutable">
              <div>{shown.status === "unavailable" ? s.unavailable : s.failedBody}</div>
            </div>
            {/* The evidence is untouched and nothing was invented — a human may retry. */}
            <form action={action} style={{ marginBlockStart: "var(--space-2)" }}>
              <input type="hidden" name="evidence_id" value={row.id} />
              <button className="btn btn-secondary btn-sm btn-touch" disabled={pending}>{pending ? s.extracting : s.retry}</button>
            </form>
          </>
        ) : (
          <>
            {shown.status === "no_text_found" && <p className="t-caption" style={{ margin: "0 0 var(--space-2)" }}>{s.noText}</p>}
            <form action={action}>
              <input type="hidden" name="evidence_id" value={row.id} />
              <button className="btn btn-secondary btn-sm btn-touch" disabled={pending}>{pending ? s.extracting : s.extract}</button>
            </form>
            <p className="t-caption" style={{ margin: "var(--space-2) 0 0" }}>{s.extractHint}</p>
          </>
        )}
      </div>
    </div>
  );
}
