"use client";
// SCR-ADM-100 · SB19 — Lokalise-style client surface: filtering, inline Arabic
// editing, per-row review, add-key, CSV export. All strings arrive translated
// from the server page (labels prop) so the module works in both languages.
import { useMemo, useState, useActionState } from "react";
import {
  saveTranslation, markReviewed, addKey, syncFromCode, getHistory, restoreRevision,
  type L10nResult, type SyncResult, type Revision,
} from "./actions";
import EmptyState from "@/components/EmptyState";

export type UiString = {
  key: string;
  en: string;
  ar: string | null;
  status: "draft" | "reviewed";
  context: string | null;
  orphaned: boolean;
};

export type Labels = {
  searchPlaceholder: string;
  filterAll: string;
  filterDraft: string;
  filterReviewed: string;
  filterMissing: string;
  exportCsv: string;
  importNote: string;
  showing: string;
  colKey: string;
  colEn: string;
  colAr: string;
  colStatus: string;
  colContext: string;
  colActions: string;
  statusDraft: string;
  statusReviewed: string;
  statusMissing: string;
  save: string;
  saving: string;
  saved: string;
  markReviewed: string;
  marking: string;
  addTitle: string;
  addKeyField: string;
  addEnField: string;
  addArField: string;
  addContextField: string;
  addBtn: string;
  adding: string;
  added: string;
  emptyTitle: string;
  emptyBody: string;
  noMatchTitle: string;
  noMatchBody: string;
  sync: string;
  syncing: string;
  syncReport: string;
  filterOrphaned: string;
  statusOrphaned: string;
  history: string;
  historyLoading: string;
  historyEmpty: string;
  restore: string;
  restoring: string;
  restored: string;
  riskLong: string;
  orphanNote: string;
  // {token} is substituted with the first placeholder missing from the Arabic.
  placeholderErr: string;
};

type Filter = "all" | "draft" | "reviewed" | "missing-ar" | "orphaned";

const missingAr = (r: UiString) => r.ar === null || r.ar.trim() === "";

// Placeholder integrity is verifiable client-side from the strings themselves —
// no backend signal needed. A {{token}} present in EN but absent from the Arabic
// would break interpolation at runtime, so Save is disabled until they match.
const PH_SPLIT = /(\{\{\w+\}\})/g;
const PH_TOKEN = /^\{\{(\w+)\}\}$/;
function phSet(s: string) {
  const set = new Set<string>();
  for (const m of s.matchAll(/\{\{(\w+)\}\}/g)) set.add(m[1]);
  return set;
}
function missingPlaceholders(en: string, ar: string): string[] {
  if (ar.trim() === "") return [];
  const a = phSet(ar);
  return [...phSet(en)].filter(tok => !a.has(tok));
}
function PhText({ text, errTokens }: { text: string; errTokens: Set<string> }) {
  return (
    <>
      {text.split(PH_SPLIT).map((part, i) => {
        const m = PH_TOKEN.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        return <span key={i} className={"lz-ph" + (errTokens.has(m[1]) ? " lz-ph--err" : "")}>{part}</span>;
      })}
    </>
  );
}

function StatusLozenge({ row, labels }: { row: UiString; labels: Labels }) {
  if (row.orphaned) return <span className="ax-lozenge">{labels.statusOrphaned}</span>;
  if (missingAr(row)) return <span className="ax-lozenge ax-lozenge--critical">{labels.statusMissing}</span>;
  if (row.status === "reviewed") return <span className="ax-lozenge ax-lozenge--success">{labels.statusReviewed}</span>;
  return <span className="ax-lozenge ax-lozenge--warning">{labels.statusDraft}</span>;
}

