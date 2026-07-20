"use client";
import { useMemo, useState } from "react";

// CD-028 / SCR-WEB-300 — Level 2 review queue (scan-first).
// The queue renders NO decision controls (leg 10): a row opens /reviews/:id,
// where the reviewer explicitly starts and decides. Each row carries the
// Evidence-readiness & SLA-risk fingerprint — labelled facts only, never a
// single severity score or colour-only signal (MVP1-FND-011).

// M06-031 — per-review derived facts. SLA/risk/critical/priority come from the
// accepted config + factory record; the four readiness facts come from
// RLS-scoped joins. Any fact that cannot be read is "unavailable", never
// invented (HANDOFF_BLOCKED_QUEUE_READINESS resolved by real derivation).
export type QueueBadges = {
  slaLabel: string; slaTone: string; slaState: "on_time" | "overdue" | "none";
  riskLabel: string; riskTone: string; riskBand: string | null;
  criticalCount: number; criticalLabel: string;
  priorityLabel: string | null;
};

export type ReadinessFact = "present" | "missing" | "verified" | "updated" | "unavailable";
export type Readiness = { checklist: ReadinessFact; evidence: ReadinessFact; ack: ReadinessFact; factory: ReadinessFact };

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
  modeLabel: string;
  typeLabel: string;
  readiness: Readiness;
  readable: boolean;       // false ⇒ a linked source could not be read for this row
  unassigned: boolean;     // no Level 2 reviewer assigned (claim path stays blocked)
};

export type FingerprintStrings = {
  sla: string; slaOverdue: string; slaOnTime: string; slaUnavailable: string;
  risk: string; critical: string; priority: string;
  checklist: string; evidence: string; ack: string; factory: string;
  present: string; missing: string; verified: string; updated: string; unavailable: string;
  readyBlockTag: string;
  noEvidenceTitle: string; noEvidenceBody: string;
  unassignedTitle: string; unassignedBlocked: string;
};

export type ReviewQueueStrings = {
  searchPlaceholder: string; searchAria: string;
  allStatuses: string; allRisks: string; overdueOnly: string; clearFilters: string;
  showing: string; noMatch: string; noMatchBody: string;
  colFactory: string; colInspector: string; colTypeMode: string;
  colVersion: string; colFingerprint: string;
  colStatus: string; colOpen: string; open: string; openHint: string;
  fpTitle: string; fpHint: string;
  fp: FingerprintStrings;
};

const FACT_GLYPH: Record<ReadinessFact, string> = { present: "●", verified: "●", updated: "◐", missing: "○", unavailable: "◇" };
const FACT_KIND: Record<ReadinessFact, string> = { present: "ok", verified: "ok", updated: "upd", missing: "miss", unavailable: "unknown" };

function FactChip({ label, fact, valueLabel }: { label: string; fact: ReadinessFact; valueLabel: string }) {
  return (
    <span className={`cd-fpchip cd-fpchip--${FACT_KIND[fact]}`}>
      <span className="cd-fpchip__g" aria-hidden="true">{FACT_GLYPH[fact]}</span>
      {label}: {valueLabel}
    </span>
  );
}

