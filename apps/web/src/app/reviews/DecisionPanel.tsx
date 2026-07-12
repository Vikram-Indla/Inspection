"use client";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { decideReview, type DecisionResult } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type DecisionPanelStrings = {
  heading: string; awaiting: string;
  decisions: Record<string, string>;
  returnScope: string; reason: string; record: string; recording: string;
};

// M06-031 — per-pending-review computed badges (SLA/overdue, risk, critical
// violations, priority). Server computes the values against engine_settings.sla
// and factory risk_band, then hands pre-translated labels + lozenge tones here.
export type QueueBadges = {
  slaLabel: string; slaTone: string; slaState: "on_time" | "overdue" | "none";
  riskLabel: string; riskTone: string; riskBand: string | null;
  criticalCount: number; criticalLabel: string;
  priorityLabel: string | null;
};

function Badges({ b }: { b: QueueBadges }) {
  return (
    <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
      {b.slaState !== "none" && <span className={`ax-lozenge ${b.slaTone}`}>{b.slaLabel}</span>}
      {b.riskBand && <span className={`ax-lozenge ${b.riskTone}`}>{b.riskLabel}</span>}
      {b.criticalCount > 0 && <span className="ax-lozenge ax-lozenge--critical">{b.criticalLabel}</span>}
      {b.priorityLabel && <span className="ax-lozenge ax-lozenge--info">{b.priorityLabel}</span>}
    </div>
  );
}

export default function DecisionPanel({ reviewId, factory, strings, meta }: { reviewId: string; factory: string; strings: DecisionPanelStrings; meta?: QueueBadges }) {
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(decideReview, {});
  const [decision, setDecision] = useState("");
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--ax-space-200)" }}>
        <h4>{strings.heading.replace("{factory}", factory)}</h4>
        <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {meta && <Badges b={meta} />}
          <span className="ax-lozenge ax-lozenge--warning">{strings.awaiting}</span>
        </div>
      </div>
      <input type="hidden" name="review_id" value={reviewId} />
      <div className="ax-row" style={{ gap: "var(--ax-space-300)" }}>
        {(["approve", "return", "reject"] as const).map(d => (
          <label key={d} className="ax-choice" style={{ display: "flex" }}>
            <input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} />
            <span>{strings.decisions[d] ?? d}</span>
          </label>
        ))}
      </div>
      {decision === "return" && (
        <div className="ax-field" style={{ maxInlineSize: "none" }}>
          <label className="ax-field__label">{strings.returnScope}</label>
          <input className="ax-input" name="returned_sections" placeholder="s1, s3" />
        </div>
      )}
      <div className="ax-field" style={{ maxInlineSize: "none" }}>
        <label className="ax-field__label">{strings.reason}</label>
        <textarea className="ax-input" name="reason" rows={2} required />
      </div>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending || !decision}>
          {pending ? strings.recording : strings.record}
        </button>
      </div>
    </form>
  );
}

// M06-013/014/016/030/031 — the review queue itself: enriched columns (inspector,
// execution mode, visit type, factory risk, SLA/overdue, critical count, priority)
// plus client-side search/status/risk/overdue filters over the loaded RLS page.
export type QueueRow = QueueBadges & {
  id: string;              // review id
  href: string;            // /reviews/{inspectionId}
  factoryName: string;
  factoryCode: string;
  inspectorName: string;
  versionNumber: number | null;
  submittedDisplay: string;
  status: string;          // raw enum for filtering
  statusLabel: string;
  statusTone: string;
  decisionLabel: string;
  returnScope: string;
  reason: string;
  modeLabel: string;
  typeLabel: string;
};

export type ReviewQueueStrings = {
  searchPlaceholder: string; searchAria: string;
  allStatuses: string; allRisks: string; overdueOnly: string; clearFilters: string;
  showing: string;         // "{shown}" / "{total}"
  noMatch: string;
  colFactory: string; colInspector: string; colTypeMode: string;
  colSubmitted: string; colVersion: string; colRisk: string; colSla: string;
  colCritical: string; colPriority: string; colStatus: string; colDecision: string;
  colReturnScope: string; colReason: string; colOpen: string; open: string;
};

