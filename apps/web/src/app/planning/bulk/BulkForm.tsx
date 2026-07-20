"use client";
import { useEffect, useMemo, useState } from "react";

// CD-021 (SCR-WEB-110) — evidence table + persistent selection (frames 1a/1d).
// This screen is TARGETING only: which factories, with the provenance to trust
// the choice. Visit configuration, inspector assignment and publish are the P02
// review step (/planning/bulk/review). Pagination, filter and selection are
// client-side over the criteria-narrowed eligible set so selection persists
// across paging and filtering; selection is persisted to sessionStorage and
// reconciled on mount so a criteria change dropping selected rows prompts an
// explicit confirmation (never a silent drop) and carries forward to review.
type F = {
  id: string; factory_code: string; name: string; cr_number: string;
  city: string | null; region: string | null; risk_band: string | null; risk_score: number | null;
  activity_class: string | null;
  official_lat: number | null; official_lng: number | null; source_synced_at: string | null;
  visits: { planning_status: string; visit_type: string }[];
};

export type BulkFormStrings = {
  colFactory: string; colCr: string; colCity: string; colRisk: string; colEligibility: string;
  colProvenance: string; colDataQuality: string;
  selectFactory: string; eligible: string; duplicate: string; riskAdvisory: string;
  filterLabel: string; filterPlaceholder: string; resultsCount: string;
  selectVisible: string; selectAllResults: string; clearSelection: string;
  pagePrev: string; pageNext: string; pageStatus: string;
  provSynced: string; provNoSync: string;
  dqComplete: string; dqNoLocation: string; dqUnknownRisk: string;
  selectionBar: string; readyNothing: string; reviewContinue: string;
  invalidTitle: string; invalidBody: string; invalidKeep: string; invalidClear: string;
  summaryTitle: string; summarySelected: string; summaryByBand: string; summaryByRegion: string; summaryEmpty: string;
  riskBands: Record<string, string>;
  selectAllConfirmTitle: string; selectAllConfirmBody: string; selectAllConfirmInputLabel: string;
  selectAllConfirmButton: string; selectAllConfirmCancel: string;
};