// Trigger-written history: last few revisions with restore (restore itself
// snapshots — nothing is ever lost).
function HistoryPanel({ row, labels }: { row: UiString; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [restState, restAction, restPending] = useActionState<L10nResult, FormData>(restoreRevision, {});

  async function toggle() {
    const next = !open; setOpen(next);
    if (next && revs === null && !loading) {
      setLoading(true);
      const res = await getHistory(row.key);
      setLoading(false);
      if (res.error) setErr(res.error); else setRevs(res.revisions ?? []);
    }
  }
  return (
    <div>
      <button type="button" className="ax-link" style={{ background: "none", border: 0, cursor: "pointer", padding: 0, font: "var(--ax-text-caption)" }} onClick={toggle} aria-expanded={open}>
        {labels.history}
      </button>
      {open && (
        <div style={{ marginBlockStart: "var(--ax-space-100)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
          {loading && <span className="t-caption">{labels.historyLoading}</span>}
          {err && <span className="t-caption" role="alert" style={{ color: "var(--ax-color-critical)" }}>{err}</span>}
          {revs !== null && revs.length === 0 && <span className="t-caption">{labels.historyEmpty}</span>}
          {(revs ?? []).map(r => (
            <div key={r.id} className="row" style={{ gap: "var(--ax-space-150)", alignItems: "baseline", flexWrap: "wrap", borderBlockStart: "1px dashed var(--ax-color-border)", paddingBlockStart: "var(--ax-space-100)" }}>
              <span className="t-caption numeric">{r.changed_at.slice(0, 16).replace("T", " ")} · {r.change_source} · {r.status}</span>
              <span dir="rtl" lang="ar" style={{ font: "var(--ax-text-caption)" }}>{r.ar ?? "—"}</span>
              <form action={restAction}>
                <input type="hidden" name="key" value={row.key} />
                <input type="hidden" name="revision_id" value={r.id} />
                <button className="ax-btn" style={{ paddingBlock: 2, font: "var(--ax-text-caption)" }} disabled={restPending}>
                  {restPending ? labels.restoring : labels.restore}
                </button>
              </form>
            </div>
          ))}
          {restState.ok && <span className="ax-lozenge ax-lozenge--success">{labels.restored}</span>}
          {restState.error && <span className="t-caption" role="alert" style={{ color: "var(--ax-color-critical)" }}>{restState.error}</span>}
        </div>
      )}
    </div>
  );
}

function SyncButton({ labels }: { labels: Labels }) {
  const [state, formAction, pending] = useActionState<SyncResult, FormData>(syncFromCode, {});
  return (
    <form action={formAction} className="row" style={{ gap: "var(--ax-space-100)", alignItems: "center", flexWrap: "wrap" }}>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? labels.syncing : labels.sync}</button>
      {state.report && !pending && (
        <span className="t-caption">
          {labels.syncReport} <span className="numeric">+{state.report.added.length}</span> · EN Δ <span className="numeric">{state.report.enChanged.length}</span> · ⌀ <span className="numeric">{state.report.orphaned.length}</span> · ↻ <span className="numeric">{state.report.revived.length}</span>
        </span>
      )}
      {state.error && <span className="t-caption" role="alert" style={{ color: "var(--ax-color-critical)" }}>{state.error}</span>}
    </form>
  );
}

function Row({ row, labels }: { row: UiString; labels: Labels }) {
  const [saveState, saveAction, savePending] = useActionState<L10nResult, FormData>(saveTranslation, {});
  const [revState, revAction, revPending] = useActionState<L10nResult, FormData>(markReviewed, {});
  // Controlled Arabic value so placeholder integrity + length risk validate live.
  const [ar, setAr] = useState(row.ar ?? "");

  const missing = missingPlaceholders(row.en, ar);
  const phErr = missing.length > 0;
  const errTokens = new Set(missing);
  const arLonger = ar.trim() !== "" && row.en.trim() !== "" && ar.length > row.en.length * 1.3;
  const canReview = !row.orphaned && row.status !== "reviewed" && ar.trim() !== "" && !phErr;

  return (
    <div className={"lz-row" + (row.orphaned ? " lz-row--orphan" : "")}>
      {/* Source (English) — the code owns this string; drift returns AR to draft server-side. */}
      <div className="lz-cell" dir="ltr">
        <span className="lz-key">{row.key}</span>
        <span className="lz-src"><PhText text={row.en} errTokens={errTokens} /></span>
        {row.context && <span className="lz-risk lz-risk--muted">{row.context}</span>}
        {row.orphaned && <span className="lz-risk lz-risk--muted">◌ {labels.orphanNote}</span>}
      </div>

      {/* Arabic — inline edit + Save (returns to draft). */}
      <div className="lz-cell" dir="rtl">
        <span className="lz-key" dir="ltr">AR</span>
        <form action={saveAction} className="row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap", inlineSize: "100%" }}>
          <input type="hidden" name="key" value={row.key} />
          <input className="ax-input lz-ar" name="ar" dir="rtl" lang="ar" value={ar} onChange={e => setAr(e.target.value)}
            placeholder="—" aria-label={`${labels.colAr}: ${row.key}`} style={{ flex: 1, minInlineSize: 160 }} />
          <button className="ax-btn" disabled={savePending || phErr} aria-disabled={phErr}>{savePending ? labels.saving : labels.save}</button>
          {saveState.ok && !savePending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
        </form>
        {arLonger && <span className="lz-risk">↔ {labels.riskLong}</span>}
        {phErr && <span className="lz-risk lz-risk--critical" role="alert">✕ {labels.placeholderErr.replace("{token}", `{{${missing[0]}}}`)}</span>}
        {saveState.error && <span className="lz-risk lz-risk--critical" role="alert">{saveState.error}</span>}
      </div>

      {/* Status + actions + history */}
      <div className="lz-cell lz-cell--actions">
        <StatusLozenge row={row} labels={labels} />
        {canReview && (
          <div className="lz-actions">
            <form action={revAction}>
              <input type="hidden" name="key" value={row.key} />
              <button className="ax-btn ax-btn--secondary" disabled={revPending}>{revPending ? labels.marking : labels.markReviewed}</button>
            </form>
          </div>
        )}
        <HistoryPanel row={row} labels={labels} />
        {revState.error && <span className="lz-risk lz-risk--critical" role="alert">{revState.error}</span>}
      </div>
    </div>
  );
}

function AddKeyForm({ labels }: { labels: Labels }) {
  const [state, formAction, pending] = useActionState<L10nResult, FormData>(addKey, {});
  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div style={{ inlineSize: "100%" }}><strong>{labels.addTitle}</strong></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="l10n-add-key">{labels.addKeyField}</label>
        <input className="ax-input numeric" name="key" id="l10n-add-key" placeholder="nav.planning" required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label" htmlFor="l10n-add-en">{labels.addEnField}</label>
        <input className="ax-input" name="en" id="l10n-add-en" required /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label" htmlFor="l10n-add-ar">{labels.addArField}</label>
        <input className="ax-input" name="ar" id="l10n-add-ar" dir="rtl" lang="ar" /></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 180 }}><label className="ax-field__label" htmlFor="l10n-add-context">{labels.addContextField}</label>
        <input className="ax-input" name="context" id="l10n-add-context" placeholder="SCR-ADM-100" /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? labels.adding : labels.addBtn}</button>
      {state.error && <span className="t-caption" role="alert" style={{ color: "var(--ax-color-critical)" }}>{state.error}</span>}
      {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.added}</span>}
    </form>
  );
}

