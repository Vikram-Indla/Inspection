import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { performShellSearch, type GlobalSearchType } from "@/lib/shell-search";
import { shellGlobalSearchHref } from "@/lib/shell-navigation";
import { useT } from "@/lib/i18n";

// SAQEEL Field Global Search.dc.html — dedicated results page (previously
// only the header dropdown existed). Same query/ranking as the dropdown:
// both call performShellSearch() in lib/shell-search.ts, no second rule.
const TYPE_LABELS: Record<GlobalSearchType, { en: string; ar: string }> = {
  commercial_registration: { en: "Commercial registration", ar: "السجل التجاري" },
  industrial_license: { en: "Industrial license", ar: "الرخصة الصناعية" },
  plant: { en: "Plant", ar: "المصنع" },
  factory: { en: "Factory", ar: "المنشأة" },
  visit: { en: "Visit", ar: "الزيارة" },
  inspection: { en: "Inspection", ar: "التفتيش" },
};

export default async function FieldSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const tabs = (
    <FieldTabs active="home" labels={{
      home: t("field.tabs.dashboard", "Dashboard"),
      myTasks: t("field.tabs.visits", "Visits"),
      establishments: t("field.establishments.title", "Field establishments"),
      notifications: t("field.notifications.title", "Notifications"),
      account: t("field.account.title", "Account"),
    }} />
  );

  const title = tr("field.search.title", "Search", "البحث");
  const outcome = query.length >= 2 ? await performShellSearch(sb, query) : { results: [], degraded: false };

  return (
    <Shell current="/field" title={title}>
      <div className="ax-field-page" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <form className="ax-search" method="GET" action="/field/search" style={{ display: "flex", gap: "var(--ax-space-150)" }}>
          <input className="ax-input" type="search" name="q" defaultValue={query}
            placeholder={tr("field.search.placeholder", "Factory, CR, license, visit or inspection ID…", "المصنع، السجل التجاري، الرخصة، الزيارة أو رقم التفتيش…")}
            style={{ flex: 1 }} autoFocus />
          <button type="submit" className="ax-btn ax-btn--prominent">{tr("field.search.submit", "Search", "بحث")}</button>
        </form>

        {query.length > 0 && query.length < 2 && (
          <p className="ax-caption" role="status">{tr("field.search.tooShort", "Type at least 2 characters.", "أدخل حرفين على الأقل.")}</p>
        )}

        {outcome.degraded && (
          <div className="ax-banner ax-banner--warning" role="alert">
            {tr("field.search.degraded", "Some sources are temporarily unavailable — results may be incomplete.", "بعض المصادر غير متاحة مؤقتًا — قد تكون النتائج غير مكتملة.")}
          </div>
        )}

        {query.length >= 2 && outcome.results.length === 0 && !outcome.degraded && (
          <p className="ax-caption" role="status">{tr("field.search.empty", "No RLS-visible results for that search.", "لا توجد نتائج مرئية ضمن صلاحياتك لهذا البحث.")}</p>
        )}

        {outcome.results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            {outcome.results.map(result => (
              <Link key={`${result.type}-${result.id}`} href={shellGlobalSearchHref(result, true)} prefetch={false}
                className="ax-surface ax-panel"
                style={{ display: "block", padding: "var(--ax-space-200)", textDecoration: "none", color: "inherit", textAlign: "start" }}>
                <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong>{result.label ?? result.id.slice(0, 8)}</strong>
                    {result.detail && <p className="ax-caption ax-numeric" style={{ margin: 0 }}>{result.detail}</p>}
                  </div>
                  <span className="ax-lozenge ax-lozenge--info">{locale === "ar" ? TYPE_LABELS[result.type].ar : TYPE_LABELS[result.type].en}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {tabs}
    </Shell>
  );
}