export function ReviewQueue({ rows, statusOptions, riskOptions, strings }: {
  rows: QueueRow[];
  statusOptions: { value: string; label: string }[];
  riskOptions: { value: string; label: string }[];
  strings: ReviewQueueStrings;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [overdue, setOverdue] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      const hit = !needle || `${r.factoryName} ${r.factoryCode} ${r.inspectorName}`.toLowerCase().includes(needle);
      return hit && (!status || r.status === status) && (!risk || r.riskBand === risk) && (!overdue || r.slaState === "overdue");
    });
  }, [rows, q, status, risk, overdue]);

  const hasFilter = !!q || !!status || !!risk || overdue;
  const clear = () => { setQ(""); setStatus(""); setRisk(""); setOverdue(false); };

  return (
    <div className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      {/* M06-014/030 — client search + status + risk + overdue-only over the RLS page */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-200)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)", alignItems: "center" }}>
        <input className="ax-input" style={{ inlineSize: 260 }} value={q} onChange={e => setQ(e.target.value)}
          placeholder={strings.searchPlaceholder} aria-label={strings.searchAria} />
        <select className="ax-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={strings.allStatuses}>
          <option value="">{strings.allStatuses}</option>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="ax-select" value={risk} onChange={e => setRisk(e.target.value)} aria-label={strings.allRisks}>
          <option value="">{strings.allRisks}</option>
          {riskOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label className="ax-choice" style={{ display: "flex", gap: "var(--ax-space-100)", alignItems: "center" }}>
          <input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} />
          <span>{strings.overdueOnly}</span>
        </label>
        {hasFilter && <button type="button" className="ax-btn ax-btn--subtle" onClick={clear}>{strings.clearFilters}</button>}
        <span className="ax-caption ax-numeric" style={{ marginInlineStart: "auto" }}>
          {strings.showing.replace("{shown}", String(filtered.length)).replace("{total}", String(rows.length))}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🔍</span><h4>{strings.noMatch}</h4></div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th>{strings.colFactory}</th>
            <th>{strings.colInspector}</th>
            <th>{strings.colTypeMode}</th>
            <th>{strings.colRisk}</th>
            <th>{strings.colSla}</th>
            <th className="ax-td-num">{strings.colCritical}</th>
            <th>{strings.colPriority}</th>
            <th>{strings.colVersion}</th>
            <th className="ax-td-num">{strings.colSubmitted}</th>
            <th>{strings.colStatus}</th>
            <th>{strings.colDecision}</th>
            <th>{strings.colReturnScope}</th>
            <th>{strings.colReason}</th>
            <th>{strings.colOpen}</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><strong>{r.factoryName}</strong> <span className="ax-caption">{r.factoryCode}</span></td>
                <td>{r.inspectorName || "—"}</td>
                <td><span className="ax-caption">{r.typeLabel} · {r.modeLabel}</span></td>
                <td>{r.riskBand ? <span className={`ax-lozenge ${r.riskTone}`}>{r.riskLabel}</span> : "—"}</td>
                <td>{r.slaState !== "none" ? <span className={`ax-lozenge ${r.slaTone}`}>{r.slaLabel}</span> : "—"}</td>
                <td className="ax-td-num ax-numeric">{r.criticalCount > 0 ? <span className="ax-lozenge ax-lozenge--critical">{r.criticalCount}</span> : "0"}</td>
                <td>{r.priorityLabel ? <span className="ax-lozenge ax-lozenge--info">{r.priorityLabel}</span> : "—"}</td>
                <td><span className="ax-version">v{r.versionNumber ?? "—"}</span></td>
                <td className="ax-td-num ax-numeric">{r.submittedDisplay}</td>
                <td><span className={`ax-lozenge ax-lozenge--review ${r.statusTone}`}>{r.statusLabel}</span></td>
                <td>{r.decisionLabel}</td>
                <td>{r.returnScope}</td>
                <td className="ax-caption">{r.reason}</td>
                <td><a className="ax-btn ax-btn--subtle" href={r.href}>{strings.open}</a></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
