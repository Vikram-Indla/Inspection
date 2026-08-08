import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import FactoriesScopeBar from "@/components/sections/factories/factories-scope-bar/factories-scope-bar";
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
  // Read the small scope projection first. Loading every licence relationship
  // before a planner chooses a CR was the Factory 360 latency hotspot. The
  // selected portfolio below is the only query that hydrates licence detail.
  const { data: scopeRows, error: scopeError } = await sb.from("factories")
    .select("factory_code, name, cr_number, source, is_temporary")
    .order("cr_number", { ascending: true })
    .range(0, 4_999);
  if (scopeError) console.error("[factory registry] scope load failed", scopeError);
  const visibleScopeRows = (scopeRows ?? []).filter(row => !isTestFixtureEstablishment(row));
  const crNumbers = [...new Set(visibleScopeRows.map(row => row.cr_number).filter((value): value is string => Boolean(value)))];
  const manualScope = "manual-r05";
  const hasManualRows = visibleScopeRows.some(row => row.is_temporary && row.source === "immediate_manual");
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
  const selectedScopeCount = requestedScopeValue === manualScope
    ? visibleScopeRows.filter(row => row.is_temporary && row.source === "immediate_manual").length
    : visibleScopeRows.filter(row => row.cr_number === selectedCr).length;
  let portfolioQuery = sb.from("factories")
    .select("id, factory_code, name, cr_number, region, city, activity_class, risk_band, risk_score, source, source_synced_at, is_temporary, industrial_licenses(id, commercial_registration_id, license_number, plant_number, license_type, status, stage)")
    .order("risk_score", { ascending: false });
  portfolioQuery = requestedScopeValue === manualScope
    ? portfolioQuery.eq("is_temporary", true).eq("source", "immediate_manual")
    : portfolioQuery.eq("cr_number", selectedCr);
  const { data: fs, error: portfolioError } = await portfolioQuery;
  if (portfolioError) console.error("[factory registry] portfolio load failed", portfolioError);
  // F360-SRCH-001/F360-ARCH-001 — prefer the additive CR-centred dossier when
  // this legacy factory has a verified license mapping. If the new projection
  // is unavailable or unmapped, preserve the established /factories/:id path.
  const portfolioRows: RevampFactoryRow[] = (fs ?? []).filter(row => !isTestFixtureEstablishment(row)).map(({ industrial_licenses, ...row }) => {
    const commercialRegistrationId = industrial_licenses?.[0]?.commercial_registration_id ?? null;
    return {
      ...row,
      dossier_href: commercialRegistrationId ? `/factories/cr/${commercialRegistrationId}` : `/factories/${row.id}`,
      license: industrial_licenses?.[0] ?? null,
    };
  });
  const error = scopeError ?? portfolioError;
  const isEmpty = visibleScopeRows.length === 0;
  const portfolioLabel = requestedScopeValue === manualScope
    ? t("f360.provenance.manualPortfolio", "Manual R05 establishments")
    : `CR ${selectedCr || "—"}`;
  return (
    <Shell current="/factories" title="">
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("f360.err.load", "Couldn’t load factories.")}</strong> {t("f360.err.neutral", "The Factory list is temporarily unavailable. Nothing was changed.")} — {t("f360.err.retry", "retry")}.</div></div>}
      {!error && isEmpty && (
        <EmptyState glyph="🏭" title={t("f360.empty.title", "No factories in the list")}
          body={t("f360.empty.desc", "Factory identity records sync from the national source.")} />
      )}
      {!error && !isEmpty && <>
        <FactoriesScopeBar
          locale={locale}
          options={scopeOptions}
          value={requestedScopeValue}
          shown={portfolioRows.length}
          total={selectedScopeCount}
        />
        <div data-sqx-cards="flush">
          <RevampFactory360Portfolio
            key={selectedCr}
            factories={portfolioRows}
            portfolioLabel={portfolioLabel}
            canCreateInspection={permissions["create_inspection"]}
            locale={locale}
            provenanceStrings={{
              registered: t("f360.provenance.registered", "Registered · Senaei source"),
              registeredBody: t("f360.provenance.registeredBody", "Registered factory identity from the governed Senaei source."),
              manual: t("f360.provenance.manual", "Unregistered · manually created"),
              manualBody: t("f360.provenance.manualBody", "Manual R05 establishment. Identity is unverified and must not be treated as Senaei data."),
              test: t("f360.provenance.test", "Test data · not production"),
              testBody: t("f360.provenance.testBody", "Controlled Saqeel test data for product verification. It is not a Senaei source record and must not be used as production evidence."),
              unavailable: t("f360.provenance.unavailable", "Source provenance unavailable"),
              unavailableBody: t("f360.provenance.unavailableBody", "Registration and source ownership are not asserted until governed provenance is available."),
              sourceStatus: t("f360.provenance.status", "Source status & freshness"),
              recorded: t("f360.meta.recorded", "Recorded"),
              freshnessUnavailable: t("f360.provenance.freshnessUnavailable", "Freshness unavailable"),
              noSenaeiSync: t("f360.provenance.noSenaeiSync", "No Senaei synchronization timestamp applies to this manual record."),
            }}
          />
        </div>
      </>}
    </Shell>
  );
}
