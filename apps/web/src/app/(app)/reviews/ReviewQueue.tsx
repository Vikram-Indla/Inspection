"use client";

import { useMemo, useState } from "react";

export type QueueBadges = {
  slaLabel: string;
  slaTone: string;
  slaState: "on_time" | "overdue" | "none";
  riskLabel: string;
  riskTone: string;
  riskBand: string | null;
  criticalCount: number;
  criticalLabel: string;
  priorityLabel: string | null;
};

export type ReadinessFact = "present" | "missing" | "verified" | "updated" | "unavailable";
export type Readiness = {
  checklist: ReadinessFact;
  evidence: ReadinessFact;
  ack: ReadinessFact;
  factory: ReadinessFact;
};

export type QueueRow = QueueBadges & {
  id: string;
  href: string;
  factoryName: string;
  factoryCode: string;
  inspectorName: string;
  versionNumber: number | null;
  submittedDisplay: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  modeLabel: string;
  typeLabel: string;
  readiness: Readiness;
  readable: boolean;
  unassigned: boolean;
};

type FingerprintStrings = {
  sla: string;
  slaOverdue: string;
  slaOnTime: string;
  slaUnavailable: string;
  risk: string;
  critical: string;
  priority: string;
  checklist: string;
  evidence: string;
  ack: string;
  factory: string;
  present: string;
  missing: string;
  verified: string;
  updated: string;
  unavailable: string;
  readyBlockTag: string;
  noEvidenceTitle: string;
  noEvidenceBody: string;
  unassignedTitle: string;
  unassignedBlocked: string;
};

export type ReviewQueueStrings = {
  searchPlaceholder: string;
  searchAria: string;
  allStatuses: string;
  allRisks: string;
  overdueOnly: string;
  clearFilters: string;
  showing: string;
  noMatch: string;
  noMatchBody: string;
  colFactory: string;
  colInspector: string;
  colTypeMode: string;
  colVersion: string;
  colFingerprint: string;
  colStatus: string;
  colOpen: string;
  open: string;
  openHint: string;
  fpTitle: string;
  fpHint: string;
  fp: FingerprintStrings;
};

const FACT_GLYPH: Record<ReadinessFact, string> = {
  present: "●",
  verified: "●",
  updated: "◐",
  missing: "○",
  unavailable: "◇",
};
const FACT_KIND: Record<ReadinessFact, string> = {
  present: "ok",
  verified: "ok",
  updated: "upd",
  missing: "miss",
  unavailable: "unknown",
};

function FactChip({ label, fact, valueLabel }: { label: string; fact: ReadinessFact; valueLabel: string }) {
  return (
    <span className={`cd-fpchip cd-fpchip--${FACT_KIND[fact]}`}>
      <span className="cd-fpchip__g" aria-hidden="true">{FACT_GLYPH[fact]}</span>
      {label}: {valueLabel}
    </span>
  );
}

