"use client";
// CD-021 (SCR-WEB-120 P02 review step) — configure, assign, publish.
// The targeting screen (SCR-WEB-110) selects WHICH factories; this relocated
// review step owns visit configuration (type/package/window/notes) and manual
// inspector assignment (M01-029), then publishes atomically via publishBulkPlan
// (migration 0026). Selection arrives as a client-held id list persisted in
// sessionStorage by the targeting screen; empty selection routes back.
import { useActionState, useEffect, useState } from "react";
import { publishBulkPlan, loadBulkSelection, type BulkResult, type ReviewData } from "../actions";

const SEL_KEY = "cd021-bulk-selection";

export type ReviewStrings = {
  loading: string; unavailable: string; emptyTitle: string; emptyBody: string; backToTargeting: string;
  configTitle: string; visitType: string; typePeriodic: string; packageLabel: string;
  windowStart: string; windowEnd: string; notes: string; notesPlaceholder: string;
  assignTitle: string; colFactory: string; colRisk: string; colInspector: string;
  autoAssign: string; duplicate: string; doubleBooked: string; skipDuplicates: string;
  summaryTitle: string; summarySelected: string; summaryManual: string; summaryAuto: string;
  blockedTitle: string; publish: string; publishing: string; riskBands: Record<string, string>;
};

export default function ReviewClient({ strings }: { strings: ReviewStrings }) {
  const [state, formAction, pending] = useActionState<BulkResult, FormData>(publishBulkPlan, {});
  const [data, setData] = useState<ReviewData | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(false);

  useEffect(() => {
    let stored: string[] = [];
    try { stored = JSON.parse(sessionStorage.getItem(SEL_KEY) ?? "[]"); } catch { stored = []; }
    const clean = Array.isArray(stored) ? stored : [];
    setIds(clean);
    if (clean.length) loadBulkSelection(clean).then(setData).catch(() => setData({ factories: [], packages: [], inspectors: [], unavailable: true }));
    else setData({ factories: [], packages: [], inspectors: [] });
  }, []);

  if (data === null) return <p className="ax-caption">{strings.loading}</p>;
  if (data.unavailable) {
    return <div className="ax-banner ax-banner--critical" role="alert">{strings.unavailable}</div>;
  }
  if (ids.length === 0 || data.factories.length === 0) {
    return (
      <div className="ax-surface" style={{ padding: "var(--ax-space-400)", textAlign: "center" }}>
        <h3>{strings.emptyTitle}</h3>
        <p className="ax-caption">{strings.emptyBody}</p>
        <a className="ax-btn ax-btn--prominent" href="/planning/bulk">{strings.backToTargeting}</a>
      </div>
    );
  }

  const selectable = data.factories.filter(f => !f.dup);
  const pickCount: Record<string, number> = {};
  for (const f of selectable) { const p = picks[f.id] ?? ""; if (p) pickCount[p] = (pickCount[p] ?? 0) + 1; }
  const manualN = selectable.filter(f => (picks[f.id] ?? "") !== "").length;
  const dupCount = data.factories.length - selectable.length;

  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockStart: 0 }}>{strings.configTitle}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--ax-space-200)" }}>
          <div className="ax-field"><label className="ax-field__label">{strings.visitType}</label>
            <select className="ax-select" name="visit_type"><option value="periodic">{strings.typePeriodic}</option></select></div>
          <div className="ax-field"><label className="ax-field__label">{strings.packageLabel}</label>
            <select className="ax-select" name="package_version_id">{data.packages.map(p => <option key={p.id} value={p.id}>{p.code} · {p.version_label}</option>)}</select></div>
          <div className="ax-field"><label className="ax-field__label">{strings.windowStart}</label>
            <input className="ax-input ax-numeric" name="window_start" type="datetime-local" required value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
          <div className="ax-field"><label className="ax-field__label">{strings.windowEnd}</label>
            <input className="ax-input ax-numeric" name="window_end" type="datetime-local" required value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
        </div>
        <div className="ax-field" style={{ marginBlockStart: "var(--ax-space-200)" }}><label className="ax-field__label">{strings.notes}</label>
          <textarea className="ax-textarea" name="notes" rows={2} placeholder={strings.notesPlaceholder} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>

      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockStart: 0 }}>{strings.assignTitle}</h4>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>{strings.colFactory}</th><th className="ax-td-num">{strings.colRisk}</th><th>{strings.colInspector}</th></tr></thead>
          <tbody>
            {data.factories.map(f => {
              const pick = picks[f.id] ?? "";
              const shared = pick ? (pickCount[pick] ?? 0) - 1 : 0;
              return (
                <tr key={f.id}>
                  <td><strong>{f.name}</strong> <span className="ax-caption ax-numeric"><bdi>{f.factory_code}</bdi></span>
                    {f.dup && <div><span className="ax-lozenge ax-lozenge--critical">⛔ {strings.duplicate}</span></div>}</td>
                  <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{(f.risk_band && strings.riskBands[f.risk_band]) ?? "—"} · {f.risk_score ?? "?"}</span></td>
                  <td>
                    {/* hidden id submitted only for non-duplicate rows (or all when skip is on) */}
                    {(!f.dup || skipDuplicates) && <input type="hidden" name="factory_id" value={f.id} />}
                    <select className="ax-select" name={`inspector_${f.id}`} value={pick} disabled={f.dup && !skipDuplicates}
                      onChange={e => setPicks(p => ({ ...p, [f.id]: e.target.value }))} aria-label={strings.colInspector} style={{ minInlineSize: 180 }}>
                      <option value="">{strings.autoAssign}</option>
                      {data.inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
                    </select>
                    {shared > 0 && <div><span className="ax-lozenge ax-lozenge--warning">⚠ {strings.doubleBooked.replace("{n}", String(shared))}</span></div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        {dupCount > 0 && (
          <label className="ax-choice" style={{ display: "flex", gap: "var(--ax-space-100)", marginBlockStart: "var(--ax-space-200)" }}>
            <input type="checkbox" name="skip_duplicates" value="1" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)} />
            <span>{strings.skipDuplicates}</span>
          </label>
        )}
      </div>

      <div className="ax-surface ax-row" style={{ padding: "var(--ax-space-200) var(--ax-space-300)", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-200)", alignItems: "center" }}>
        <div className="ax-row" style={{ gap: "var(--ax-space-300)", flexWrap: "wrap" }}>
          <span><span className="ax-caption">{strings.summarySelected}</span> <strong className="ax-numeric">{selectable.length}</strong></span>
          <span><span className="ax-caption">{strings.summaryManual}</span> <strong className="ax-numeric">{manualN}</strong></span>
          <span><span className="ax-caption">{strings.summaryAuto}</span> <strong className="ax-numeric">{selectable.length - manualN}</strong></span>
        </div>
        <button className="ax-btn ax-btn--prominent" disabled={pending || selectable.length === 0}>{pending ? strings.publishing : strings.publish}</button>
      </div>

      {state.error && <div className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong><ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>}
    </form>
  );
}
