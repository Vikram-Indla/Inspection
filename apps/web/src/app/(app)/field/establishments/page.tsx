import Link from "next/link";
import { redirect } from "next/navigation";
import FieldNav from "@/components/field/FieldNav";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import styles from "./establishments.module.css";

// SAQEEL Field Establishments.dc.html — the design's field-native establishment
// browse surface: a sticky field header, a Licensed/Unlicensed segmented control
// with live counts, an affix search + filter drawer, and a card grid. Rendered
// with the SAQEEL design system (btn/badge/exc-chip/input/drawer classes +
// tokens) linked by (app)/field/layout.tsx — the old global <Shell>/ax-* chrome
// is dropped. All reads stay on the real, RLS-scoped factories + industrial_
// licenses projection; every card value is real or a governed "—" — no
// fabricated establishment data (project data-integrity law). The design's
// in-drawer "create" mock is intentionally NOT reproduced as a fake form:
// unregistered creation continues through the governed Immediate Visit workflow
// (/planning/immediate), reached from the header + empty-state CTAs.
//
// PLAN v7 item 7 · FNS-103/104/107 · MVP1-M07-001.

const PAGE_SIZE = 50;
const RISK_BANDS = ["low", "medium", "high"] as const;
// Partner-workstation PWA data boundary: only the 24 curated factories in
// CURRENT_LIVE_TEST_DATA_GUIDE may appear. This is intentionally an explicit
// allowlist so legacy and bulk-clutter rows fail closed.
const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

type SearchParams = { q?: string; status?: string; risk?: string; region?: string; city?: string; page?: string; filter?: string };
type LicenseLink = {
  id: string;
  commercial_registration_id: string | null;
  license_number: string;
  plant_number: string | null;
};
type EstablishmentRow = {
  id: string;
  factory_code: string | null;
  name: string;
  cr_number: string | null;
  license_number: string | null;
  region: string | null;
  city: string | null;
  risk_band: string | null;
  activity_class: string | null;
  source: string;
  source_synced_at: string | null;
  is_temporary: boolean;
  industrial_licenses: LicenseLink[] | LicenseLink | null;
};

