// SCR-ADM-100 · SB19 — Localization admin (Lokalise-style, Arabic scope).
// Server page loads the full ui_strings dictionary + KPIs; the client Manager
// owns filtering and inline editing. The page itself renders through useT()
// (keys l10n.*) — the module that manages language works in both languages.
import Shell from "@/components/Shell";
import AdminDestinationFrame from "../_components/AdminDestinationFrame";
import EmptyState from "@/components/EmptyState";
import { IconShieldCheck } from "@/app/icons";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Manager, { type Labels, type UiString } from "./Manager";
import LocaleSwitch from "./LocaleSwitch";
import { createAdminRecordDrawerLabels } from "../_components/adminRecordDrawerCopy";

export const dynamic = "force-dynamic";
const UI_STRINGS_PAGE_SIZE = 1000;

export default async function Localization() {
  const { t, locale } = await useT();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError?.name === "AuthSessionMissingError" || !user) redirect("/login");
  if (authError) {
    console.error("[localization] identity verification failed", authError.message);
    throw new Error("localization_auth_unavailable");
  }

  // WA-M9-AC-005: fail closed before loading any configuration data.
  // RLS remains authoritative for reads and every mutation.
  const { data: roleRows, error: rolesError } = await getUserRoles(user.id);
  if (rolesError) {
    console.error("[localization] role verification failed", rolesError.message);
    throw new Error("localization_roles_unavailable");
  }
  const roles = new Set((roleRows ?? []).map(row => row.role_key));
  const canManageLocalization = ["compliance_admin", "security_admin", "workflow_admin"]
    .some(role => roles.has(role));

  if (!canManageLocalization) {
    return (
      <Shell current="/admin/localization" title={t("l10n.title", copy("Language & translations", "اللغة والترجمات"))}>
        <EmptyState
          icon={<IconShieldCheck size={28} />}
          role="alert"
          title={t("admin.unauthorized.heading", copy("This control-plane module is outside your role", "هذه الوحدة الإدارية خارج نطاق دورك"))}
          body={t(
            "admin.unauthorized.body",
            copy(
              "No localization data has been loaded. Return to your assigned workspace or ask an administrator for the required role.",
              "لم يتم تحميل أي بيانات ترجمة. ارجع إلى مساحة عملك أو اطلب من المسؤول منحك الدور المطلوب.",
            ),
          )}
        >
          <a className="btn btn-secondary sq-link btn-touch" href="/launch">
            {t("admin.unauthorized.return", copy("Return to my workspace", "العودة إلى مساحة عملي"))}
          </a>
        </EmptyState>
      </Shell>
    );
  }

  // PostgREST caps one response at 1,000 rows in the configured project.
  // The governed dictionary is larger, so a single unbounded select silently
  // omits later keys. Read every stable key-ordered page before calculating
  // coverage or handing the registry to the client.
  const rows: UiString[] = [];
  let loadFailed = false;
  for (let from = 0; ; from += UI_STRINGS_PAGE_SIZE) {
    const result = await sb.from("ui_strings")
      .select("key, en, ar, status, context, orphaned, updated_at")
      .order("key")
      .range(from, from + UI_STRINGS_PAGE_SIZE - 1);
    if (result.error) {
      console.error("[localization] load failed", result.error);
      loadFailed = true;
      break;
    }
    const page = (result.data ?? []) as UiString[];
    rows.push(...page);
    if (page.length < UI_STRINGS_PAGE_SIZE) break;
  }

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
    riskLong: t("l10n.risk.long", copy("Arabic runs long — check narrow layouts", "النص العربي طويل — تحقّق من عرضه في الشاشات الضيقة")),
    orphanNote: t("l10n.orphan.note", "No longer found in the last code scan — kept and restorable, not deleted."),
    placeholderErr: t("l10n.placeholder.err", "Placeholder {token} is missing from the Arabic — Save is disabled until placeholders match."),
    registryTitle: t("l10n.registry.title", copy("Translation registry", "سجل الترجمات")),
    registryBody: t(
      "l10n.registry.body",
      copy(
        "Manage the English source and Arabic translation consumed by every localized application surface.",
        "إدارة النص الإنجليزي المصدر والترجمة العربية المستخدمة في جميع واجهات التطبيق المترجمة.",
      ),
    ),
    statusNavigation: t("l10n.status.navigation", copy("Translation status", "حالة الترجمة")),
    allKeys: t("l10n.status.all", copy("All keys", "جميع المفاتيح")),
    missingKeys: t("l10n.status.missing", copy("Missing Arabic", "العربية مفقودة")),
    draftKeys: t("l10n.status.draft", copy("Draft review", "مسودة للمراجعة")),
    reviewedKeys: t("l10n.status.reviewed", copy("Reviewed", "تمت المراجعة")),
    orphanedKeys: t("l10n.status.orphaned", copy("Orphaned", "غير مستخدمة")),
    sourceHeading: t("l10n.heading.source", copy("English source", "المصدر الإنجليزي")),
    translationHeading: t("l10n.heading.translation", copy("Arabic translation", "الترجمة العربية")),
    stateHeading: t("l10n.heading.state", copy("State & actions", "الحالة والإجراءات")),
    governanceTitle: t("l10n.governance.title", copy("Versioned reference data", "بيانات مرجعية ذات إصدارات")),
    governanceBody: t(
      "l10n.governance.body",
      copy(
        "Changes are revisioned. Retired keys remain in history and can be restored; they are never silently deleted.",
        "تُحفظ التغييرات كإصدارات. تبقى المفاتيح المتوقفة في السجل ويمكن استعادتها، ولا تُحذف بصمت.",
      ),
    ),
    openAdd: t("l10n.add.open", copy("Add key", "إضافة مفتاح")),
    closeAdd: t("l10n.add.close", copy("Close", "إغلاق")),
    previous: t("common.previous", copy("Previous", "السابق")),
    next: t("common.next", copy("Next", "التالي")),
    page: t("common.page", copy("Page", "صفحة")),
    filteredResults: t("l10n.filtered.results", copy("filtered results", "نتائج تمت تصفيتها")),
    changedBy: t("l10n.history.actor", copy("Changed by", "غيّرها")),
    systemActor: t("l10n.history.system", copy("system", "النظام")),
    sourcePanel: t("l10n.history.source.panel", copy("admin panel", "لوحة الإدارة")),
    sourceSync: t("l10n.history.source.sync", copy("source sync", "مزامنة المصدر")),
    sourceRestore: t("l10n.history.source.restore", copy("restore", "استعادة")),
    updatedAt: t("admin.recordDrawer.updatedAt", copy("Registry updated", "تحديث السجل")),
    notConfigured: t("common.notConfigured", copy("Not configured", "غير مُهيّأ")),
    drawerSubtitle: t("admin.revamp.hub.rules", copy("Rules & content", "القواعد والمحتوى")),
  };

  const notConfigured = t("common.notConfigured", copy("Not configured", "غير مُهيّأ"));
  const drawerLabels = createAdminRecordDrawerLabels(t, locale);
  const lookupGovernance = [
    t("admin.revamp.lookup.governance.pair", copy("Every localized key preserves its English source and Arabic revision history.", "يحافظ كل مفتاح مترجم على مصدره الإنجليزي وسجل مراجعاته العربية.")),
    t("admin.revamp.lookup.governance.retire", copy("Orphaned keys remain restorable and are never silently deleted.", "تبقى المفاتيح غير المستخدمة قابلة للاستعادة ولا تُحذف بصمت.")),
    t("admin.revamp.lookup.governance.audit", copy("Updates run through the existing revisioned server actions.", "تمر التحديثات عبر إجراءات الخادم الحالية ذات الإصدارات.")),
  ];
  return (
    <AdminDestinationFrame
      current="/admin/localization"
      title={t("admin.revamp.lookup.title", copy("Lookup Management", "إدارة القوائم المرجعية"))}
      subtitle={t("admin.revamp.lookup.subtitle", copy("Shared reference data used across the platform", "البيانات المرجعية المشتركة المستخدمة في المنصة"))}
      hub={t("admin.revamp.hub.rules", copy("Rules & content", "القواعد والمحتوى"))}
      routeLabel="/admin/localization"
      designId="frame-20-admin-lookup-management"
      drawerLabels={drawerLabels}
      labels={{
        administration: t("navigation.administration", copy("Administration", "الإدارة")),
        breadcrumb: t("common.breadcrumb", copy("Breadcrumb", "مسار التنقل")),
        governance: t("admin.revamp.governance", copy("Governance on this surface", "الحوكمة في هذه الواجهة")),
        reconstruction: t("admin.revamp.reconstruction", copy("Reconstruction note", "ملاحظة إعادة البناء")),
      }}
      metrics={[
        {
          label: t("l10n.kpi.total", copy("Reference strings", "النصوص المرجعية")),
          value: loadFailed ? notConfigured : total,
          note: t("admin.revamp.lookup.metric.total.note", copy("RLS-visible, key-ordered registry", "سجل مرئي حسب صلاحيات الصفوف ومرتب بالمفتاح")),
        },
        {
          label: t("l10n.kpi.translated", copy("Translated (AR)", "مترجمة إلى العربية")),
          value: loadFailed ? notConfigured : translated,
          note: t("admin.revamp.lookup.metric.translation.note", copy(`${coverage}% coverage from the current read`, `تغطية ${coverage}% من القراءة الحالية`)),
        },
        {
          label: t("l10n.kpi.reviewed", copy("Reviewed", "تمت المراجعة")),
          value: loadFailed ? notConfigured : reviewed,
          note: t("admin.revamp.lookup.metric.reviewed.note", copy("Revision status, not an inferred approval", "حالة الإصدار وليست اعتماداً مستنتجاً")),
        },
      ]}
      tabs={[
        { label: t("admin.revamp.lookup.tabs.lists", copy("Reference lists", "القوائم المرجعية")), href: "/admin/localization" },
        { label: t("l10n.title", copy("Language & translations", "اللغة والترجمات")), href: "/admin/localization", current: true },
        { label: t("admin.revamp.lookup.tabs.planning", copy("Planning lookups", "قوائم التخطيط")), href: "/admin/planning/lookups" },
      ]}
      governance={lookupGovernance}
      reconstructionNote={t("admin.revamp.lookup.note", copy("The canonical Lookup destination resolves to the existing localization and governed planning-lookup sources. No reference-list count or language completeness claim is fabricated.", "تتجه وجهة القوائم المرجعية إلى مصادر الترجمة وقوائم التخطيط المحكومة الحالية. لا يتم اختلاق عدد للقوائم أو ادعاء اكتمال اللغة."))}
      context={
        <span className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          <span className="badge badge-info">SCR-ADM-100 · SB19</span>
          <LocaleSwitch locale={locale} />
        </span>
      }
    >
      {loadFailed ? (
        <div className="sq-banner sq-banner--critical" role="alert">
          {t("l10n.error.load", "Could not load the localization dictionary. Nothing was changed. Try again.")}
        </div>
      ) : (
        <Manager
          rows={rows}
          labels={labels}
          locale={locale}
          drawerGovernance={lookupGovernance}
        />
      )}
    </AdminDestinationFrame>
  );
}
