import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import FactoryList, { type FactoryRow, type FactoryListStrings } from "./FactoryList";
import EmptyState from "@/components/EmptyState";
import RevampFactory360Portfolio, { type RevampFactoryRow } from "./RevampFactory360Portfolio";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";

// SCR-WEB-400 / M07-001 — factory registry (Factory 360 entry point).
export default async function Factories() {
  preloadShell("/factories");
  const { t } = await useT();
  const sb = await supabaseServer();
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
  const listStrings: FactoryListStrings = {
    regionLabel: t("f360.list.region", "Region"),
    allRegions: t("f360.list.allRegions", "All regions"),
    // FNS-107 — city filter. "City" term: register HT-025 (المدينة). allCities generic (draft).
    cityLabel: t("f360.list.city", "City"),
    allCities: t("f360.list.allCities", "All cities"),
    // FNS-103/104 — licensed/unlicensed. "Unlicensed": register EM-002 (غير مرخصة);
    // "Licensed": register EM-103 term (مرخصة). Group aria + "All" have no register row (draft).
    licenseGroupAria: t("f360.list.license.groupAria", "Filter by license status"),
    licenseAll: t("f360.list.license.all", "All"),
    licensed: t("f360.list.license.licensed", "Licensed"),
    unlicensed: t("f360.list.license.unlicensed", "Unlicensed"),
    of: t("f360.list.of", "of"),
    factoriesWord: t("f360.list.factoriesWord", "factories"),
    emptyRegionTitle: t("f360.list.emptyRegion.title", "No factories in this region"),
    emptyRegionDesc: t("f360.list.emptyRegion.desc", "Clear the filter to see the full Factory list."),
    thFactory: t("f360.list.th.factory", "Factory"),
    thCr: t("f360.list.th.cr", "CR"),
    thRegion: t("f360.list.th.region", "Region"),
    thCity: t("f360.list.th.city", "City"),
    thRisk: t("f360.list.th.risk", "Risk"),
    dossier: t("f360.list.dossier", "View factory"),
    portfolioLabel: t("f360.list.portfolio", "Factory portfolio"),
    licensedCountLabel: t("f360.list.licensedCount", "Licensed factories"),
    unlicensedCountLabel: t("f360.list.unlicensedCount", "Unlicensed establishments"),
    regionsCountLabel: t("f360.list.regionsCount", "Regions represented"),
    bandLabels: {
      high: t("enum.high", "high"),
      medium: t("enum.medium", "medium"),
      low: t("enum.low", "low"),
    },
  };
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
  const selectedCr = portfolioRows[0]?.cr_number ?? "";
  const selectedPortfolio = portfolioRows.filter(row => row.cr_number === selectedCr);
  return (
    <Shell current="/factories" title="">
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("f360.err.load", "Couldn’t load factories.")}</strong> {t("f360.err.neutral", "The Factory list is temporarily unavailable. Nothing was changed.")} — {t("f360.err.retry", "retry")}.</div></div>}
      {!error && isEmpty && (
        <EmptyState glyph="🏭" title={t("f360.empty.title", "No factories in the list")}
          body={t("f360.empty.desc", "Factory identity records sync from the national source (M07-002).")} />
      )}
      {!error && !isEmpty && <RevampFactory360Portfolio factories={selectedPortfolio} crNumber={selectedCr || "—"} />}
    </Shell>
  );
}
