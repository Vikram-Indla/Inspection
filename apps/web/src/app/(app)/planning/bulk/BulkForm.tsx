"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { IconBlocked } from "@/app/icons";
import { saveBulkDraft } from "./actions";

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
  saveDraft: string; savingDraft: string; draftSaved: string; draftSaveFailed: string; reviewFallback: string;
};

const PAGE_SIZE = 25;
const SEL_KEY = "cd021-bulk-selection";
// M6 — hard cap on any bulk selection (matches the server-side 500-row guard).
const SELECTION_CAP = 500;
// M6 — 'validated' is an internal ACTIVE plan state: it blocks duplicates
// exactly like draft/published/returned.
const dupOf = (f: F) => f.visits.some(v => ["draft", "validated", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");

export default function BulkForm({ factories, strings, focusedField, focusedValue, locale, criteriaTree }: {
  factories: F[]; strings: BulkFormStrings; focusedField?: string | null; focusedValue?: string | null; locale: Locale;
  criteriaTree: string;
}) {
  // PLN-S05/PLN-S08 — targeting remains usable in browser state, but the
  // corrected compiler does not yet authorize durable draft persistence.
  const draftPersistenceExecutable = false;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [invalidDropped, setInvalidDropped] = useState(0);
  const [confirmingSelectAll, setConfirmingSelectAll] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  // M6 — persisted draft state: after a successful save the plan id is held so
  // subsequent saves (and the review hand-off) upsert the same draft row.
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftRef, setDraftRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
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

  const toggle = (id: string, on: boolean) => setSelected(s => { const n = new Set(s); if (on) { if (n.size >= SELECTION_CAP) return n; n.add(id); } else n.delete(id); return n; });
  const selectVisible = () => setSelected(s => { const n = new Set(s); for (const f of pageRows) { if (n.size >= SELECTION_CAP) break; if (!dupOf(f)) n.add(f.id); } return n; });
  const confirmSelectAllResults = () => {
    setSelected(s => { const n = new Set(s); for (const f of filtered) { if (n.size >= SELECTION_CAP) break; if (!dupOf(f)) n.add(f.id); } return n; });
    setConfirmingSelectAll(false); setConfirmInput("");
  };
  const clearSelection = () => setSelected(new Set());

  // M6 — persist the working state as a bulk draft (visit_plans, method 'bulk',
  // status 'draft'). The review hand-off saves first and lands on
  // /planning/bulk/review?plan=<id>; when the save fails the planner is told
  // honestly and can still continue with the browser-held selection.
  const saveDraft = async (): Promise<{ planId: string; planReference: string } | null> => {
    setSaving(true); setSaveFailed(false);
    try {
      const res = await saveBulkDraft({ planId: draftId ?? undefined, criteriaTree, selection: [...selected] });
      if (res.error || !res.planId) { setSaveFailed(true); return null; }
      setDraftId(res.planId);
      setDraftRef(res.planReference ?? null);
      return { planId: res.planId, planReference: res.planReference ?? "" };
    } catch {
      setSaveFailed(true);
      return null;
    } finally {
      setSaving(false);
    }
  };
  const onSaveDraftClick = () => { void saveDraft(); };
  const onReviewClick = async () => {
    if (!draftPersistenceExecutable) {
      router.push("/planning/bulk/review");
      return;
    }
    const saved = await saveDraft();
    if (saved) router.push(`/planning/bulk/review?plan=${saved.planId}`);
  };

  const sel = factories.filter(f => selected.has(f.id));
  const countBy = (keyOf: (f: F) => string) => { const o: Record<string, number> = {}; for (const f of sel) { const k = keyOf(f); o[k] = (o[k] ?? 0) + 1; } return o; };
  const byBand = countBy(f => f.risk_band ?? "—");
  const byRegion = countBy(f => f.region ?? "—");

  const provenance = (f: F) => f.source_synced_at ? strings.provSynced.replace("{d}", formatDate(f.source_synced_at, locale === "ar" ? "ar" : "en")) : strings.provNoSync;
  const dataQuality = (f: F) => {
    const flags: { label: string; kind: string }[] = [];
    if (f.official_lat == null || f.official_lng == null) flags.push({ label: strings.dqNoLocation, kind: "critical" });
    if (f.risk_band == null) flags.push({ label: strings.dqUnknownRisk, kind: "warning" });
    return flags;
  };

  return (
    <div className="stack" style={{ gap: "var(--space-6)" }}>
      {invalidDropped > 0 && (
        <div className="sq-banner sq-banner--warning" role="alertdialog" aria-label={strings.invalidTitle}>
          <div>
            <strong>{strings.invalidTitle}</strong>
            <p>{strings.invalidBody.replace("{n}", String(invalidDropped))}</p>
            <div className="row" style={{ gap: "var(--space-3)" }}>
              <button type="button" className="sq-btn sq-btn--secondary" onClick={() => setInvalidDropped(0)}>{strings.invalidKeep}</button>
              <button type="button" className="sq-btn sq-btn--subtle" onClick={() => { clearSelection(); setInvalidDropped(0); }}>{strings.invalidClear}</button>
            </div>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ maxInlineSize: 280, flex: 1 }}>
          <label className="sq-field__label" htmlFor="bulk-filter">{strings.filterLabel}</label>
          <input id="bulk-filter" className="input" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder={strings.filterPlaceholder} />
        </div>
        <button type="button" className="sq-btn sq-btn--secondary" onClick={selectVisible}>{strings.selectVisible}</button>
        <button type="button" className="sq-btn sq-btn--secondary" onClick={() => setConfirmingSelectAll(true)}>{strings.selectAllResults}</button>
        <span className="t-caption sq-numeric" role="status" aria-live="polite">{strings.resultsCount.replace("{n}", String(filtered.length))}</span>
      </div>

      {confirmingSelectAll && (
        <div className="sq-banner sq-banner--warning" role="alertdialog" aria-label={strings.selectAllConfirmTitle}>
          <div>
            <strong>{strings.selectAllConfirmTitle}</strong>
            <p>{strings.selectAllConfirmBody.replaceAll("{n}", String(filtered.length))}</p>
            <div className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end" }}>
              <div className="field" style={{ maxInlineSize: 140 }}>
                <label className="sq-field__label" htmlFor="select-all-confirm-input">{strings.selectAllConfirmInputLabel}</label>
                <input id="select-all-confirm-input" className="input sq-numeric" value={confirmInput} onChange={e => setConfirmInput(e.target.value)} inputMode="numeric" />
              </div>
              <button type="button" className="sq-btn sq-btn--prominent" disabled={confirmInput.trim() !== String(filtered.length)} onClick={confirmSelectAllResults}>
                {strings.selectAllConfirmButton.replace("{n}", String(filtered.length))}
              </button>
              <button type="button" className="sq-btn sq-btn--subtle" onClick={() => { setConfirmingSelectAll(false); setConfirmInput(""); }}>{strings.selectAllConfirmCancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className="sq-tablewrap"><table className="sq-table">
        <thead><tr>
          <th scope="col" style={{ inlineSize: 36 }}></th>
          <th scope="col">{strings.colFactory}</th><th scope="col">{strings.colCr}</th><th scope="col">{strings.colCity}</th>
          <th scope="col" className="sq-td-num">{strings.colRisk}</th><th scope="col">{strings.colEligibility}</th>
          <th scope="col">{strings.colProvenance}</th><th scope="col">{strings.colDataQuality}</th>
        </tr></thead>
        <tbody>
          {pageRows.map(f => {
            const dup = dupOf(f);
            const dq = dataQuality(f);
            const isFocused = focusedField != null && focusedValue != null
              && String((f as unknown as Record<string, unknown>)[focusedField] ?? "").toLowerCase() === focusedValue.toLowerCase();
            return (
              <tr key={f.id} style={isFocused ? { outline: "2px solid var(--action-primary)", outlineOffset: -2 } : undefined}>
                <td><input type="checkbox" disabled={dup} checked={selected.has(f.id)} onChange={e => toggle(f.id, e.target.checked)} aria-label={strings.selectFactory.replace("{name}", f.name)} /></td>
                <td><a href={`/factories/${f.id}`} target="_blank" rel="noreferrer"><strong>{f.name}</strong></a> <span className="t-caption sq-numeric"><bdi>{f.factory_code}</bdi></span></td>
                <td className="sq-numeric"><bdi>{f.cr_number}</bdi></td>
                <td>{f.city ?? "—"}</td>
                <td className="sq-td-num"><span className={`sq-lozenge ${f.risk_band === "high" ? "sq-lozenge--critical" : f.risk_band === "medium" ? "sq-lozenge--warning" : "sq-lozenge--success"}`}>{(f.risk_band && strings.riskBands[f.risk_band]) ?? "—"} · {f.risk_score ?? "?"}</span></td>
                <td>{dup ? <span className="sq-lozenge sq-lozenge--critical"><IconBlocked size={16} /> {strings.duplicate}</span> : <span className="sq-lozenge sq-lozenge--success">✓ {strings.eligible}</span>}</td>
                <td className="t-caption sq-numeric"><span className="sq-freshness"><bdi>{provenance(f)}</bdi></span></td>
                <td>{dq.length === 0 ? <span className="t-caption">{strings.dqComplete}</span> : dq.map(d => <div key={d.label}><span className={`sq-lozenge sq-lozenge--${d.kind}`}>{d.kind === "critical" ? <IconBlocked size={16} /> : "⚠"} {d.label}</span></div>)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      <p className="t-caption">{strings.riskAdvisory}</p>

      <div className="row" style={{ gap: "var(--space-3)", alignItems: "center", justifyContent: "center" }}>
        <button type="button" className="sq-btn sq-btn--subtle" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={clampedPage === 0}>{strings.pagePrev}</button>
        <span className="t-caption sq-numeric" role="status" aria-live="polite">
          {strings.pageStatus.replace("{a}", String(filtered.length === 0 ? 0 : clampedPage * PAGE_SIZE + 1)).replace("{b}", String(Math.min(filtered.length, (clampedPage + 1) * PAGE_SIZE))).replace("{n}", String(filtered.length))}
        </span>
        <button type="button" className="sq-btn sq-btn--subtle" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={clampedPage >= pageCount - 1}>{strings.pageNext}</button>
      </div>

      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{strings.summaryTitle}</h4>
        {sel.length === 0 ? <p className="t-caption">{strings.summaryEmpty}</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--space-4)" }}>
            <div><span className="t-caption">{strings.summarySelected}</span><div className="sq-numeric"><strong>{sel.length}</strong></div></div>
            <div><span className="t-caption">{strings.summaryByBand}</span>
              <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
                {Object.entries(byBand).map(([b, n]) => <span key={b} className={`sq-lozenge ${b === "high" ? "sq-lozenge--critical" : b === "medium" ? "sq-lozenge--warning" : "sq-lozenge--success"}`}>{strings.riskBands[b] ?? b} · {n}</span>)}
              </div></div>
            <div><span className="t-caption">{strings.summaryByRegion}</span>
              <div className="row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
                {Object.entries(byRegion).map(([r, n]) => <span key={r} className="sq-lozenge sq-lozenge--info"><bdi>{r}</bdi> · {n}</span>)}
              </div></div>
          </div>
        )}
      </div>

      {/* persistent selection bar — cross-page count + draft + hand-off to the P02 review step */}
      <div className="panel panel-row sticky">
        <div className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <strong className="sq-numeric" aria-live="polite">{strings.selectionBar.replace("{n}", String(selected.size))}</strong>
          {selected.size === 0 && <span className="sq-lozenge sq-lozenge--warning">⚠ {strings.readyNothing}</span>}
          {selected.size > 0 && <button type="button" className="sq-btn sq-btn--subtle" onClick={clearSelection}>{strings.clearSelection}</button>}
          {draftRef && !saveFailed && <span className="t-caption" role="status">{strings.draftSaved.replace("{ref}", draftRef)}</span>}
          {!draftPersistenceExecutable && (
            <span className="t-caption sq-lozenge sq-lozenge--warning" role="status">{strings.draftSaveFailed}</span>
          )}
        </div>
        <div className="row" style={{ gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          {saveFailed && (
            <>
              <span className="t-caption sq-lozenge sq-lozenge--critical" role="alert">{strings.draftSaveFailed}</span>
              <a className="sq-btn sq-btn--secondary" href="/planning/bulk/review">{strings.reviewFallback}</a>
            </>
          )}
          {selected.size > 0 && (
            <button type="button" className="sq-btn sq-btn--secondary"
              disabled={!draftPersistenceExecutable || saving} onClick={onSaveDraftClick}>
              {saving ? strings.savingDraft : strings.saveDraft}
            </button>
          )}
          {selected.size > 0
            ? <button type="button" className="sq-btn sq-btn--prominent" disabled={saving} onClick={() => { void onReviewClick(); }}>{strings.reviewContinue}</button>
            : <button type="button" className="sq-btn sq-btn--prominent" disabled>{strings.reviewContinue}</button>}
        </div>
      </div>
    </div>
  );
}
