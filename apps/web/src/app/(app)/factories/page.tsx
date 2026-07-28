import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import RevampFactory360Portfolio, { type RevampFactoryRow } from "./RevampFactory360Portfolio";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { resolveFactory360Permissions } from "@/lib/factory360/dossier";

// SCR-WEB-400 / M07-001 — factory registry (Factory 360 entry point).
export default async function Factories({ searchParams }: {
  searchParams: Promise<{ cr?: string; scope?: string }>;
}) {
  const { cr: requestedCr, scope: requestedScope } = await searchParams;
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
    .select("id, factory_code, name, cr_number, region, city, activity_class, risk_band, risk_score, source, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number, license_type, status, stage)")
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
    source: row.source,
    source_synced_at: row.source_synced_at,
    is_temporary: row.is_temporary,
    dossier_href: row.dossier_href,
    license: row.industrial_licenses?.[0] ?? null,
  }));
  const crNumbers = [...new Set(portfolioRows.map(row => row.cr_number).filter(Boolean))];
  const manualScope = "manual-r05";
  const hasManualRows = portfolioRows.some(row => row.is_temporary && row.source === "immediate_manual");
  const scopeOptions = [
    ...crNumbers.map(crNumber => ({ value: `cr:${crNumber}`, label: `CR ${crNumber}` })),
    ...(hasManualRows ? [{
      value: manualScope,
      label: t("f360.provenance.manualPortfolio", "Manual R05 establishments"),
    }] : []),
  ];
  // CR-410/411/412 · WA-M4-AC-001 — the portfolio is CR-centred. Query state
  // selects one authorized CR without adding a route or accepting an arbitrary
  // identifier. An invalid/stale query falls back to the first RLS-visible CR.
  const requestedScopeValue = requestedScope && scopeOptions.some(option => option.value === requestedScope)
    ? requestedScope
    : requestedCr && crNumbers.includes(requestedCr)
      ? `cr:${requestedCr}`
      : scopeOptions[0]?.value ?? "";
  const selectedCr = requestedScopeValue.startsWith("cr:") ? requestedScopeValue.slice(3) : "";
  const selectedPortfolio = requestedScopeValue === manualScope
    ? portfolioRows.filter(row => row.is_temporary && row.source === "immediate_manual")
    : portfolioRows.filter(row => row.cr_number === selectedCr);
  const portfolioLabel = requestedScopeValue === manualScope
    ? t("f360.provenance.manualPortfolio", "Manual R05 establishments")
    : `CR ${selectedCr || "—"}`;
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
            <label className="sq-field__label" htmlFor="factory-cr-filter">{t("f360.list.portfolio", "Factory portfolio")}</label>
            <select id="factory-cr-filter" className="sq-select" name="scope" defaultValue={requestedScopeValue}>
              {scopeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <button className="sq-btn sq-btn--secondary" type="submit">{t("f360.list.dossier", "View factory")}</button>
          <span className="sq-caption"><span className="sq-numeric">{selectedPortfolio.length}</span> {t("f360.list.of", "of")} <span className="sq-numeric">{portfolioRows.length}</span> {t("f360.list.factoriesWord", "factories")}</span>
        </form>
        <RevampFactory360Portfolio
          key={selectedCr}
          factories={selectedPortfolio}
          portfolioLabel={portfolioLabel}
          canCreateInspection={permissions["create_inspection"]}
          locale={locale}
          provenanceStrings={{
            registered: t("f360.provenance.registered", "Registered · Senaei source"),
            registeredBody: t("f360.provenance.registeredBody", "Registered factory identity from the governed Senaei source."),
            manual: t("f360.provenance.manual", "Unregistered · manually created"),
            manualBody: t("f360.provenance.manualBody", "Manual R05 establishment. Identity is unverified and must not be treated as Senaei data."),
            unavailable: t("f360.provenance.unavailable", "Source provenance unavailable"),
            unavailableBody: t("f360.provenance.unavailableBody", "Registration and source ownership are not asserted until governed provenance is available."),
            sourceStatus: t("f360.provenance.status", "Source status & freshness"),
            recorded: t("f360.meta.recorded", "Recorded"),
            freshnessUnavailable: t("f360.provenance.freshnessUnavailable", "Freshness unavailable"),
            noSenaeiSync: t("f360.provenance.noSenaeiSync", "No Senaei synchronization timestamp applies to this manual record."),
          }}
        />
      </>}
    </Shell>
  );
}