// The signature. Two labelled rows: derived SLA/risk facts, then the four
// evidence-readiness facts. Missing SLA is shown "unavailable" (never on-time);
// a risk band is a fact, not a recommendation.
function Fingerprint({ r, s }: { r: QueueRow; s: FingerprintStrings }) {
  const fp = s;
  if (!r.readable) {
    return (
      <div className="cd-fp cd-fp--flag">
        <span className="cd-tag cd-tag--warn">{fp.noEvidenceTitle}</span>
        <span className="cd-sub">{fp.noEvidenceBody}</span>
      </div>
    );
  }
  const factLabel = (f: ReadinessFact) =>
    f === "present" ? fp.present : f === "verified" ? fp.verified : f === "updated" ? fp.updated : f === "missing" ? fp.missing : fp.unavailable;
  return (
    <div className="cd-fp">
      <div className="cd-fp__row">
        {r.slaState === "none"
          ? <span className="cd-fpchip cd-fpchip--unknown" title={fp.slaUnavailable}><span className="cd-fpchip__g" aria-hidden="true">◇</span>{fp.sla}: {fp.unavailable}</span>
          : <span className={`cd-fpchip cd-fpchip--${r.slaState === "overdue" ? "bad" : "ok"}`}><span className="cd-fpchip__g" aria-hidden="true">{r.slaState === "overdue" ? "▲" : "✓"}</span>{fp.sla}: {r.slaState === "overdue" ? fp.slaOverdue : fp.slaOnTime}</span>}
        <span className={`ax-lozenge ${r.riskBand ? r.riskTone : ""}`}>{fp.risk}: {r.riskBand ? r.riskLabel : fp.unavailable}</span>
        {r.criticalCount > 0
          ? <span className="ax-lozenge ax-lozenge--critical">{r.criticalCount} {fp.critical}</span>
          : <span className="cd-sub">0 {fp.critical}</span>}
        {r.priorityLabel && <span className="ax-lozenge ax-lozenge--info">{fp.priority}: {r.priorityLabel}</span>}
      </div>
      <div className="cd-fp__row">
        <FactChip label={fp.checklist} fact={r.readiness.checklist} valueLabel={factLabel(r.readiness.checklist)} />
        <FactChip label={fp.evidence} fact={r.readiness.evidence} valueLabel={factLabel(r.readiness.evidence)} />
        <FactChip label={fp.ack} fact={r.readiness.ack} valueLabel={factLabel(r.readiness.ack)} />
        <FactChip label={fp.factory} fact={r.readiness.factory} valueLabel={factLabel(r.readiness.factory)} />
      </div>
    </div>
  );
}

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
    <div className="cd-queue">
      {/* fingerprint legend — states the contract before the table */}
      <section className="ax-surface cd-panelpad">
        <div className="cd-sectionhead"><h3>{strings.fpTitle}</h3></div>
        <p className="cd-sub">{strings.fpHint}</p>
      </section>
      {/* M06-014/030 — client search + status + risk + overdue-only over the RLS page */}
      <div className="ax-surface cd-filters">
        <label className="cd-fl cd-fl--search"><span className="cd-fl__k">{strings.searchPlaceholder}</span>
          <input className="ax-input" value={q} onChange={e => setQ(e.target.value)} placeholder={strings.searchPlaceholder} aria-label={strings.searchAria} /></label>
        <label className="cd-fl"><span className="cd-fl__k">{strings.allStatuses}</span>
          <select className="ax-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={strings.allStatuses}>
            <option value="">{strings.allStatuses}</option>
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></label>
        <label className="cd-fl"><span className="cd-fl__k">{strings.allRisks}</span>
          <select className="ax-select" value={risk} onChange={e => setRisk(e.target.value)} aria-label={strings.allRisks}>
            <option value="">{strings.allRisks}</option>
            {riskOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></label>
        <label className="cd-choice"><input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} /><span>{strings.overdueOnly}</span></label>
        {hasFilter && <button type="button" className="ax-btn ax-btn--subtle" onClick={clear}>{strings.clearFilters}</button>}
        <span className="t-caption ax-numeric" style={{ marginInlineStart: "auto" }}>
          {strings.showing.replace("{shown}", String(filtered.length)).replace("{total}", String(rows.length))}
        </span>
      </div>
      {filtered.length === 0 ? (
        <section className="ax-surface cd-panelpad cd-result" role="status">
          <div className="cd-result__row"><div className="cd-result__icon cd-result__icon--neutral" aria-hidden="true">🔍</div>
            <div className="cd-stack"><h3 tabIndex={-1}>{strings.noMatch}</h3><p>{strings.noMatchBody}</p></div></div>
        </section>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table cd-table">
          <thead><tr>
            <th scope="col">{strings.colFactory}</th>
            <th scope="col">{strings.colInspector}</th>
            <th scope="col">{strings.colTypeMode}</th>
            <th scope="col">{strings.colVersion}</th>
            <th scope="col">{strings.colFingerprint}</th>
            <th scope="col">{strings.colStatus}</th>
            <th scope="col">{strings.colOpen}</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className={!r.readable || r.unassigned ? "cd-row--flag" : ""}>
                <td>
                  <div className="cd-fname">{r.factoryName}</div>
                  <div className="cd-sub cd-mono"><bdi>{r.factoryCode}</bdi> · <bdi>{r.id.slice(0, 8)}</bdi></div>
                  {r.unassigned && <div className="cd-sub cd-warn">{strings.fp.unassignedTitle} <span className="cd-tag cd-tag--blocked">{strings.fp.unassignedBlocked}</span></div>}
                </td>
                <td>{r.inspectorName || "—"}</td>
                <td className="cd-sub">{r.typeLabel} · {r.modeLabel}</td>
                <td><span className="ax-version">v{r.versionNumber ?? "—"}</span><div className="cd-sub cd-mono ax-numeric">{r.submittedDisplay}</div></td>
                <td><Fingerprint r={r} s={strings.fp} /></td>
                <td><span className={`ax-lozenge ax-lozenge--review ${r.statusTone}`}>{r.statusLabel}</span></td>
                <td><a className="ax-btn ax-btn--secondary" href={r.href} title={strings.openHint}>{strings.open}</a></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