function normalizedSearch(value: string | undefined) {
  return (value ?? "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// high → critical, medium → warning, low → compliant. Anything unknown/null is
// omitted rather than coloured — the DB is the only source of risk truth.
function riskExc(band: string | null): string | null {
  if (band === "high") return "exc-critical";
  if (band === "medium") return "exc-warning";
  if (band === "low") return "exc-compliant";
  return null;
}

export default async function FieldEstablishments({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const q = normalizedSearch(params.q);
  // The design has exactly two tabs (Licensed / Unlicensed); Licensed is the
  // default selection, matching the .dc.html initial state (tab 0).
  const status = params.status === "unlicensed" ? "unlicensed" : "licensed";
  const risk = (RISK_BANDS as readonly string[]).includes(params.risk ?? "") ? (params.risk as string) : "";
  const filterOpen = params.filter === "1";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const first = (page - 1) * PAGE_SIZE;

  // Real, RLS-scoped facet values for the region/city filters — derived from the
  // Factory rows this inspector can actually see, never invented.
  const { data: facetData } = await sb.from("factories")
    .select("region, city")
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .order("region");
  const regions = Array.from(new Set((facetData ?? []).map(r => r.region).filter((v): v is string => Boolean(v)))).sort();
  const cities = Array.from(new Set((facetData ?? []).map(r => r.city).filter((v): v is string => Boolean(v)))).sort();
  const region = regions.includes(params.region ?? "") ? (params.region as string) : "";
  const city = cities.includes(params.city ?? "") ? (params.city as string) : "";

  // The same scope (search + risk/region/city) drives both the list and the
  // per-tab counts; only the licensed/unlicensed split differs between them.
  const searchOr = `name.ilike.%${q}%,factory_code.ilike.%${q}%,cr_number.ilike.%${q}%,license_number.ilike.%${q}%`;

  // Exclude Playwright e2e fixture establishments at the DB layer so pagination
  // and the licensed/unlicensed counts stay correct. Every fixture carries a
  // 13-digit epoch-ms stamp in its name and/or factory_code (see
  // @/lib/field/fixtures for the rationale) — matched here with PostgREST POSIX
  // regex. null-safe (real rows may have no factory_code): each .or keeps
  // non-matching rows; the .or groups are ANDed together.
  type FactoryQuery<T> = { or(f: string): T };
  const excludeFixtures = <T extends FactoryQuery<T>>(query: T): T =>
    query
      .or("name.not.imatch.[0-9]{13}")
      .or("factory_code.is.null,factory_code.not.imatch.[0-9]{13}");

  let listQuery = sb.from("factories")
    .select("id, factory_code, name, cr_number, license_number, region, city, risk_band, activity_class, source, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number)", { count: "exact" })
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .eq("is_temporary", status === "unlicensed")
    .order("name")
    .range(first, first + PAGE_SIZE - 1);
  if (q) listQuery = listQuery.or(searchOr);
  if (risk) listQuery = listQuery.eq("risk_band", risk);
  if (region) listQuery = listQuery.eq("region", region);
  if (city) listQuery = listQuery.eq("city", city);
  listQuery = excludeFixtures(listQuery);

  let licensedQuery = sb.from("factories").select("id", { count: "exact", head: true })
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .eq("is_temporary", false);
  if (q) licensedQuery = licensedQuery.or(searchOr);
  if (risk) licensedQuery = licensedQuery.eq("risk_band", risk);
  if (region) licensedQuery = licensedQuery.eq("region", region);
  if (city) licensedQuery = licensedQuery.eq("city", city);
  licensedQuery = excludeFixtures(licensedQuery);

  let unlicensedQuery = sb.from("factories").select("id", { count: "exact", head: true })
    .in("factory_code", [...CLEAN_FACTORY_CODES])
    .eq("is_temporary", true);
  if (q) unlicensedQuery = unlicensedQuery.or(searchOr);
  if (risk) unlicensedQuery = unlicensedQuery.eq("risk_band", risk);
  if (region) unlicensedQuery = unlicensedQuery.eq("region", region);
  if (city) unlicensedQuery = unlicensedQuery.eq("city", city);
  unlicensedQuery = excludeFixtures(unlicensedQuery);

  const [{ data, error, count }, licensedRes, unlicensedRes] = await Promise.all([listQuery, licensedQuery, unlicensedQuery]);
  if (error) console.error("[field establishments] load", error.message);
  const rows = (data ?? []) as unknown as EstablishmentRow[];
  const licensedCount = licensedRes.count ?? 0;
  const unlicensedCount = unlicensedRes.count ?? 0;
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(overrides: Partial<{ status: string; page: number; filter: string; q: string }>) {
    const next = { status, page: 1, filter: "", q, ...overrides };
    const p = new URLSearchParams();
    if (next.q) p.set("q", next.q);
    if (next.status) p.set("status", next.status);
    if (risk) p.set("risk", risk);
    if (region) p.set("region", region);
    if (city) p.set("city", city);
    if (next.page > 1) p.set("page", String(next.page));
    if (next.filter) p.set("filter", next.filter);
    const query = p.toString();
    return `/field/establishments${query ? `?${query}` : ""}`;
  }

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const nav = (
    <FieldNav active="establishments" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );

  const riskLabel = (band: string) => band === "high"
    ? tr("field.establishments.riskHigh", "High", "عالية")
    : band === "medium" ? tr("field.establishments.riskMedium", "Medium", "متوسطة")
    : tr("field.establishments.riskLow", "Low", "منخفضة");

  const dt = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";

  // Header CTA — governed unregistered-visit entry point (matches the design's
  // "+ Unlicensed establishment" action). Links to the Immediate Visit workflow
  // rather than opening a fabricated create form.
  const addUnlicensed = (
    <Link className="btn btn-primary btn-sm" href="/planning/immediate">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }} aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {tr("field.establishments.addUnlicensed", "Unlicensed establishment", "منشأة غير مرخصة")}
    </Link>
  );

  const showEmptyHint = status === "licensed" && !!q && !error && rows.length === 0;

  return (
    <>
      <FieldHeader
        title={tr("field.establishments.title", "Establishments", "المنشآت")}
        subtitle={tr("field.establishments.authorityScope", "Authority-scoped", "نطاق محكوم بالصلاحية")}
        right={addUnlicensed}
        langHref={langHref} langLabel={langLabel}
      />

      <div className={styles.wrap}>
        {/* Licensed / Unlicensed segmented tabs — live RLS-scoped counts. */}
        <div className={styles.tabs} role="tablist" aria-label={tr("field.establishments.registrationTabs", "Registration status", "حالة التسجيل")}>
          <Link role="tab" aria-selected={status === "licensed"} aria-pressed={status === "licensed"}
            href={buildHref({ status: "licensed" })}
            className={`${styles.tab} ${status === "licensed" ? styles.tabActive : ""}`}>
            {tr("field.establishments.licensedTab", "Licensed establishments", "المنشآت المرخصة")} ({licensedCount})
          </Link>
          <Link role="tab" aria-selected={status === "unlicensed"} aria-pressed={status === "unlicensed"}
            href={buildHref({ status: "unlicensed" })}
            className={`${styles.tab} ${status === "unlicensed" ? styles.tabActive : ""}`}>
            {tr("field.establishments.unlicensedTab", "Unlicensed establishments", "المنشآت غير المرخصة")} ({unlicensedCount})
          </Link>
        </div>

        {/* Governed inline create hint — surfaced when a licensed search returns
            nothing, matching the design's showEmptyHint panel. */}
        {showEmptyHint && (
          <div className="panel" style={{ padding: "12px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }} role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth="1.7" style={{ width: 17, height: 17, flex: "none" }} aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
            </svg>
            <span className="t-caption" style={{ color: "var(--text-secondary)", flex: 1 }}>
              {tr("field.establishments.noLicensedFoundNote",
                "If no licensed establishment matches the search, a new (unlicensed) establishment can be created.",
                "في حال عدم وجود منشأة مرخّصة مطابقة للبحث، يمكن إنشاء منشأة جديدة (غير مرخصة).")}
            </span>
            <Link className="btn btn-primary btn-sm" href="/planning/immediate">
              {tr("field.establishments.addUnlicensed", "Unlicensed establishment", "منشأة غير مرخصة")}
            </Link>
          </div>
        )}

        {/* Affix search (submits on Enter) + filter-drawer trigger. */}
        <form method="get" className={styles.searchRow}>
          <input type="hidden" name="status" value={status} />
          {risk && <input type="hidden" name="risk" value={risk} />}
          {region && <input type="hidden" name="region" value={region} />}
          {city && <input type="hidden" name="city" value={city} />}
          <div className="input-affix" style={{ flex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input className="input" type="search" name="q" defaultValue={q}
              placeholder={tr("field.establishments.searchPlaceholder", "Search by name, license no., or city", "بحث بالاسم أو رقم الرخصة أو المدينة")}
              style={{ borderRadius: "var(--radius-full)" }} />
          </div>
          <Link className="btn btn-secondary" href={buildHref({ filter: "1" })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }} aria-hidden="true">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            {tr("field.establishments.filter", "Filter", "تصفية")}
          </Link>
        </form>

        {error && (
          <div className="panel" role="alert" style={{ padding: "12px 14px", color: "var(--status-critical-text)", background: "var(--status-critical-soft)", borderInlineStart: "3px solid var(--status-critical)" }}>
            {tr("field.establishments.loadError", "Establishments are temporarily unavailable. Nothing was changed.", "المنشآت غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}
          </div>
        )}

        {!error && rows.length === 0 && !showEmptyHint && (
          <div style={{ padding: "28px 8px", textAlign: "center" }}>
            <div style={{ fontWeight: 600, marginBlockEnd: 6 }}>{tr("field.establishments.empty", "No establishments found", "لم يتم العثور على منشآت")}</div>
            <p className="t-caption" style={{ maxWidth: 420, margin: "0 auto" }}>
              {tr("field.establishments.emptyBody", "Change or clear the search filters. Only records visible through RLS can appear here.", "غيّر مرشحات البحث أو امسحها. لا تظهر هنا إلا السجلات المتاحة عبر صلاحيات الصفوف.")}
            </p>
          </div>
        )}

        {!error && rows.length > 0 && (
          <>
            <p className="t-caption">
              {tr("field.establishments.count", "{shown} shown · {total} records in scope", "المعروض {shown} · إجمالي السجلات ضمن النطاق {total}")
                .replace("{shown}", String(rows.length)).replace("{total}", String(count ?? rows.length))}
            </p>
            <div className={styles.grid}>
              {rows.map(row => {
                // PostgREST returns an array for a one-to-many embed but can return a
                // single object under some FK cardinality inferences — normalize.
                const licenses = Array.isArray(row.industrial_licenses)
                  ? row.industrial_licenses
                  : row.industrial_licenses ? [row.industrial_licenses] : [];
                const license = licenses.find(item => item.commercial_registration_id) ?? null;
                const dossierHref = license?.commercial_registration_id
                  ? `/field/factory-360/${license.commercial_registration_id}?license=${license.id}`
                  : null;
                const exc = riskExc(row.risk_band);
                const licText = row.is_temporary
                  ? tr("field.establishments.noLicense", "No license", "بدون رخصة")
                  : (license?.license_number ?? row.license_number ?? "—");

                const inner = (
                  <>
                    <div className={styles.cardHead}>
                      <span className={styles.cardName}><bdi>{row.name}</bdi></span>
                      <span className={`badge ${row.is_temporary ? "badge-warning" : "badge-compliant"}`} style={{ height: 19 }}>
                        {row.is_temporary
                          ? tr("field.establishments.unlicensed", "Unregistered / temporary", "غير مسجلة / مؤقتة")
                          : tr("field.establishments.licensed", "Licensed", "مرخصة")}
                      </span>
                    </div>
                    <div className={`t-caption ${styles.cardLic}`}><span className="id-code"><bdi>{licText}</bdi></span></div>
                    <div className={styles.cardFoot}>
                      <span className="t-caption"><bdi>{row.city ?? "—"}</bdi></span>
                      <span className="grow" />
                      {exc && (
                        <span className={`exc-chip ${exc}`} style={{ height: 22 }}>
                          <span className="exc-mark" />{riskLabel(row.risk_band as string)}
                        </span>
                      )}
                    </div>
                  </>
                );

                return dossierHref ? (
                  <Link key={row.id} className={styles.card} href={dossierHref}
                    aria-label={tr("field.establishments.open", "Open Factory 360", "فتح المصنع 360")}>
                    {inner}
                  </Link>
                ) : (
                  <div key={row.id} className={`${styles.card} ${styles.cardStatic}`}
                    title={tr("field.establishments.noDossier", "Factory 360 is unavailable until a commercial-registration/licence mapping exists.", "المصنع 360 غير متاح حتى يتوفر ربط بالسجل التجاري والترخيص.")}>
                    {inner}
                  </div>
                );
              })}
            </div>

            {pageCount > 1 && (
              <nav className={styles.pager} aria-label={tr("field.establishments.pages", "Establishment pages", "صفحات المنشآت")}>
                {page > 1 ? <Link className="btn btn-secondary btn-sm" href={buildHref({ page: page - 1 })}>{tr("common.previous", "Previous", "السابق")}</Link> : <span />}
                <span className="t-caption">{tr("field.establishments.page", "Page {page} of {count}", "الصفحة {page} من {count}").replace("{page}", String(page)).replace("{count}", String(pageCount))}</span>
                {page < pageCount ? <Link className="btn btn-secondary btn-sm" href={buildHref({ page: page + 1 })}>{tr("common.next", "Next", "التالي")}</Link> : <span />}
              </nav>
            )}
          </>
        )}
      </div>

      {/* Filter drawer — GET form; only filters with real single-table backing
          are wired (trade name → search, risk/region/city → facet selects).
          Visit status is intentionally omitted: no clean single-table source. */}
      {filterOpen && (
        <>
          <Link href={buildHref({ filter: "" })} aria-label={tr("common.close", "Close", "إغلاق")}
            style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", zIndex: 40 }} />
          <div className="drawer" style={{ width: "min(460px, 94vw)", zIndex: 41, display: "flex", flexDirection: "column" }}>
            <div className="drawer-header">
              <div className="panel-title" style={{ fontSize: 16 }}>{tr("field.establishments.filterEst", "Filter Establishments", "تصفية المنشآت")}</div>
              <Link className="btn btn-ghost btn-icon" href={buildHref({ filter: "" })} aria-label={tr("common.close", "Close", "إغلاق")}>✕</Link>
            </div>
            <form method="get" className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="hidden" name="status" value={status} />
              <label className={styles.fld}>
                <span>{tr("field.establishments.tradeName", "Trade name / identifier", "الاسم التجاري أو المعرّف")}</span>
                <input className="input" name="q" defaultValue={q} placeholder={tr("field.establishments.estName", "Establishment name", "اسم المنشأة")} />
              </label>
              <label className={styles.fld}>
                <span>{tr("field.establishments.riskClass", "Risk classification", "تصنيف الخطورة")}</span>
                <select className="select" name="risk" defaultValue={risk}>
                  <option value="">{tr("field.establishments.all", "All", "الكل")}</option>
                  {RISK_BANDS.map(band => <option key={band} value={band}>{riskLabel(band)}</option>)}
                </select>
              </label>
              <label className={styles.fld}>
                <span>{tr("field.establishments.region", "Region", "المنطقة")}</span>
                <select className="select" name="region" defaultValue={region}>
                  <option value="">{tr("field.establishments.all", "All", "الكل")}</option>
                  {regions.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className={styles.fld}>
                <span>{tr("field.establishments.city", "City", "المدينة")}</span>
                <select className="select" name="city" defaultValue={city}>
                  <option value="">{tr("field.establishments.all", "All", "الكل")}</option>
                  {cities.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <div className={styles.drawerFoot} style={{ paddingInline: 0 }}>
                <Link className="btn btn-ghost" style={{ flex: 1 }} href={`/field/establishments?status=${status}`}>{tr("common.clear", "Clear", "مسح")}</Link>
                <button className="btn btn-primary" style={{ flex: 1 }} type="submit">{tr("common.apply", "Apply", "تطبيق")}</button>
              </div>
            </form>
          </div>
        </>
      )}

      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      {nav}
    </>
  );
}
