// SCR-ADM-100 · SB19 — Localization admin (Lokalise-style, Arabic scope).
// Server page loads the full ui_strings dictionary + KPIs; the client Manager
// owns filtering and inline editing. The page itself renders through useT()
// (keys l10n.*) — the module that manages language works in both languages.
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Manager, { type Labels, type UiString } from "./Manager";

export const dynamic = "force-dynamic";

export default async function Localization() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data, error } = await sb.from("ui_strings")
    .select("key, en, ar, status, context, orphaned")
    .order("key");
  const rows = (data ?? []) as UiString[];

  const total = rows.length;
  const translated = rows.filter(r => r.ar !== null && r.ar.trim() !== "").length;
  const reviewed = rows.filter(r => r.status === "reviewed").length;
  const coverage = total === 0 ? 0 : Math.round((translated / total) * 100);

  const labels: Labels = {
    searchPlaceholder: t("l10n.search", "Search key, English or Arabic…"),
    filterAll: t("l10n.filter.all", "All statuses"),
    filterDraft: t("l10n.filter.draft", "Draft"),
    filterReviewed: t("l10n.filter.reviewed", "Reviewed"),
    filterMissing: t("l10n.filter.missing", "Missing Arabic"),
    exportCsv: t("l10n.export", "Export CSV"),
    importNote: t("l10n.import.note", "CSV importer is a follow-up."),
    showing: t("l10n.showing", "Showing"),
    colKey: t("l10n.col.key", "Key"),
    colEn: t("l10n.col.en", "English (source)"),
    colAr: t("l10n.col.ar", "Arabic"),
    colStatus: t("l10n.col.status", "Status"),
    colContext: t("l10n.col.context", "Context"),
    colActions: t("l10n.col.actions", "Actions"),
    statusDraft: t("l10n.status.draft", "draft"),
    statusReviewed: t("l10n.status.reviewed", "reviewed"),
    statusMissing: t("l10n.status.missing", "missing"),
    save: t("l10n.save", "Save"),
    saving: t("l10n.saving", "Saving…"),
    saved: t("l10n.saved", "saved"),
    markReviewed: t("l10n.review", "Mark reviewed"),
    marking: t("l10n.reviewing", "Marking…"),
    addTitle: t("l10n.add.title", "Add key"),
    addKeyField: t("l10n.add.key", "Key"),
    addEnField: t("l10n.add.en", "English source"),
    addArField: t("l10n.add.ar", "Arabic (optional)"),
    addContextField: t("l10n.add.context", "Context (optional)"),
    addBtn: t("l10n.add.submit", "Add key (draft)"),
    adding: t("l10n.add.pending", "Adding…"),
    added: t("l10n.add.done", "added"),
    emptyTitle: t("l10n.empty.title", "No UI strings yet"),
    emptyBody: t("l10n.empty.body", "Keys land here from extraction sweeps over the codebase; translate to Arabic, then mark reviewed. Run the coverage sweep:"),
    noMatchTitle: t("l10n.nomatch.title", "No strings match"),
    noMatchBody: t("l10n.nomatch.body", "Adjust the search or status filter."),
    sync: t("l10n.sync", "Sync from code"),
    syncing: t("l10n.syncing", "Scanning code…"),
    syncReport: t("l10n.syncReport", "Sync: added"),
    filterOrphaned: t("l10n.filter.orphaned", "Orphaned"),
    statusOrphaned: t("l10n.status.orphaned", "orphaned"),
    history: t("l10n.history", "history"),
    historyLoading: t("l10n.historyLoading", "Loading history…"),
    historyEmpty: t("l10n.historyEmpty", "No changes recorded yet."),
    restore: t("l10n.restore", "Restore"),
    restoring: t("l10n.restoring", "Restoring…"),
    restored: t("l10n.restored", "restored (as draft)"),
    riskLong: t("l10n.risk.long", "Arabic runs long — check narrow layouts"),
    orphanNote: t("l10n.orphan.note", "No longer found in the last code scan — kept and restorable, not deleted."),
    placeholderErr: t("l10n.placeholder.err", "Placeholder {token} is missing from the Arabic — Save is disabled until placeholders match."),
  };

  return (
    <Shell current="/admin" title={t("l10n.title", "Localization")}
      context={
        <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
          <span className="ax-lozenge ax-lozenge--info">SCR-ADM-100 · SB19</span>
          {locale === "ar"
            ? <a className="ax-link" href="/locale?set=en">English</a>
            : <a className="ax-link" href="/locale?set=ar" lang="ar">العربية</a>}
        </span>
      }>
      {error ? (
        <div className="ax-banner ax-banner--critical" role="alert">
          {t("l10n.error.load", "Could not load ui_strings:")} {error.message}
        </div>
      ) : (
        <>
          <div className="ax-kpi-row">
            <div className="ax-kpi"><span className="ax-kpi__value ax-numeric">{total}</span>{t("l10n.kpi.total", "Total keys")}</div>
            <div className="ax-kpi"><span className="ax-kpi__value ax-numeric">{translated}</span>{t("l10n.kpi.translated", "Translated (AR)")}</div>
            <div className="ax-kpi"><span className="ax-kpi__value ax-numeric">{reviewed}</span>{t("l10n.kpi.reviewed", "Reviewed")}</div>
            <div className="ax-kpi"><span className="ax-kpi__value ax-numeric">{coverage}%</span>{t("l10n.kpi.coverage", "Coverage")}</div>
          </div>
          <Manager rows={rows} labels={labels} />
        </>
      )}
    </Shell>
  );
}
