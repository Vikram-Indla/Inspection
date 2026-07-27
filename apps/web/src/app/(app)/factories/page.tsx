import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import RevampFactory360Portfolio, { type RevampFactoryRow } from "./RevampFactory360Portfolio";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { resolveFactory360Permissions } from "@/lib/factory360/dossier";

// SCR-WEB-400 / M07-001 — factory registry (Factory 360 entry point).
export default async function Factories({ searchParams }: {
  searchParams: Promise<{ cr?: string }>;
}) {
  const { cr: requestedCr } = await searchParams;
  preloadShell("/factories");
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);
  if (!permissions["view_factory_360"]) {
    return (
      <Shell current="/factories" title={t("f360.title", "Factory 360")}>
        <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
          body={t("f360.permission.body", "You do not have access to factory profiles.")} />
      </Shell>
    );
  }
  const { data: fs, error } = await sb.from("factories")
    .select("id, factory_code, name, cr_number, region, city, activity_class, risk_band, risk_score, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number, license_type, status, stage)")
    .order("risk_score", { ascending: false });
  if (error) console.error("[factory registry] load failed", error);
  // F360-SRCH-001/F360-ARCH-001 — prefer the additive CR-centred dossier when
  // this legacy factory has a verified license mapping. If the new projection
  // is unavailable or unmapped, preserve the established /factories/:id path.
  const factoryRows = (fs ?? []).filter(row => !isTestFixtureEstablishment(row)).map(({ industrial_licenses, ...row }) => {
    const commercialRegistrationId = industrial_licenses?.[0]?.commercial_registration_id ?? null;
    return {
      ...row,
      industrial_licenses,
      dossier_href: commercialRegistrationId ? `/factories/cr/${commercialRegistrationId}` : `/factories/${row.id}`,
    };
  });
  const isEmpty = factoryRows.length === 0;
  const portfolioRows: RevampFactoryRow[] = factoryRows.map(row => ({
    id: row.id,
    factory_code: row.factory_code,
    name: row.name,
    cr_number: row.cr_number,
    region: row.region,
    city: row.city,
    activity_class: row.activity_class,
    risk_band: row.risk_band,
    risk_score: row.risk_score,
    source_synced_at: row.source_synced_at,
    dossier_href: row.dossier_href,
    license: row.industrial_licenses?.[0] ?? null,
  }));
  const crNumbers = [...new Set(portfolioRows.map(row => row.cr_number).filter(Boolean))];
  // CR-410/411/412 · WA-M4-AC-001 — the portfolio is CR-centred. Query state
  // selects one authorized CR without adding a route or accepting an arbitrary
  // identifier. An invalid/stale query falls back to the first RLS-visible CR.
  const selectedCr = requestedCr && crNumbers.includes(requestedCr)
    ? requestedCr
    : crNumbers[0] ?? "";
  const selectedPortfolio = portfolioRows.filter(row => row.cr_number === selectedCr);
  return (
    <Shell current="/factories" title="">
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("f360.err.load", "Couldn’t load factories.")}</strong> {t("f360.err.neutral", "The Factory list is temporarily unavailable. Nothing was changed.")} — {t("f360.err.retry", "retry")}.</div></div>}
      {!error && isEmpty && (
        <EmptyState glyph="🏭" title={t("f360.empty.title", "No factories in the list")}
          body={t("f360.empty.desc", "Factory identity records sync from the national source (M07-002).")} />
      )}
      {!error && !isEmpty && <>
        <form method="get" className="sq-surface sq-row" aria-label={t("f360.list.portfolio", "Factory portfolio")}>
          <div className="sq-field">
            <label className="sq-field__label" htmlFor="factory-cr-filter">{t("f360.list.th.cr", "CR")}</label>
            <select id="factory-cr-filter" className="sq-select" name="cr" defaultValue={selectedCr}>
              {crNumbers.map(crNumber => <option key={crNumber} value={crNumber}>{crNumber}</option>)}
            </select>
          </div>
          <button className="sq-btn sq-btn--secondary" type="submit">{t("f360.list.dossier", "View factory")}</button>
          <span className="sq-caption"><span className="sq-numeric">{crNumbers.length}</span> {t("f360.list.of", "of")} {t("f360.list.factoriesWord", "factories")}</span>
        </form>
        <RevampFactory360Portfolio
          key={selectedCr}
          factories={selectedPortfolio}
          crNumber={selectedCr || "—"}
          canCreateInspection={permissions["create_inspection"]}
          locale={locale}
        />
      </>}
    </Shell>
  );
}
