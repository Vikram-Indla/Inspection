"use client";

// TASK-EXECUTION-MODULE-001 · Phase 4B — Operations cancellation decision
// queue (plan §12). Same visual language as OverrideQueue: pending
// active-session cancellation requests with requester, visit/factory labels
// and evidence link. Approval is a two-step confirm — the decision is
// terminal and captured data is preserved for audit. Rejection requires a
// reason. The requester can never decide their own request (server-enforced;
// self-decide/already-decided tokens map to neutral copy).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideActiveCancellation } from "./actions";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

export type CancellationQueueRow = {
  id: string;
  visit_id: string;
  phase: string;
  reason_label: string;
  comment: string | null;
  requested_at: string;
  factory_name: string | null;
  inspector_name: string | null;
  evidence_url: string | null;
};

export type CancellationQueueStrings = {
  heading: string; caption: string; emptyTitle: string; emptyDesc: string;
  factory: string; inspector: string; phase: string; requested: string;
  evidence: string; viewEvidence: string;
  approve: string; reject: string; rejectReason: string;
  confirmTitle: string; confirmBody: string; confirmApprove: string; confirmBack: string;
  deciding: string; decided: string; failure: string;
};

export default function CancellationQueue({ rows, strings, locale }: { rows: CancellationQueueRow[]; strings: CancellationQueueStrings; locale: Locale }) {
  const stamp = (iso: string) => formatDateTime(iso, locale === "ar" ? "ar" : "en");
  const router = useRouter();
  const [rejection, setRejection] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(row: CancellationQueueRow, decision: "approve" | "reject") {
    const decisionReason = (rejection[row.id] ?? "").trim();
    if (decision === "reject" && !decisionReason) {
      setMessage(m => ({ ...m, [row.id]: strings.rejectReason })); return;
    }
    const fd = new FormData();
    fd.set("request_id", row.id); fd.set("decision", decision); fd.set("decision_reason", decisionReason);
    startTransition(async () => {
      const result = await decideActiveCancellation({}, fd);
      setMessage(m => ({ ...m, [row.id]: result.ok ? strings.decided : (result.error ?? strings.failure) }));
      setConfirming(null);
      if (result.ok) window.setTimeout(() => router.refresh(), 1_200);
    });
  }

  return (
    <section className="sq-surface" style={{ padding: "var(--space-6)" }} aria-labelledby="cancellation-queue-heading">
      <h4 id="cancellation-queue-heading" style={{ marginBlockEnd: "var(--space-2)" }}>{strings.heading}</h4>
      <p className="sq-caption" style={{ marginBlockEnd: "var(--space-4)" }}>{strings.caption}</p>
      {rows.length === 0 ? (
        <EmptyState glyph="✓" title={strings.emptyTitle} body={strings.emptyDesc} inline bare />
      ) : (
        <div className="sq-stack" style={{ gap: "var(--space-4)" }}>
          {rows.map(row => (
            <div key={row.id} className="sq-surface" style={{ padding: "var(--space-4)", borderColor: "var(--status-warning)" }}>
              <div className="sq-row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <strong>{row.factory_name ?? row.visit_id.slice(0, 8)}</strong>
                  <p className="sq-caption">{strings.inspector}: {row.inspector_name ?? "—"} · {row.reason_label}</p>
                </div>
                <span className="sq-lozenge sq-lozenge--warning">{strings.requested}: {stamp(row.requested_at)}</span>
              </div>
              {row.comment && <p style={{ marginBlock: "var(--space-3)" }}>{row.comment}</p>}
              <div className="sq-row sq-caption" style={{ gap: 12, flexWrap: "wrap" }}>
                <span>{strings.phase}: {row.phase.replace(/_/g, " ")}</span>
                <span>{strings.evidence}:{" "}
                  {row.evidence_url
                    ? <a href={row.evidence_url} target="_blank" rel="noreferrer">{strings.viewEvidence}</a>
                    : "—"}
                </span>
              </div>
              {confirming === row.id ? (
                <div className="sq-banner sq-banner--critical" role="alert" style={{ marginBlockStart: "var(--space-3)" }}>
                  <div>
                    <strong>{strings.confirmTitle}</strong> {strings.confirmBody}
                    <div className="sq-row" style={{ gap: 8, marginBlockStart: "var(--space-3)" }}>
                      <button className="sq-btn sq-btn--subtle" disabled={pending} onClick={() => setConfirming(null)}>{strings.confirmBack}</button>
                      <button className="sq-btn sq-btn--danger" disabled={pending} onClick={() => decide(row, "approve")}>{strings.confirmApprove}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sq-row" style={{ gap: 8, alignItems: "end", flexWrap: "wrap", marginBlockStart: "var(--space-3)" }}>
                  <label className="sq-field" style={{ flex: 1, minInlineSize: 220 }}>
                    <span className="sq-field__label">{strings.rejectReason}</span>
                    <input className="sq-input" value={rejection[row.id] ?? ""} onChange={e => setRejection(v => ({ ...v, [row.id]: e.target.value }))} />
                  </label>
                  <button className="sq-btn sq-btn--secondary" disabled={pending} onClick={() => decide(row, "reject")}>{strings.reject}</button>
                  <button className="sq-btn sq-btn--field" disabled={pending} onClick={() => { setMessage(m => ({ ...m, [row.id]: "" })); setConfirming(row.id); }}>{strings.approve}</button>
                </div>
              )}
              {message[row.id] && <p className="sq-caption" role="status" style={{ marginBlockStart: 8 }}>{pending ? strings.deciding : message[row.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
