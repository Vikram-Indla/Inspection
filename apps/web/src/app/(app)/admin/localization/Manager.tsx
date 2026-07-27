"use client";
// SCR-ADM-100 · SB19 — Lokalise-style client surface: filtering, inline Arabic
// editing, per-row review, add-key, CSV export. All strings arrive translated
// from the server page (labels prop) so the module works in both languages.
import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  saveTranslation, markReviewed, addKey, syncFromCode, getHistory, restoreRevision,
  type L10nResult, type SyncResult, type Revision,
} from "./actions";
import EmptyState from "@/components/EmptyState";
import { IconGlobe } from "@/app/icons";
import styles from "./localization.module.css";
import { AdminRecordArticle } from "../_components/AdminRecordDrawer";

export type UiString = {
  key: string;
  en: string;
  ar: string | null;
  status: "draft" | "reviewed";
  context: string | null;
  orphaned: boolean;
  updated_at: string;
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
  registryTitle: string;
  registryBody: string;
  statusNavigation: string;
  allKeys: string;
  missingKeys: string;
  draftKeys: string;
  reviewedKeys: string;
  orphanedKeys: string;
  sourceHeading: string;
  translationHeading: string;
  stateHeading: string;
  governanceTitle: string;
  governanceBody: string;
  openAdd: string;
  closeAdd: string;
  previous: string;
  next: string;
  page: string;
  filteredResults: string;
  changedBy: string;
  systemActor: string;
  sourcePanel: string;
  sourceSync: string;
  sourceRestore: string;
  updatedAt: string;
  notConfigured: string;
  drawerSubtitle: string;
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
  if (row.orphaned) return <span className="badge">{labels.statusOrphaned}</span>;
  if (missingAr(row)) return <span className="badge badge-critical">{labels.statusMissing}</span>;
  if (row.status === "reviewed") return <span className="badge badge-compliant">{labels.statusReviewed}</span>;
  return <span className="badge badge-warning">{labels.statusDraft}</span>;
}

