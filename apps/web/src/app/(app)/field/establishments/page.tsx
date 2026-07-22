import Link from "next/link";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

const PAGE_SIZE = 50;

type SearchParams = { q?: string; status?: string; page?: string };
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

function pageHref(q: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/field/establishments${query ? `?${query}` : ""}`;
}

// PLAN v7 item 7 · FNS-103/104/107 · MVP1-M07-001.
// The existing /field/factory-360 route resolves a known identifier only; this
// is the missing field-native browse/search surface. Reads stay on the real
// factories + industrial_licenses projection and remain RLS-scoped.
export default async function FieldEstablishments({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const q = normalizedSearch(params.q);
  const status = params.status === "licensed" || params.status === "unlicensed" ? params.status : "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const first = (page - 1) * PAGE_SIZE;

  let query = sb.from("factories")
    .select("id, factory_code, name, cr_number, license_number, region, city, activity_class, source, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number)", { count: "exact" })
    .order("name")
    .range(first, first + PAGE_SIZE - 1);
  if (q) {
    query = query.or(`name.ilike.%${q}%,factory_code.ilike.%${q}%,cr_number.ilike.%${q}%,license_number.ilike.%${q}%`);
  }
  if (status) query = query.eq("is_temporary", status === "unlicensed");

  const { data, error, count } = await query;
  if (error) console.error("[field establishments] load", error.message);
  const rows = (data ?? []) as unknown as EstablishmentRow[];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const tabs = <FieldTabs active="visits" fabHref="/planning/immediate" labels={{
    dashboard: tr("field.tabs.dashboard", "Dashboard", "لوحة القيادة"),
    visits: tr("field.tabs.visits", "Visits", "الزيارات"),
    virtual: tr("field.tabs.virtual", "Virtual", "افتراضي"),
    fab: tr("field.establishments.createUrgent", "Create urgent visit", "إنشاء زيارة عاجلة"),
  }} />;

  return (
    <Shell current="/field" title={tr("field.establishments.title", "Field establishments", "المنشآت الميدانية")}
      context={<span className="ax-lozenge ax-lozenge--info">FNS-103 · FNS-104 · FNS-107</span>}>
      <div className="ax-field-page">
        <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
            <div>
              <h2>{tr("field.establishments.heading", "Browse establishments", "استعراض المنشآت")}</h2>
              <p className="ax-caption">{tr(
                "field.establishments.help",
                "Search the RLS-scoped Factory list. Unregistered creation continues through the governed Immediate Visit workflow and creates both the temporary record and visit.",
                "ابحث في قائمة المصانع ضمن نطاق الصلاحيات. يستمر إنشاء المنشأة غير المسجلة عبر مسار الزيارة الفورية المعتمد، وينشئ السجل المؤقت والزيارة معًا.",
              )}</p>
            </div>
            <Link className="ax-btn ax-btn--prominent ax-btn--field" href="/planning/immediate">
              {tr("field.establishments.createUnregistered", "Create unregistered visit", "إنشاء زيارة لمنشأة غير مسجلة")}
            </Link>
          </div>

          <form method="get" className="ax-row" style={{ marginBlockStart: "var(--ax-space-250)", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
            <div className="ax-field ax-field--field" style={{ maxInlineSize: "none", flex: 1 }}>
              <label className="ax-field__label" htmlFor="field-establishment-search">{tr("field.establishments.search", "Search name or identifier", "البحث بالاسم أو المعرّف")}</label>
              <input className="ax-input" id="field-establishment-search" name="q" defaultValue={q}
                placeholder={tr("field.establishments.searchPlaceholder", "Name, factory code, CR or industrial licence", "الاسم أو رمز المصنع أو السجل التجاري أو الترخيص الصناعي")} />
            </div>
            <div className="ax-field ax-field--field">
              <label className="ax-field__label" htmlFor="field-establishment-status">{tr("field.establishments.status", "Registration", "حالة التسجيل")}</label>
              <select className="ax-select" id="field-establishment-status" name="status" defaultValue={status}>
                <option value="">{tr("field.establishments.all", "All", "الكل")}</option>
                <option value="licensed">{tr("field.establishments.licensed", "Licensed", "مرخصة")}</option>
                <option value="unlicensed">{tr("field.establishments.unlicensed", "Unregistered / temporary", "غير مسجلة / مؤقتة")}</option>
              </select>
            </div>
            <button className="ax-btn ax-btn--secondary ax-btn--field" type="submit">{tr("common.search", "Search", "بحث")}</button>
          </form>
        </section>

        {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{tr("field.establishments.loadError", "Establishments are temporarily unavailable. Nothing was changed.", "المنشآت غير متاحة مؤقتًا. لم يتم تغيير أي شيء.")}</div></div>}
        {!error && rows.length === 0 && <EmptyState glyph="∅" title={tr("field.establishments.empty", "No establishments found", "لم يتم العثور على منشآت")}
          body={tr("field.establishments.emptyBody", "Change or clear the search filters. Only records visible through RLS can appear here.", "غيّر مرشحات البحث أو امسحها. لا تظهر هنا إلا السجلات المتاحة عبر صلاحيات الصفوف.")} />}

        {!error && rows.length > 0 && (
          <div className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
            <p className="ax-caption">{tr("field.establishments.count", "{shown} shown · {total} records in scope", "المعروض {shown} · إجمالي السجلات ضمن النطاق {total}")
              .replace("{shown}", String(rows.length)).replace("{total}", String(count ?? rows.length))}</p>
            {rows.map(row => {
              // PostgREST returns an array for a one-to-many embed but can return a
              // single object when exactly one related row exists under some FK
              // cardinality inferences — normalize defensively rather than assume.
              const licenses = Array.isArray(row.industrial_licenses)
                ? row.industrial_licenses
                : row.industrial_licenses ? [row.industrial_licenses] : [];
              const license = licenses.find(item => item.commercial_registration_id) ?? null;
              const dossierHref = license?.commercial_registration_id
                ? `/field/factory-360/${license.commercial_registration_id}?license=${license.id}`
                : null;
              return (
                <article key={row.id} className="ax-surface ax-panel">
                  <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
                    <div>
                      <h3><bdi>{row.name}</bdi></h3>
                      <p className="ax-caption"><bdi>{row.factory_code ?? "—"}</bdi> · {row.region ?? "—"} · {row.city ?? "—"}</p>
                    </div>
                    <span className={`ax-lozenge ${row.is_temporary ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>
                      {row.is_temporary
                        ? tr("field.establishments.unlicensed", "Unregistered / temporary", "غير مسجلة / مؤقتة")
                        : tr("field.establishments.licensed", "Licensed", "مرخصة")}
                    </span>
                  </div>
                  <dl className="ax-grid-2" style={{ marginBlock: "var(--ax-space-150)" }}>
                    <div><dt className="ax-caption">{tr("field.establishments.cr", "Commercial registration", "السجل التجاري")}</dt><dd><bdi>{row.cr_number ?? "—"}</bdi></dd></div>
                    <div><dt className="ax-caption">{tr("field.establishments.license", "Industrial licence", "الترخيص الصناعي")}</dt><dd><bdi>{license?.license_number ?? row.license_number ?? "—"}</bdi></dd></div>
                    <div><dt className="ax-caption">{tr("field.establishments.activity", "Activity", "النشاط")}</dt><dd>{row.activity_class ?? "—"}</dd></div>
                    <div><dt className="ax-caption">{tr("field.establishments.source", "Source / freshness", "المصدر / حداثة البيانات")}</dt><dd><bdi>{row.source}</bdi> · {row.source_synced_at ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(row.source_synced_at)) : "—"}</dd></div>
                  </dl>
                  {dossierHref ? <Link className="ax-btn ax-btn--secondary ax-btn--field" href={dossierHref}>{tr("field.establishments.open", "Open Factory 360", "فتح المصنع 360")}</Link>
                    : <span className="ax-caption">{tr("field.establishments.noDossier", "Factory 360 is unavailable until a commercial-registration/licence mapping exists.", "المصنع 360 غير متاح حتى يتوفر ربط بالسجل التجاري والترخيص.")}</span>}
                </article>
              );
            })}
            {pageCount > 1 && <nav className="ax-row" aria-label={tr("field.establishments.pages", "Establishment pages", "صفحات المنشآت")} style={{ justifyContent: "space-between" }}>
              {page > 1 ? <Link className="ax-btn ax-btn--secondary ax-btn--field" href={pageHref(q, status, page - 1)}>{tr("common.previous", "Previous", "السابق")}</Link> : <span />}
              <span className="ax-caption">{tr("field.establishments.page", "Page {page} of {count}", "الصفحة {page} من {count}").replace("{page}", String(page)).replace("{count}", String(pageCount))}</span>
              {page < pageCount ? <Link className="ax-btn ax-btn--secondary ax-btn--field" href={pageHref(q, status, page + 1)}>{tr("common.next", "Next", "التالي")}</Link> : <span />}
            </nav>}
          </div>
        )}
      </div>
      {tabs}
    </Shell>
  );
}