const PAGE_SIZE = 25;
const SEL_KEY = "cd021-bulk-selection";
const dupOf = (f: F) => f.visits.some(v => ["draft", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");

export default function BulkForm({ factories, strings, focusedField, focusedValue }: {
  factories: F[]; strings: BulkFormStrings; focusedField?: string | null; focusedValue?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [invalidDropped, setInvalidDropped] = useState(0);
  const [confirmingSelectAll, setConfirmingSelectAll] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const idSet = useMemo(() => new Set(factories.map(f => f.id)), [factories]);

  useEffect(() => {
    let stored: string[] = [];
    try { stored = JSON.parse(sessionStorage.getItem(SEL_KEY) ?? "[]"); } catch { stored = []; }
    if (!Array.isArray(stored) || stored.length === 0) return;
    const valid = stored.filter(id => idSet.has(id));
    const dropped = stored.length - valid.length;
    setSelected(new Set(valid));
    if (dropped > 0) setInvalidDropped(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { sessionStorage.setItem(SEL_KEY, JSON.stringify([...selected])); } catch { /* private mode */ } }, [selected]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return factories;
    return factories.filter(f => [f.name, f.factory_code, f.cr_number, f.city ?? "", f.region ?? ""].some(s => s.toLowerCase().includes(needle)));
  }, [factories, q]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  const toggle = (id: string, on: boolean) => setSelected(s => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
  const selectVisible = () => setSelected(s => { const n = new Set(s); for (const f of pageRows) if (!dupOf(f)) n.add(f.id); return n; });
  const confirmSelectAllResults = () => {
    setSelected(s => { const n = new Set(s); for (const f of filtered) if (!dupOf(f)) n.add(f.id); return n; });
    setConfirmingSelectAll(false); setConfirmInput("");
  };
  const clearSelection = () => setSelected(new Set());

  const sel = factories.filter(f => selected.has(f.id));
  const countBy = (keyOf: (f: F) => string) => { const o: Record<string, number> = {}; for (const f of sel) { const k = keyOf(f); o[k] = (o[k] ?? 0) + 1; } return o; };
  const byBand = countBy(f => f.risk_band ?? "—");
  const byRegion = countBy(f => f.region ?? "—");

  const provenance = (f: F) => f.source_synced_at ? strings.provSynced.replace("{d}", new Date(f.source_synced_at).toISOString().slice(0, 10)) : strings.provNoSync;
  const dataQuality = (f: F) => {
    const flags: { label: string; kind: string }[] = [];
    if (f.official_lat == null || f.official_lng == null) flags.push({ label: strings.dqNoLocation, kind: "critical" });
    if (f.risk_band == null) flags.push({ label: strings.dqUnknownRisk, kind: "warning" });
    return flags;
  };

  return (
    <div className="stack" style={{ gap: "var(--ax-space-300)" }}>
      {invalidDropped > 0 && (
        <div className="ax-banner ax-banner--warning" role="alertdialog" aria-label={strings.invalidTitle}>
          <div>
            <strong>{strings.invalidTitle}</strong>
            <p>{strings.invalidBody.replace("{n}", String(invalidDropped))}</p>
            <div className="row" style={{ gap: "var(--ax-space-150)" }}>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setInvalidDropped(0)}>{strings.invalidKeep}</button>
              <button type="button" className="ax-btn ax-btn--subtle" onClick={() => { clearSelection(); setInvalidDropped(0); }}>{strings.invalidClear}</button>
            </div>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="ax-field" style={{ maxInlineSize: 280, flex: 1 }}>
          <label className="ax-field__label" htmlFor="bulk-filter">{strings.filterLabel}</label>
          <input id="bulk-filter" className="ax-input" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder={strings.filterPlaceholder} />
        </div>
        <button type="button" className="ax-btn ax-btn--secondary" onClick={selectVisible}>{strings.selectVisible}</button>
        <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setConfirmingSelectAll(true)}>{strings.selectAllResults}</button>
        <span className="ax-caption ax-numeric" role="status" aria-live="polite">{strings.resultsCount.replace("{n}", String(filtered.length))}</span>
      </div>

      {confirmingSelectAll && (
        <div className="ax-banner ax-banner--warning" role="alertdialog" aria-label={strings.selectAllConfirmTitle}>
          <div>
            <strong>{strings.selectAllConfirmTitle}</strong>
            <p>{strings.selectAllConfirmBody.replaceAll("{n}", String(filtered.length))}</p>
            <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end" }}>
              <div className="ax-field" style={{ maxInlineSize: 140 }}>
                <label className="ax-field__label" htmlFor="select-all-confirm-input">{strings.selectAllConfirmInputLabel}</label>
                <input id="select-all-confirm-input" className="ax-input ax-numeric" value={confirmInput} onChange={e => setConfirmInput(e.target.value)} inputMode="numeric" />
              </div>
              <button type="button" className="ax-btn ax-btn--prominent" disabled={confirmInput.trim() !== String(filtered.length)} onClick={confirmSelectAllResults}>
                {strings.selectAllConfirmButton.replace("{n}", String(filtered.length))}
              </button>
              <button type="button" className="ax-btn ax-btn--subtle" onClick={() => { setConfirmingSelectAll(false); setConfirmInput(""); }}>{strings.selectAllConfirmCancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr>
          <th scope="col" style={{ inlineSize: 36 }}></th>
          <th scope="col">{strings.colFactory}</th><th scope="col">{strings.colCr}</th><th scope="col">{strings.colCity}</th>
          <th scope="col" className="ax-td-num">{strings.colRisk}</th><th scope="col">{strings.colEligibility}</th>
          <th scope="col">{strings.colProvenance}</th><th scope="col">{strings.colDataQuality}</th>
        </tr></thead>
        <tbody>
          {pageRows.map(f => {
            const dup = dupOf(f);
            const dq = dataQuality(f);
            const isFocused = focusedField != null && focusedValue != null
              && String((f as unknown as Record<string, unknown>)[focusedField] ?? "").toLowerCase() === focusedValue.toLowerCase();
            return (
              <tr key={f.id} style={isFocused ? { outline: "2px solid var(--ax-color-primary)", outlineOffset: -2 } : undefined}>
                <td><input type="checkbox" disabled={dup} checked={selected.has(f.id)} onChange={e => toggle(f.id, e.target.checked)} aria-label={strings.selectFactory.replace("{name}", f.name)} /></td>
                <td><a href={`/factories/${f.id}`} target="_blank" rel="noreferrer"><strong>{f.name}</strong></a> <span className="ax-caption ax-numeric"><bdi>{f.factory_code}</bdi></span></td>
                <td className="ax-numeric"><bdi>{f.cr_number}</bdi></td>
                <td>{f.city ?? "—"}</td>
                <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{(f.risk_band && strings.riskBands[f.risk_band]) ?? "—"} · {f.risk_score ?? "?"}</span></td>
                <td>{dup ? <span className="ax-lozenge ax-lozenge--critical">⛔ {strings.duplicate}</span> : <span className="ax-lozenge ax-lozenge--success">✓ {strings.eligible}</span>}</td>
                <td className="ax-caption ax-numeric"><span className="ax-freshness"><bdi>{provenance(f)}</bdi></span></td>
                <td>{dq.length === 0 ? <span className="ax-caption">{strings.dqComplete}</span> : dq.map(d => <div key={d.label}><span className={`ax-lozenge ax-lozenge--${d.kind}`}>{d.kind === "critical" ? "⛔" : "⚠"} {d.label}</span></div>)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <p className="ax-caption">{strings.riskAdvisory}</p>

      <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center", justifyContent: "center" }}>
        <button type="button" className="ax-btn ax-btn--subtle" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={clampedPage === 0}>{strings.pagePrev}</button>
        <span className="ax-caption ax-numeric" role="status" aria-live="polite">
          {strings.pageStatus.replace("{a}", String(filtered.length === 0 ? 0 : clampedPage * PAGE_SIZE + 1)).replace("{b}", String(Math.min(filtered.length, (clampedPage + 1) * PAGE_SIZE))).replace("{n}", String(filtered.length))}
        </span>
        <button type="button" className="ax-btn ax-btn--subtle" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={clampedPage >= pageCount - 1}>{strings.pageNext}</button>
      </div>

      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.summaryTitle}</h4>
        {sel.length === 0 ? <p className="ax-caption">{strings.summaryEmpty}</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--ax-space-200)" }}>
            <div><span className="ax-caption">{strings.summarySelected}</span><div className="ax-numeric"><strong>{sel.length}</strong></div></div>
            <div><span className="ax-caption">{strings.summaryByBand}</span>
              <div className="row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                {Object.entries(byBand).map(([b, n]) => <span key={b} className={`ax-lozenge ${b === "high" ? "ax-lozenge--critical" : b === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{strings.riskBands[b] ?? b} · {n}</span>)}
              </div></div>
            <div><span className="ax-caption">{strings.summaryByRegion}</span>
              <div className="row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                {Object.entries(byRegion).map(([r, n]) => <span key={r} className="ax-lozenge ax-lozenge--info"><bdi>{r}</bdi> · {n}</span>)}
              </div></div>
          </div>
        )}
      </div>

      {/* persistent selection bar — cross-page count + hand-off to the P02 review step */}
      <div className="ax-surface row" style={{ position: "sticky", insetBlockEnd: 0, padding: "var(--ax-space-200) var(--ax-space-300)", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-200)", alignItems: "center" }}>
        <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
          <strong className="ax-numeric" aria-live="polite">{strings.selectionBar.replace("{n}", String(selected.size))}</strong>
          {selected.size === 0 && <span className="ax-lozenge ax-lozenge--warning">⚠ {strings.readyNothing}</span>}
          {selected.size > 0 && <button type="button" className="ax-btn ax-btn--subtle" onClick={clearSelection}>{strings.clearSelection}</button>}
        </div>
        {selected.size > 0
          ? <a className="ax-btn ax-btn--prominent" href="/planning/bulk/review">{strings.reviewContinue} →</a>
          : <button type="button" className="ax-btn ax-btn--prominent" disabled>{strings.reviewContinue} →</button>}
      </div>
    </div>
  );
}