// Trigger-written history: last few revisions with restore (restore itself
// snapshots — nothing is ever lost).
function HistoryPanel({ row, labels, locale }: { row: UiString; labels: Labels; locale: "en" | "ar" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [restState, restAction, restPending] = useActionState<L10nResult, FormData>(restoreRevision, {});

  async function loadHistory() {
    setLoading(true);
    setErr(null);
    const res = await getHistory(row.key, locale);
    setLoading(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setRevs(res.revisions ?? []);
  }

  async function toggle() {
    const next = !open; setOpen(next);
    if (next && revs === null && !loading) {
      await loadHistory();
    }
  }

  useEffect(() => {
    if (!restState.ok) return;
    router.refresh();
    void loadHistory();
    // The successful action state changes once per restore submission. Loading
    // history here refreshes the immutable before-state chain without looping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restState, router]);

  const panelId = `localization-history-${row.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return (
    <div className={styles.history}>
      <button type="button" className={`sq-link ${styles.linkButton}`} onClick={toggle}
        aria-expanded={open} aria-controls={panelId}>
        {labels.history}
      </button>
      {open && (
        <div className={styles.historyList} id={panelId} aria-live="polite">
          {loading && <span className="t-caption">{labels.historyLoading}</span>}
          {err && <span className={`t-caption ${styles.criticalText}`} role="alert">{err}</span>}
          {revs !== null && revs.length === 0 && <span className="t-caption">{labels.historyEmpty}</span>}
          {(revs ?? []).map(r => {
            const sourceLabel = r.change_source === "sync"
              ? labels.sourceSync
              : r.change_source === "restore"
                ? labels.sourceRestore
                : labels.sourcePanel;
            const statusLabel = r.status === "reviewed" ? labels.statusReviewed : labels.statusDraft;
            return (
              <div key={r.id} className={styles.historyItem}>
                <span className="t-caption numeric">{r.changed_at.slice(0, 16).replace("T", " ")} · {sourceLabel} · {statusLabel}</span>
                <span className="t-caption">
                  {labels.changedBy}: <span className="numeric">{r.changed_by ? r.changed_by.slice(0, 8) : labels.systemActor}</span>
                </span>
                <span dir="rtl" lang="ar" style={{ font: "var(--type-caption-font)" }}>{r.ar ?? "—"}</span>
                <form action={restAction}>
                  <input type="hidden" name="key" value={row.key} />
                  <input type="hidden" name="revision_id" value={r.id} />
                  <input type="hidden" name="expected_updated_at" value={row.updated_at} />
                  <input type="hidden" name="locale" value={locale} />
                  <button className="btn btn-primary btn-touch" style={{ paddingBlock: 2, font: "var(--type-caption-font)" }} disabled={restPending}>
                    {restPending ? labels.restoring : labels.restore}
                  </button>
                </form>
              </div>
            );
          })}
          {restState.ok && <span className="badge badge-compliant">{labels.restored}</span>}
          {restState.error && <span className={`t-caption ${styles.criticalText}`} role="alert">{restState.error}</span>}
        </div>
      )}
    </div>
  );
}

function SyncButton({ labels, locale }: { labels: Labels; locale: "en" | "ar" }) {
  const [state, formAction, pending] = useActionState<SyncResult, FormData>(syncFromCode, {});
  return (
    <form action={formAction} className={styles.syncForm}>
      <input type="hidden" name="locale" value={locale} />
      <button className="btn btn-secondary btn-touch" disabled={pending}>{pending ? labels.syncing : labels.sync}</button>
      {state.report && !pending && (
        <span className="t-caption">
          {labels.syncReport} <span className="numeric">+{state.report.added.length}</span> · EN Δ <span className="numeric">{state.report.enChanged.length}</span> · ⌀ <span className="numeric">{state.report.orphaned.length}</span> · ↻ <span className="numeric">{state.report.revived.length}</span>
        </span>
      )}
      {state.error && <span className={`t-caption ${styles.criticalText}`} role="alert">{state.error}</span>}
    </form>
  );
}

function Row({
  row,
  labels,
  locale,
  drawerGovernance,
}: {
  row: UiString;
  labels: Labels;
  locale: "en" | "ar";
  drawerGovernance: readonly string[];
}) {
  const router = useRouter();
  const [saveState, saveAction, savePending] = useActionState<L10nResult, FormData>(saveTranslation, {});
  const [revState, revAction, revPending] = useActionState<L10nResult, FormData>(markReviewed, {});
  // Controlled Arabic value so placeholder integrity + length risk validate live.
  const [ar, setAr] = useState(row.ar ?? "");

  useEffect(() => {
    setAr(row.ar ?? "");
  }, [row.ar]);

  useEffect(() => {
    if (saveState.ok || revState.ok) router.refresh();
  }, [saveState, revState, router]);

  const missing = missingPlaceholders(row.en, ar);
  const phErr = missing.length > 0;
  const errTokens = new Set(missing);
  const arLonger = ar.trim() !== "" && row.en.trim() !== "" && ar.length > row.en.length * 1.3;
  const canReview = !row.orphaned && row.status !== "reviewed" && ar.trim() !== "" && !phErr;
  const status = row.orphaned
    ? labels.statusOrphaned
    : missingAr(row)
      ? labels.statusMissing
      : row.status === "reviewed"
        ? labels.statusReviewed
        : labels.statusDraft;
  const recordId = `localization-record-${row.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <AdminRecordArticle
      id={recordId}
      className={`${styles.stringRow}${row.orphaned ? ` ${styles.orphaned}` : ""}`}
      record={{
        title: row.key,
        subtitle: labels.drawerSubtitle,
        record: [
          { label: labels.colEn, value: row.en },
          { label: labels.colAr, value: row.ar?.trim() || labels.notConfigured },
          { label: labels.colStatus, value: status },
          { label: labels.colContext, value: row.context?.trim() || labels.notConfigured },
          {
            label: labels.updatedAt,
            value: new Date(row.updated_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB"),
          },
        ],
        governance: drawerGovernance,
        editHref: `#${recordId}`,
        auditHref: `/admin/audit?q=${encodeURIComponent(row.key)}`,
      }}
    >
      {/* Source (English) — the code owns this string; drift returns AR to draft server-side. */}
      <div className={styles.sourceCell} dir="ltr">
        <span className="lz-key">{row.key}</span>
        <span className="lz-src"><PhText text={row.en} errTokens={errTokens} /></span>
        {row.context && <span className="lz-risk lz-risk--muted">{row.context}</span>}
        {row.orphaned && <span className="lz-risk lz-risk--muted">◌ {labels.orphanNote}</span>}
      </div>

      {/* Arabic — inline edit + Save (returns to draft). */}
      <div className={styles.translationCell} dir="rtl">
        <span className="lz-key" dir="ltr">AR</span>
        <form action={saveAction} className={styles.translationForm}>
          <input type="hidden" name="key" value={row.key} />
          <input type="hidden" name="expected_updated_at" value={row.updated_at} />
          <input type="hidden" name="locale" value={locale} />
          <input className="sq-input lz-ar" name="ar" dir="rtl" lang="ar" value={ar} onChange={e => setAr(e.target.value)}
            placeholder="—" aria-label={`${labels.colAr}: ${row.key}`} style={{ flex: 1, minInlineSize: 160 }} />
          <button className="btn btn-primary btn-touch" disabled={savePending || phErr} aria-disabled={phErr}>{savePending ? labels.saving : labels.save}</button>
          {saveState.ok && !savePending && <span className="badge badge-compliant" role="status">{labels.saved}</span>}
        </form>
        {arLonger && <span className="lz-risk">↔ {labels.riskLong}</span>}
        {phErr && <span className="lz-risk lz-risk--critical" role="alert">✕ {labels.placeholderErr.replace("{token}", `{{${missing[0]}}}`)}</span>}
        {saveState.error && <span className="lz-risk lz-risk--critical" role="alert">{saveState.error}</span>}
      </div>

      {/* Status + actions + history */}
      <div className={styles.actionCell}>
        <StatusLozenge row={row} labels={labels} />
        {canReview && (
          <div className="lz-actions">
            <form action={revAction}>
              <input type="hidden" name="key" value={row.key} />
              <input type="hidden" name="expected_updated_at" value={row.updated_at} />
              <input type="hidden" name="locale" value={locale} />
              <button className="btn btn-secondary btn-touch" disabled={revPending}>{revPending ? labels.marking : labels.markReviewed}</button>
            </form>
          </div>
        )}
        <HistoryPanel row={row} labels={labels} locale={locale} />
        {revState.error && <span className="lz-risk lz-risk--critical" role="alert">{revState.error}</span>}
      </div>
    </AdminRecordArticle>
  );
}

function AddKeyForm({ labels, locale, onClose }: { labels: Labels; locale: "en" | "ar"; onClose?: () => void }) {
  const [state, formAction, pending] = useActionState<L10nResult, FormData>(addKey, {});
  return (
    <form action={formAction} className={`panel ${styles.addForm}`}>
      <input type="hidden" name="locale" value={locale} />
      <div className={styles.addHeading}>
        <strong>{labels.addTitle}</strong>
        {onClose && <button type="button" className={`sq-link ${styles.linkButton}`} onClick={onClose}>{labels.closeAdd}</button>}
      </div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="l10n-add-key">{labels.addKeyField}</label>
        <input className="sq-input numeric" name="key" id="l10n-add-key" placeholder="nav.planning" required /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="l10n-add-en">{labels.addEnField}</label>
        <input className="sq-input" name="en" id="l10n-add-en" required /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="l10n-add-ar">{labels.addArField}</label>
        <input className="sq-input" name="ar" id="l10n-add-ar" dir="rtl" lang="ar" /></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="l10n-add-context">{labels.addContextField}</label>
        <input className="sq-input" name="context" id="l10n-add-context" placeholder="SCR-ADM-100" /></div>
      <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? labels.adding : labels.addBtn}</button>
      {state.error && <span className={`t-caption ${styles.criticalText}`} role="alert">{state.error}</span>}
      {state.ok && !pending && <span className="badge badge-compliant">{labels.added}</span>}
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

export default function Manager({ rows, labels, locale, drawerGovernance }: {
  rows: UiString[];
  labels: Labels;
  locale: "en" | "ar";
  drawerGovernance: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const pageSize = 12;

  const counts = useMemo(() => ({
    all: rows.length,
    draft: rows.filter(row => row.status === "draft" && !missingAr(row) && !row.orphaned).length,
    reviewed: rows.filter(row => row.status === "reviewed" && !row.orphaned).length,
    "missing-ar": rows.filter(row => missingAr(row) && !row.orphaned).length,
    orphaned: rows.filter(row => row.orphaned).length,
  }), [rows]);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function chooseFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: labels.allKeys },
    { id: "missing-ar", label: labels.missingKeys },
    { id: "draft", label: labels.draftKeys },
    { id: "reviewed", label: labels.reviewedKeys },
    { id: "orphaned", label: labels.orphanedKeys },
  ];

  if (rows.length === 0) {
    return (
      <div className={styles.emptyStack}>
        <EmptyState icon={<IconGlobe size={28} />} title={labels.emptyTitle}
          body={<>{labels.emptyBody} <span className="numeric">scripts/i18n_coverage.py</span></>} />
        <AddKeyForm labels={labels} locale={locale} />
      </div>
    );
  }

  return (
    <section className={styles.registry} aria-labelledby="translation-registry-title"
      data-saqeel-design="WA-DES-010"
      data-design-hash="11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d">
      <header className={styles.registryHeader}>
        <div>
          <p className={styles.eyebrow}>{labels.registryTitle}</p>
          <h1 id="translation-registry-title">{labels.registryTitle}</h1>
          <p>{labels.registryBody}</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-primary btn-touch" type="button" onClick={() => setAddOpen(open => !open)} aria-expanded={addOpen} aria-controls="localization-add-key">
            {addOpen ? labels.closeAdd : labels.openAdd}
          </button>
          <button className="btn btn-secondary btn-touch" type="button" onClick={() => exportCsv(filtered)}>{labels.exportCsv}</button>
          <SyncButton labels={labels} locale={locale} />
        </div>
      </header>

      {addOpen && <div id="localization-add-key"><AddKeyForm labels={labels} locale={locale} onClose={() => setAddOpen(false)} /></div>}

      <div className={styles.workspace}>
        <aside className={`panel ${styles.statusPanel}`} aria-label={labels.statusNavigation}>
          <h2>{labels.statusNavigation}</h2>
          <nav className={styles.statusNav}>
            {filters.map(item => (
              <button key={item.id} type="button" className={filter === item.id ? styles.activeFilter : undefined}
                onClick={() => chooseFilter(item.id)} aria-pressed={filter === item.id}>
                <span>{item.label}</span>
                <span className="numeric">{counts[item.id]}</span>
              </button>
            ))}
          </nav>
          <div className={styles.governance}>
            <strong>{labels.governanceTitle}</strong>
            <p>{labels.governanceBody}</p>
          </div>
        </aside>

        <div className={styles.content}>
          <div className={`panel ${styles.toolbar}`}>
            <input className="sq-input" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={labels.searchPlaceholder} aria-label={labels.searchPlaceholder} />
            <span className="t-caption">
              {labels.showing} <span className="numeric">{filtered.length}/{rows.length}</span> {labels.filteredResults}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<IconGlobe size={28} />} title={labels.noMatchTitle} body={labels.noMatchBody} />
          ) : (
            <>
              <div className={styles.columnHeadings} aria-hidden="true">
                <span>{labels.sourceHeading}</span>
                <span>{labels.translationHeading}</span>
                <span>{labels.stateHeading}</span>
              </div>
              <div className={styles.list}>
                {visibleRows.map(row => (
                  <Row
                    key={row.key}
                    row={row}
                    labels={labels}
                    locale={locale}
                    drawerGovernance={drawerGovernance}
                  />
                ))}
              </div>
              <nav className={`panel ${styles.pagination}`} aria-label={labels.page}>
                <button type="button" className="btn btn-secondary btn-touch" disabled={currentPage === 1}
                  onClick={() => setPage(current => Math.max(1, current - 1))}>{labels.previous}</button>
                <span>{labels.page} <span className="numeric">{currentPage}</span> / <span className="numeric">{pageCount}</span></span>
                <button type="button" className="btn btn-secondary btn-touch" disabled={currentPage === pageCount}
                  onClick={() => setPage(current => Math.min(pageCount, current + 1))}>{labels.next}</button>
              </nav>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