function exportCsv(rows: UiString[]) {
  const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    "key,en,ar,status,context",
    ...rows.map(r => [r.key, r.en, r.ar, r.status, r.context].map(esc).join(",")),
  ];
  // \uFEFF BOM keeps Arabic intact when the CSV lands in Excel.
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ui_strings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Manager({ rows, labels }: { rows: UiString[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (filter === "draft" && (r.status !== "draft" || missingAr(r) || r.orphaned)) return false;
      if (filter === "reviewed" && r.status !== "reviewed") return false;
      if (filter === "missing-ar" && (!missingAr(r) || r.orphaned)) return false;
      if (filter === "orphaned" && !r.orphaned) return false;
      if (!q) return true;
      return r.key.toLowerCase().includes(q)
        || r.en.toLowerCase().includes(q)
        || (r.ar ?? "").toLowerCase().includes(q);
    });
  }, [rows, query, filter]);

  if (rows.length === 0) {
    return (
      <>
        <EmptyState glyph="🌐" title={labels.emptyTitle}
          body={<>{labels.emptyBody} <span className="numeric">scripts/i18n_coverage.py</span></>} />
        <AddKeyForm labels={labels} />
      </>
    );
  }

  return (
    <>
      <div className="ax-surface" style={{ padding: "var(--ax-space-200) var(--ax-space-300)", display: "flex", gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap" }}>
        <input className="ax-input" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder} aria-label={labels.searchPlaceholder} style={{ flex: 1, minInlineSize: 220 }} />
        <select className="ax-select" value={filter} onChange={e => setFilter(e.target.value as Filter)} aria-label={labels.colStatus}>
          <option value="all">{labels.filterAll}</option>
          <option value="draft">{labels.filterDraft}</option>
          <option value="reviewed">{labels.filterReviewed}</option>
          <option value="missing-ar">{labels.filterMissing}</option>
          <option value="orphaned">{labels.filterOrphaned}</option>
        </select>
        <button className="ax-btn" type="button" onClick={() => exportCsv(filtered)}>{labels.exportCsv}</button>
        <SyncButton labels={labels} />
        <span className="t-caption">{labels.showing} <span className="numeric">{filtered.length}/{rows.length}</span> · {labels.importNote}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState glyph="🔍" title={labels.noMatchTitle} body={labels.noMatchBody} />
      ) : (
        <div className="lz-list">
          {filtered.map(r => <Row key={r.key} row={r} labels={labels} />)}
        </div>
      )}

      <AddKeyForm labels={labels} />
    </>
  );
}
