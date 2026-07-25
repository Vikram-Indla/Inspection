import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { performShellSearch, type GlobalSearchResult, type GlobalSearchType, type ShellSearchOutcome } from "@/lib/shell-search";
import { shellGlobalSearchHref } from "@/lib/shell-navigation";
import { useT } from "@/lib/i18n";
import styles from "./search.module.css";

// SAQEEL Field Global Search.dc.html — dedicated results screen (previously only
// the header dropdown existed). Same query/ranking as the dropdown: both call
// performShellSearch() in lib/shell-search.ts, no second rule. Chrome ported
// pixel-to-pixel from the design (back-arrow header, no bottom nav, search bar,
// type-filter pills, icon result rows). Recents in the design have no backing
// store here, so the honest empty/prompt state is shown instead of fabricated
// recent-search rows (CLAUDE.md data-integrity law).

// Short chip labels + result icons, matched to the design index. Icon tints use
// DS status/accent tokens only — never a bare color.
const TYPE_META: Record<GlobalSearchType, { en: string; ar: string; iconPath: string; iconBg: string; iconColor: string }> = {
  factory: { en: "Factory", ar: "مصنع", iconPath: "M4 21V9l8-6 8 6v12M9 21v-6h6v6", iconBg: "var(--accent-soft)", iconColor: "var(--accent-text)" },
  commercial_registration: { en: "CR", ar: "سجل تجاري", iconPath: "M9 12h6M9 16h6M9 8h3M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", iconBg: "var(--surface-sunken)", iconColor: "var(--text-secondary)" },
  industrial_license: { en: "License", ar: "ترخيص", iconPath: "M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6z", iconBg: "var(--status-compliant-soft)", iconColor: "var(--status-compliant-text)" },
  plant: { en: "Plant", ar: "منشأة صناعية", iconPath: "M4 21V9l8-6 8 6v12M9 21v-6h6v6", iconBg: "var(--accent-soft)", iconColor: "var(--accent-text)" },
  visit: { en: "Visit", ar: "زيارة", iconPath: "M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", iconBg: "var(--accent-soft)", iconColor: "var(--accent-text)" },
  inspection: { en: "Inspection", ar: "تفتيش", iconPath: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", iconBg: "var(--status-warning-soft)", iconColor: "var(--status-warning-text)" },
};

// Design chip order: All, Factory, CR, License, Visit, Inspection. Plant is a
// real search type with no design chip; kept last so filtering it stays possible
// (no accepted capability is weakened).
const ORDERED_TYPES: GlobalSearchType[] = ["factory", "commercial_registration", "industrial_license", "visit", "inspection", "plant"];

export default async function FieldSearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams;
  const query = (q ?? "").trim();
  const rawType = (type ?? "").trim();
  const activeType = ORDERED_TYPES.includes(rawType as GlobalSearchType) ? (rawType as GlobalSearchType) : null;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  // Preserve q + active filter across chip navigation and form submit.
  const chipHref = (target: GlobalSearchType | null) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (target) params.set("type", target);
    const qs = params.toString();
    return qs ? `/field/search?${qs}` : "/field/search";
  };

  const typeLabel = (ty: GlobalSearchType) => (locale === "ar" ? TYPE_META[ty].ar : TYPE_META[ty].en);
  // Forward chevron points end-ward: right in LTR, left in RTL.
  const chevron = locale === "ar" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  const backBtn = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );

  // performShellSearch folds per-source failures into `degraded`, but it can
  // still throw (transport/RPC failure). Catch it so the screen can state that
  // search is UNAVAILABLE instead of rendering a bare shell. The query itself
  // is untouched — same call, same ranking, same RLS-scoped client.
  let outcome: ShellSearchOutcome = { results: [], degraded: false };
  let searchThrew = false;
  if (query.length >= 2) {
    try {
      outcome = await performShellSearch(sb, query);
    } catch (err) {
      searchThrew = true;
      console.error("[field search]", err instanceof Error ? err.message : String(err));
    }
  }
  // Server-side type filter over the single performShellSearch outcome — no second query.
  const visibleResults = activeType ? outcome.results.filter(r => r.type === activeType) : outcome.results;

  // ERROR vs EMPTY. A degraded outcome that returned nothing means every source
  // failed — that is not an empty scope, and reporting "no results" there would
  // tell an inspector something false about the register. Degraded WITH results
  // stays a partial-results warning.
  const searchUnavailable = searchThrew || (outcome.degraded && outcome.results.length === 0);
  const partiallyDegraded = outcome.degraded && outcome.results.length > 0;
  // A type filter emptied a non-empty result set — distinct from "nothing matched".
  const emptyByFilter = !searchUnavailable && visibleResults.length === 0 && outcome.results.length > 0;
  const emptyOverall = !searchUnavailable && query.length >= 2 && outcome.results.length === 0;

  // Result grouping. The design's result list is flat, but it does carry a
  // section-header idiom on this same screen (the "Recent searches" t-label), so
  // grouped results reuse that exact treatment rather than a new one. Grouping is
  // presentation only — the source order from performShellSearch is preserved
  // inside each group, and a single-type result set stays flat.
  const groups = ORDERED_TYPES
    .map(type => ({ type, rows: visibleResults.filter(r => r.type === type) }))
    .filter(group => group.rows.length > 0);
  const grouped = !activeType && groups.length > 1;

  const resultRow = (result: GlobalSearchResult) => {
    const meta = TYPE_META[result.type];
    return (
      <Link key={`${result.type}-${result.id}`} href={shellGlobalSearchHref(result, true)} prefetch={false} className={styles.row}>
        <span className={styles.icn} style={{ background: meta.iconBg, color: meta.iconColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 19, height: 19 }} aria-hidden="true">
            <path d={meta.iconPath} />
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}><bdi>{result.label ?? result.id.slice(0, 8)}</bdi></span>
            <span className={`badge ${styles.typeBadge}`}>{typeLabel(result.type)}</span>
          </div>
          {result.detail && <div className="t-caption" style={{ marginBlockStart: 3 }}><bdi>{result.detail}</bdi></div>}
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15, color: "var(--text-muted)", flex: "none" }} aria-hidden="true">
          <path d={chevron} />
        </svg>
      </Link>
    );
  };

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.search.title", "Global Search", "البحث الشامل")}
        langHref={langHref} langLabel={langLabel}
      />

      {/* Search bar — GET form; submits on Enter (no client JS). */}
      <form className={styles.searchbar} method="GET" action="/field/search" role="search">
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input className={styles.input} type="search" name="q" defaultValue={query} autoFocus
          aria-label={tr("field.search.title", "Global Search", "البحث الشامل")}
          placeholder={tr("field.search.placeholder", "Search by factory, CR, license, visit or inspection", "ابحث برقم منشأة، سجل تجاري، ترخيص، زيارة أو تفتيش")} />
        {activeType && <input type="hidden" name="type" value={activeType} />}
        <button type="submit" className={styles.srSubmit}>{tr("field.search.submit", "Search", "بحث")}</button>
      </form>

      {/* Type-filter pills — real filter, aria-pressed active state. */}
      <div className={styles.seg} role="group" aria-label={tr("field.search.filterLabel", "Filter by type", "تصفية حسب النوع")}>
        <Link href={chipHref(null)} prefetch={false} aria-pressed={!activeType}
          className={`${styles.chip} ${!activeType ? styles.chipActive : ""}`}>
          {tr("field.search.filter.all", "All", "الكل")}
        </Link>
        {ORDERED_TYPES.map(key => (
          <Link key={key} href={chipHref(key)} prefetch={false} aria-pressed={activeType === key}
            className={`${styles.chip} ${activeType === key ? styles.chipActive : ""}`}>
            {typeLabel(key)}
          </Link>
        ))}
      </div>

      <div className={styles.wrap}>
        {/* Partial degradation — some sources answered, so results render under
            a warning. Never shown together with the unavailable state below. */}
        {partiallyDegraded && (
          <div className={`badge badge-warning ${styles.notice}`} role="alert">
            {tr("field.search.degraded", "Some sources are temporarily unavailable — results may be incomplete.", "بعض المصادر غير متاحة مؤقتًا — قد تكون النتائج غير مكتملة.")}
          </div>
        )}

        {query.length === 0 && (
          <div className={styles.state} role="status">
            {tr("field.search.prompt", "Start typing to search factories, CRs, licenses, plants, visits and inspections.", "ابدأ الكتابة للبحث في المصانع والسجلات التجارية والتراخيص والمنشآت والزيارات وعمليات التفتيش.")}
          </div>
        )}

        {query.length > 0 && query.length < 2 && (
          <div className={styles.state} role="status">{tr("field.search.tooShort", "Type at least 2 characters.", "أدخل حرفين على الأقل.")}</div>
        )}

        {/* ERROR — search could not run. Deliberately does NOT claim an empty
            scope, and offers the same query again rather than a dead end. */}
        {searchUnavailable && (
          <div className={`alert alert-critical ${styles.errorAlert}`} role="alert">
            <div>{tr("field.search.unavailable", "Search is temporarily unavailable, so no result can be shown for this query.", "البحث غير متاح مؤقتًا، ولا يمكن عرض أي نتيجة لهذا الاستعلام.")}</div>
            <Link href={chipHref(activeType)} prefetch={false} className={styles.retry}>
              {tr("field.search.retry", "Try again", "حاول مرة أخرى")}
            </Link>
          </div>
        )}

        {/* EMPTY — the query ran and genuinely matched nothing in scope. */}
        {emptyOverall && (
          <div className={styles.state} role="status">{tr("field.search.empty", "No matching results in your scope.", "لا توجد نتائج مطابقة ضمن صلاحياتك.")}</div>
        )}

        {/* EMPTY BY FILTER — matches exist, this type chip has none of them. */}
        {emptyByFilter && activeType && (
          <div className={styles.state} role="status">
            <div>{tr("field.search.emptyForType", "No results of this type.", "لا توجد نتائج من هذا النوع.")}</div>
            <Link href={chipHref(null)} prefetch={false} className={styles.retry}>
              {locale === "ar"
                ? `عرض كل النتائج (${outcome.results.length})`
                : t("field.search.showAll", `Show all results (${outcome.results.length})`)}
            </Link>
          </div>
        )}

        {grouped
          ? groups.map(group => (
              <div key={group.type}>
                <div className={`t-label ${styles.groupLabel}`}>
                  {typeLabel(group.type)} ({group.rows.length})
                </div>
                {group.rows.map(resultRow)}
              </div>
            ))
          : visibleResults.map(resultRow)}
      </div>
    </>
  );
}
