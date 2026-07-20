"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideGeoOverride } from "./actions";
import EmptyState from "@/components/EmptyState";

export type GeoOverrideQueueRow = {
  id: string;
  visit_id: string;
  reason_label: string;
  explanation: string;
  safety_security_exception: boolean;
  observed_lat: number;
  observed_lng: number;
  accuracy_m: number;
  distance_m: number;
  device_occurred_at: string;
  requested_at: string;
  expires_at: string;
  evidence_count: number;
  evidence_url: string | null;
  factory_name: string | null;
  inspector_name: string | null;
};

export type OverrideQueueStrings = {
  heading: string; caption: string; emptyTitle: string; emptyDesc: string;
  factory: string; inspector: string; captured: string; accuracy: string;
  distance: string; evidence: string; safetyException: string; expires: string;
  viewEvidence: string; evidenceUnavailable: string;
  approve: string; reject: string; rejectReason: string; deciding: string;
  decided: string; failure: string;
};

const stamp = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");

export default function OverrideQueue({ rows, strings }: { rows: GeoOverrideQueueRow[]; strings: OverrideQueueStrings }) {
  const router = useRouter();
  const [rejection, setRejection] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function decide(row: GeoOverrideQueueRow, decision: "approved" | "rejected") {
    const decisionReason = (rejection[row.id] ?? "").trim();
    if (decision === "rejected" && !decisionReason) {
      setMessage(m => ({ ...m, [row.id]: strings.rejectReason })); return;
    }
    const fd = new FormData();
    fd.set("request_id", row.id); fd.set("decision", decision); fd.set("decision_reason", decisionReason);
    startTransition(async () => {
      const result = await decideGeoOverride({}, fd);
      setMessage(m => ({ ...m, [row.id]: result.ok ? strings.decided : (result.error ?? strings.failure) }));
      if (result.ok) window.setTimeout(() => router.refresh(), 1_200);
    });
  }

  return (
    <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }} aria-labelledby="geo-override-queue-heading">
      <h4 id="geo-override-queue-heading" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.heading}</h4>
      <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-200)" }}>{strings.caption}</p>
      {rows.length === 0 ? (
        <EmptyState glyph="✓" title={strings.emptyTitle} body={strings.emptyDesc} inline bare />
      ) : (
        <div className="stack" style={{ gap: "var(--ax-space-200)" }}>
          {rows.map(row => (
            <div key={row.id} className="ax-surface" style={{ padding: "var(--ax-space-200)", borderColor: "var(--ax-color-warning)" }}>
              <div className="ax-row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <strong>{row.factory_name ?? row.visit_id.slice(0, 8)}</strong>
                  <p className="ax-caption">{strings.inspector}: {row.inspector_name ?? "—"} · {row.reason_label}</p>
                </div>
                <span className="ax-lozenge ax-lozenge--warning">{strings.expires}: {stamp(row.expires_at)} UTC</span>
              </div>
              <p style={{ marginBlock: "var(--ax-space-150)" }}>{row.explanation}</p>
              <div className="ax-row ax-caption" style={{ gap: 12, flexWrap: "wrap" }}>
                <span>{strings.captured}: <span className="ax-numeric">{stamp(row.device_occurred_at)} UTC</span></span>
                <span className="ax-numeric">{row.observed_lat.toFixed(6)}, {row.observed_lng.toFixed(6)}</span>
                <span>{strings.accuracy}: <span className="ax-numeric">±{Number(row.accuracy_m).toFixed(1)} m</span></span>
                <span>{strings.distance}: <span className="ax-numeric">{Number(row.distance_m).toFixed(0)} m</span></span>
                {row.safety_security_exception ? <span>{strings.safetyException}</span> : <span>
                  {strings.evidence}: {row.evidence_count}{" "}
                  {row.evidence_url
                    ? <a href={row.evidence_url} target="_blank" rel="noreferrer">{strings.viewEvidence}</a>
                    : row.evidence_count > 0 ? <span>({strings.evidenceUnavailable})</span> : null}
                </span>}
              </div>
              <div className="ax-row" style={{ gap: 8, alignItems: "end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-150)" }}>
                <label className="ax-field" style={{ flex: 1, minInlineSize: 220 }}>
                  <span className="ax-field__label">{strings.rejectReason}</span>
                  <input className="ax-input" value={rejection[row.id] ?? ""} onChange={e => setRejection(v => ({ ...v, [row.id]: e.target.value }))} />
                </label>
                <button className="ax-btn ax-btn--secondary" disabled={pending} onClick={() => decide(row, "rejected")}>{strings.reject}</button>
                <button className="ax-btn ax-btn--field" disabled={pending} onClick={() => decide(row, "approved")}>{strings.approve}</button>
              </div>
              {message[row.id] && <p className="ax-caption" role="status" style={{ marginBlockStart: 8 }}>{pending ? strings.deciding : message[row.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