function Fingerprint({ row, strings }: { row: QueueRow; strings: FingerprintStrings }) {
  if (!row.readable) {
    return (
      <div className="cd-fp cd-fp--flag">
        <span className="cd-tag cd-tag--warn">{strings.noEvidenceTitle}</span>
        <span className="cd-sub">{strings.noEvidenceBody}</span>
      </div>
    );
  }

  const factLabel = (fact: ReadinessFact) => {
    if (fact === "present") return strings.present;
    if (fact === "verified") return strings.verified;
    if (fact === "updated") return strings.updated;
    if (fact === "missing") return strings.missing;
    return strings.unavailable;
  };

  return (
    <div className="cd-fp">
      <div className="cd-fp__row">
        {row.slaState === "none" ? (
          <span className="cd-fpchip cd-fpchip--unknown" title={strings.slaUnavailable}>
            <span className="cd-fpchip__g" aria-hidden="true">◇</span>
            {strings.sla}: {strings.unavailable}
          </span>
        ) : (
          <span className={`cd-fpchip cd-fpchip--${row.slaState === "overdue" ? "bad" : "ok"}`}>
            <span className="cd-fpchip__g" aria-hidden="true">{row.slaState === "overdue" ? "▲" : "✓"}</span>
            {strings.sla}: {row.slaState === "overdue" ? strings.slaOverdue : strings.slaOnTime}
          </span>
        )}
        <span className={`sq-lozenge ${row.riskBand ? row.riskTone : ""}`}>
          {strings.risk}: {row.riskBand ? row.riskLabel : strings.unavailable}
        </span>
        {row.criticalCount > 0
          ? <span className="badge badge-critical">{row.criticalCount} {strings.critical}</span>
          : <span className="cd-sub">0 {strings.critical}</span>}
        {row.priorityLabel && <span className="badge badge-info">{strings.priority}: {row.priorityLabel}</span>}
      </div>
      <div className="cd-fp__row">
        <FactChip label={strings.checklist} fact={row.readiness.checklist} valueLabel={factLabel(row.readiness.checklist)} />
        <FactChip label={strings.evidence} fact={row.readiness.evidence} valueLabel={factLabel(row.readiness.evidence)} />
        <FactChip label={strings.ack} fact={row.readiness.ack} valueLabel={factLabel(row.readiness.ack)} />
        <FactChip label={strings.factory} fact={row.readiness.factory} valueLabel={factLabel(row.readiness.factory)} />
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => {
      const searchable = `${row.factoryName} ${row.factoryCode} ${row.inspectorName}`.toLowerCase();
      return (!needle || searchable.includes(needle))
        && (!status || row.status === status)
        && (!risk || row.riskBand === risk)
        && (!overdueOnly || row.slaState === "overdue");
    });
  }, [rows, query, status, risk, overdueOnly]);
  const hasFilter = !!query || !!status || !!risk || overdueOnly;

  const clear = () => {
    setQuery("");
    setStatus("");
    setRisk("");
    setOverdueOnly(false);
  };

  return (
    <div className="cd-queue">
      <section className="panel cd-panelpad">
        <div className="cd-sectionhead"><h2>{strings.fpTitle}</h2></div>
        <p className="cd-sub">{strings.fpHint}</p>
      </section>
      <div className="panel cd-filters">
        <label className="cd-fl cd-fl--search">
          <span className="cd-fl__k">{strings.searchPlaceholder}</span>
          <input className="sq-input" value={query} onChange={event => setQuery(event.target.value)}
            placeholder={strings.searchPlaceholder} aria-label={strings.searchAria} />
        </label>
        {/* CLASS-CONTRACT.md § Review & Approval — fixed 5-option seg
            (Submitted/In review/Returned/Approved/Rejected), not a dropdown. */}
        <div className="seg" role="group" aria-label={strings.allStatuses}>
          {statusOptions.map(option => (
            <button key={option.value} type="button" className="seg-opt" aria-pressed={status === option.value}
              onClick={() => setStatus(current => current === option.value ? "" : option.value)}>{option.label}</button>
          ))}
        </div>
        <label className="cd-fl">
          <span className="cd-fl__k">{strings.allRisks}</span>
          <select className="sq-select" value={risk} onChange={event => setRisk(event.target.value)} aria-label={strings.allRisks}>
            <option value="">{strings.allRisks}</option>
            {riskOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="cd-choice">
          <input type="checkbox" checked={overdueOnly} onChange={event => setOverdueOnly(event.target.checked)} />
          <span>{strings.overdueOnly}</span>
        </label>
        {hasFilter && <button type="button" className="btn btn-ghost btn-touch" onClick={clear}>{strings.clearFilters}</button>}
        <span className="t-caption numeric" style={{ marginInlineStart: "auto" }}>
          {strings.showing.replace("{shown}", String(filtered.length)).replace("{total}", String(rows.length))}
        </span>
      </div>
      {filtered.length === 0 ? (
        <section className="panel cd-panelpad cd-result" role="status">
          <div className="cd-result__row">
            <div className="cd-result__icon cd-result__icon--neutral" aria-hidden="true">⌕</div>
            <div className="cd-stack"><h2>{strings.noMatch}</h2><p>{strings.noMatchBody}</p></div>
          </div>
        </section>
      ) : (
        <div className="sq-tablewrap">
          <table className="sq-table cd-table">
            <thead><tr>
              <th scope="col">{strings.colFactory}</th>
              <th scope="col">{strings.colInspector}</th>
              <th scope="col">{strings.colTypeMode}</th>
              <th scope="col">{strings.colVersion}</th>
              <th scope="col">{strings.colFingerprint}</th>
              <th scope="col">{strings.colStatus}</th>
              <th scope="col">{strings.colOpen}</th>
            </tr></thead>
            <tbody>{filtered.map(row => (
              <tr key={row.id} className={!row.readable || row.unassigned ? "cd-row--flag" : ""}>
                <td>
                  <div className="cd-fname">{row.factoryName}</div>
                  <div className="cd-sub cd-mono"><bdi>{row.factoryCode}</bdi> · <bdi>{row.id.slice(0, 8)}</bdi></div>
                  {row.unassigned && <div className="cd-sub cd-warn">{strings.fp.unassignedTitle} <span className="cd-tag cd-tag--blocked">{strings.fp.unassignedBlocked}</span></div>}
                </td>
                <td>{row.inspectorName || "—"}</td>
                <td className="cd-sub">{row.typeLabel} · {row.modeLabel}</td>
                <td><span className="sq-version">v{row.versionNumber ?? "—"}</span><div className="cd-sub cd-mono numeric">{row.submittedDisplay}</div></td>
                <td><Fingerprint row={row} strings={strings.fp} /></td>
                <td><span className={`sq-lozenge sq-lozenge--review ${row.statusTone}`}>{row.statusLabel}</span></td>
                <td><a className="btn btn-secondary btn-touch" href={row.href} title={strings.openHint}>{strings.open}</a></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
