import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import Factory360ExportButton from "@/app/(app)/factories/cr/[id]/Factory360ExportButton";
import Factory360Offline from "./Factory360Offline";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { loadFactory360Dossier, resolveFactory360Permissions, latestSubmission } from "@/lib/factory360/dossier";
import styles from "./field-factory360.module.css";
import Icon from "@/components/saqeel/icon/icon";
import { Heading, Metric, Text } from "@/components/saqeel/type";

const text = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);
const CLEAN_FACTORY_CODES = new Set([
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
]);

// TASK-FACTORY-360-IPAD-011 · SCR-IPAD Factory 360 · F360IPAD-NATIVE-003
// Field-native, read-only Factory 360 for the Inspector iPad channel. Renders
// from the SHARED lib/factory360 dossier loader — identical business data,
// calculations and permissions as the web dossier (SCR-WEB-400). Only layout,
// density, touch and action placement differ (platform-parity ledger).
//
// Chrome converted to the SAQEEL field design system: the global <Shell> is
// replaced by <FieldHeader> (back-arrow respects the `return` param) + the
// shared <FieldNav>, and every section card, badge, table, chip and the sticky
// action bar now use DS classes/tokens. All real dossier data, the
// chemical-permits/customs-exemptions section, the offline component,
// permission gating and the honest integration-gap degrade are unchanged.
export default async function FieldFactory360({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string; return?: string }>;
}) {
  const [{ id }, { license: requestedLicense, return: returnTo }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);

  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  // Back-arrow respects the existing `return` param (only in-field returns are
  // honoured) and otherwise falls back to the task list this screen is reached
  // from. safeReturn is also reused by the sticky "Return to visit" action.
  const safeReturn = returnTo && returnTo.startsWith("/field") ? returnTo : null;
  const back = (
    <Link href={safeReturn ?? "/field/my-tasks"} prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );
  const header = (title: React.ReactNode, subtitle?: React.ReactNode) => (
    <FieldHeader leading={back} title={title} subtitle={subtitle}
      langHref={langHref} langLabel={langLabel} />
  );

  if (!permissions["view_factory_360"]) return (
    <>
      {header(t("f360.title", "Factory 360"))}
      <div className={styles.page}>
        <div className="empty">
          <Icon name="restricted" size="xl" />
          <div className="empty-title">{t("f360.permission.title", "Factory 360 access required")}</div>
          <p className="t-caption">{t("f360.permission.body", "You do not have access to this factory profile.")}</p>
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );

  const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
  if (!dossier.found || !dossier.cr || !dossier.factory || !CLEAN_FACTORY_CODES.has(dossier.factory.factory_code)) return (
    <>
      {header(t("f360.notFound.title", "Factory 360 profile unavailable"))}
      <div className={styles.page}>
        <div className="empty">
          <Icon name="factory" size="xl" />
          <div className="empty-title">{t("f360.notFound.desc", "Factory registration not found or not available to you.")}</div>
          {dossier.crError ? <p className="t-caption">{t("f360.err.neutral", "The Factory list is temporarily unavailable. Nothing was changed.")}</p> : null}
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );

  const {
    cr, licenses, licenseError, selected, factory, factoryId, licenseId,
    address, lines, government, chemicalPermits, customsExemptions, chemicalPermitsError, customsExemptionsError,
    docs, officialMedia, linkedEvidence, reports, riskHistory, penalties,
    latestApprovedFactorySnapshot, snapshotOrigin, approvedTrend, currentCompliance, reportCompliance,
    approvedEnforcement, portfolioCounts, highestRiskLicense, downloadUrls, mediaUrls, observedComparison, exportsProducts,
    addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult,
    penaltiesResult, portfolioReportsResult, snapshotsResult, canonical,
  } = dossier;
  // Cross-provider canonical facts (TASK-...-015): consumed from the shared
  // server projection only — the iPad never calls a provider or re-resolves
  // precedence. Roles/discrepancy states surfaced honestly. DS badge variants.
  const roleBadge = (role: string) => role === "authoritative" ? "badge-compliant" : role === "contract_unverified" ? "badge-warning" : role === "conflicting" ? "badge-critical" : role === "permission_restricted" || role === "unavailable" ? "badge-outline" : "badge-info";
  const discrepancyCounts = canonical.discrepancies.reduce<Record<string, number>>((acc, d) => { acc[d.state] = (acc[d.state] ?? 0) + 1; return acc; }, {});

  const dt = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—";
  const sourceStatus = (error: unknown, value: unknown, queried = true) => {
    if (error) return t("f360.source.degraded", "degraded");
    if (!queried) return t("f360.source.notAvailable", "Not Available");
    if (value == null || (Array.isArray(value) && value.length === 0)) return t("f360.source.empty", "available — no records");
    return t("f360.source.available", "available");
  };
  const badge = (error: unknown, value: unknown, queried = true) => <span className={`badge ${error ? "badge-warning" : queried ? "badge-compliant" : "badge-outline"}`}>{sourceStatus(error, value, queried)}</span>;
  const showLineName = (row: { name_en: string | null; name_ar: string | null }) => locale === "ar" ? row.name_ar ?? row.name_en ?? "—" : row.name_en ?? row.name_ar ?? "—";
  const snapshotValue = (key: string) => {
    const value = latestApprovedFactorySnapshot?.snapshot?.[key];
    return value == null || value === "" || typeof value === "object" ? "—" : String(value);
  };
  const compareLabel: Record<string, string> = {
    cr: t("f360.compare.cr", "CR number"), license: t("f360.compare.license", "Industrial license"),
    plant: t("f360.compare.plant", "Plant number"), factory: t("f360.compare.factory", "Factory name"),
    region: t("f360.compare.region", "Region"), city: t("f360.compare.city", "City"),
    source: t("f360.compare.source", "Source system"),
  };
  const crTitle = locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number;
  const base = `/field/factory-360/${cr.id}`;
  const withLicense = (lid: string | undefined) => `${base}?license=${lid ?? ""}${returnTo ? `&return=${encodeURIComponent(returnTo)}` : ""}`;

  const subtitle = (
    <>
      SCR-IPAD · Factory 360 · {t("f360.meta.source", "source")} {text(selected?.source_system ?? cr.source_system)} · {t("f360.meta.synced", "recorded")} {dt(selected?.source_synced_at ?? cr.source_synced_at)}
    </>
  );

  return (
    <>
      {header(<bdi>{crTitle}</bdi>, subtitle)}
      <div className={styles.page} data-factory360-layout="ipad-field">
        {licenseError ? <div className="alert alert-warning" role="status">{t("f360.licenses.degraded", "Industrial-license data is temporarily degraded; CR identity remains available.")}</div> : null}

        {/* Header: identity + source freshness */}
        <section className={styles.header} aria-label={t("f360.context.heading", "Selected context")}>
          <div className={styles.headerTop}>
            <Heading level={2} visual="heading"><bdi>{crTitle}</bdi></Heading>
            {badge(dossier.crError, cr)}
          </div>
          <div className={styles.ids}>
            <span><strong>{t("f360.id.cr", "CR")}</strong> <bdi className="id-code">{cr.cr_number}</bdi></span>
            {cr.unified_number && <span><strong>{t("f360.cr.unified", "Unified")}</strong> <bdi className="id-code">{cr.unified_number}</bdi></span>}
            <span><strong>{t("f360.id.license", "License")}</strong> <bdi className="id-code">{text(selected?.license_number)}</bdi></span>
            <span><strong>{t("f360.plant", "Plant")}</strong> <bdi className="id-code">{text(selected?.plant_number)}</bdi></span>
            {selected && <span>{label(selected.license_type)} · {label(selected.stage)} · {label(selected.status)}</span>}
          </div>
          <Factory360Offline crId={cr.id} licenseId={selected?.id ?? null} locale={locale === "ar" ? "ar" : "en"} strings={{
            live: t("f360.offline.live", "Available offline · cached {ts}"),
            offline: t("f360.offline.offline", "Offline — showing cached snapshot from {ts} (not live)"),
            cached: t("f360.offline.cached", "Cached for offline · {ts} (values may be out of date; refresh failed)"),
            unavailable: t("f360.offline.unavailable", "No offline snapshot cached for this license yet — open while online to cache it."),
            refreshing: t("f360.offline.refreshing", "Refreshing offline snapshot…"),
            omitted: t("f360.offline.omitted", "Sections excluded by your permissions:"),
            gaps: t("f360.offline.gaps", "Integration gaps ({n}) — hover for detail"),
          }} />
        </section>

        {/* License selector strip */}
        <section className={styles.header} aria-label={t("f360.licenses.heading", "Industrial licenses and plants")}>
          <p className="t-caption"><bdi className="id-code">{cr.cr_number}</bdi> · {licenses.length} {t("f360.licenses.count", "licenses")}</p>
          {licenses.length ? <div className={styles.licenseStrip}>{licenses.map(row => (
            <a key={row.id} className={styles.licenseChip} href={withLicense(row.id)} aria-current={row.id === selected?.id ? "page" : undefined}>
              <strong><bdi>{row.license_number}</bdi></strong>
              <span className="t-caption">{t("f360.plant", "Plant")} <bdi>{text(row.plant_number)}</bdi> · {label(row.status)}</span>
              <span className="t-caption">{row.factories?.name ?? "—"}</span>
            </a>
          ))}</div> : <p className="t-caption">{t("f360.licenses.empty", "No industrial license is mapped to this CR.")}</p>}
        </section>

        {/* License-currency standing advisory — O-13/INSPECTOR-REQUIREMENTS §4:
            a persistent banner on the pre-visit establishment screen (not a
            one-off toast), always shown while a license is selected. */}
        {selected && (() => {
          const expiry = selected.expiry_date ? new Date(selected.expiry_date) : null;
          const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
          const tone = daysToExpiry == null ? "info" : daysToExpiry < 0 ? "critical" : daysToExpiry <= 30 ? "warning" : "info";
          return (
            <div className={`alert alert-${tone}`} role="status">
              <div>
                <div className="alert-title">{t("f360.licenseCurrency.title", "Verify license currency before you proceed")}</div>
                <div className="t-caption">
                  {daysToExpiry == null
                    ? t("f360.licenseCurrency.noExpiry", "No expiry date on record for this license — confirm the license number and status with the establishment and report any discrepancy.")
                    : daysToExpiry < 0
                      ? t("f360.licenseCurrency.expired", "This license shows as expired ({date}). Confirm with the establishment and report the discrepancy if it has since been renewed.").replace("{date}", dt(selected.expiry_date))
                      : daysToExpiry <= 30
                        ? t("f360.licenseCurrency.expiringSoon", "This license expires in {days} day(s) ({date}). Verify the license number on site.").replace("{days}", String(daysToExpiry)).replace("{date}", dt(selected.expiry_date))
                        : t("f360.licenseCurrency.valid", "License {number} recorded valid through {date}. Verify the number on site and report any discrepancy.").replace("{number}", selected.license_number).replace("{date}", dt(selected.expiry_date))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Field readiness quick facts */}
        <section className={styles.header} aria-label={t("f360.readiness.heading", "Field readiness")}>
          <div className={styles.readiness}>
            <div className={styles.tile}>
              <span className="t-caption">{t("f360.risk.heading", "Saved risk")}</span>
              <Metric>{permissions["view_risk_details"] ? text(factory?.risk_score) : t("f360.restricted", "restricted")}</Metric>
              <span className="t-caption">{permissions["view_risk_details"] ? label(factory?.risk_band) : ""}</span>
            </div>
            <div className={styles.tile}>
              <span className="t-caption">{t("f360.compliance.heading", "Approved compliance")}</span>
              <Metric>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</Metric>
              <span className="t-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : ""}</span>
            </div>
            <div className={styles.tile}>
              <span className="t-caption">{t("f360.cr.approvedInspections", "Approved inspections")}</span>
              <Metric>{portfolioReportsResult.error ? t("f360.source.degraded", "degraded") : portfolioCounts.approvedInspections}</Metric>
            </div>
            <div className={styles.tile}>
              <span className="t-caption">{t("f360.location", "Location")}</span>
              <span className="id-code"><bdi>{address ? `${text(address.latitude)}, ${text(address.longitude)}` : (factory?.official_lat != null ? `${factory.official_lat}, ${factory.official_lng}` : "—")}</bdi></span>
            </div>
          </div>
          <p className="t-caption">{t("f360.cr.noAggregate", "All-licenses facts only. No CR-level risk score or compliance rate is calculated.")} {portfolioCounts.total} {t("f360.cr.totalLicenses", "licenses")} · {portfolioCounts.active}/{portfolioCounts.expired}/{portfolioCounts.suspended} {t("f360.cr.licenseStates", "active/expired/suspended")}{highestRiskLicense ? ` · ${t("f360.cr.highestRisk", "highest-risk")}: ${highestRiskLicense.license_number}` : ""}</p>
        </section>

        {/* Factory profile */}
        <details className={styles.section} open>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.license.heading", "Selected license, plant & address")}</Text>{badge(addressResult.error, address, !!selected)}</summary>
          <div className={styles.sectionBody}>
            {selected && factory ? <dl className={styles.facts}>
              <div><dt>{t("f360.id.factory", "Factory")}</dt><dd>{factory.name} · <bdi className="id-code">{factory.factory_code}</bdi></dd></div>
              <div><dt>{t("f360.id.licenseDates", "Issued / expires")}</dt><dd className="id-code">{dt(selected.issue_date)} → {dt(selected.expiry_date)}</dd></div>
              <div><dt>{t("f360.id.licenseHolder", "License holder")}</dt><dd>{text(selected.holder_name)}</dd></div>
              <div><dt>{t("f360.location", "Address")}</dt><dd>{address ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en, locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en].filter(Boolean).join(" · ") || "—" : "—"}</dd></div>
              <div><dt>{t("common.region", "Region / city")}</dt><dd>{label(factory.region)} · {label(factory.city)}</dd></div>
              <div><dt>{t("f360.activity", "Activity")}</dt><dd>{label(factory.activity_class)}</dd></div>
              <div><dt>{t("f360.exportsProducts", "Exports products?")}</dt><dd>{exportsProducts == null ? t("f360.exportsProducts.unknown", "Unknown") : exportsProducts ? t("common.yes", "Yes") : t("common.no", "No")}</dd></div>
            </dl> : <p className="t-caption">{t("f360.license.unavailable", "Select a mapped industrial license to load plant facts.")}</p>}
          </div>
        </details>

        {/* Chemical permits & customs exemptions (Senaei v3 public endpoints, chemicalcustoms.json) */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.chemicalCustoms.heading", "Chemical permits & customs exemptions")}</Text>{badge(!!chemicalPermitsError || !!customsExemptionsError, [...chemicalPermits, ...customsExemptions], !!selected?.plant_number)}</summary>
          <div className={styles.sectionBody}>
            {!selected?.plant_number ? <p className="t-caption">{t("f360.chemicalCustoms.noPlant", "No plant number on the selected license — chemical permits and customs exemptions are looked up by plant number.")}</p> : <>
              <Heading level={3} visual="bodyStrong">{t("f360.chemicalPermits.heading", "Chemical permits")}</Heading>
              {chemicalPermitsError ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p>
                : chemicalPermits.length ? <ul>{chemicalPermits.map(permit => <li key={permit.externalId}>
                  <bdi className="id-code">{text(permit.approvalNumber)}</bdi> · {label(permit.type?.label)} · <span className="badge badge-info">{label(permit.status?.label)}</span>
                  <div className="t-caption id-code">{dt(permit.startsAt)} → {dt(permit.endsAt)}</div>
                </li>)}</ul> : <p className="t-caption">{t("f360.chemicalPermits.empty", "No chemical permits found for this plant.")}</p>}
              <Heading level={3} visual="bodyStrong">{t("f360.customsExemptions.heading", "Customs exemptions")}</Heading>
              {customsExemptionsError ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p>
                : customsExemptions.length ? <ul>{customsExemptions.map(exemption => <li key={exemption.externalId}>
                  <bdi className="id-code">{text(exemption.decreeNumber)}</bdi> · {label(exemption.type?.label)} · <span className="badge badge-info">{label(exemption.status?.label)}</span>
                  <div className="t-caption id-code">{dt(exemption.startsAt)} → {dt(exemption.endsAt)}</div>
                </li>)}</ul> : <p className="t-caption">{t("f360.customsExemptions.empty", "No customs exemptions found for this plant.")}</p>}
            </>}
          </div>
        </details>

        {/* Compliance + reports */}
        <details className={styles.section} open>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.compliance.heading", "Approved inspection compliance")}</Text>{badge(reportsResult.error, reports, !!factoryId)}</summary>
          <div className={styles.sectionBody}>
            <p className="t-caption">{t("f360.compliance.rule", "Calculated only from the latest final submitted version of approved inspections and the checklist version used for the inspection. Returned or rejected inspections stay visible below, but they never affect this rate.")}</p>
            <p><Metric>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</Metric> <span className="t-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : t("f360.compliance.na", "No eligible approved scored answers")}{approvedTrend.length > 1 ? ` · ${t("f360.compliance.trend", "trend")} ${approvedTrend.map(row => `${row.compliance.rate}%`).join(" ← ")}` : ""}</span></p>
            {reports.length ? <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("f360.report.number", "Inspection")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.report.version", "Version")}</th><th scope="col">{t("f360.report.compliance", "Compliance")}</th><th scope="col" /></tr></thead><tbody>{reports.map(report => {
              const latest = latestSubmission(report); const compliance = reportCompliance[report.id];
              return <tr key={report.id}><td><bdi className="id-code">{text(report.inspection_no ?? report.id.slice(0, 8))}</bdi><br /><span className="t-caption id-code">{dt(report.submitted_at ?? report.started_at)}</span></td><td><span className="badge badge-info">{label(report.status)}</span></td><td>{latest ? `v${latest.version_number}` : t("f360.report.notSubmitted", "not submitted")}</td><td className="id-code">{compliance?.rate == null ? "—" : `${compliance.rate}%`}</td><td><a className={styles.link} href={`/reports/inspection/${report.id}`}>{t("f360.report.open", "Open")}</a></td></tr>;
            })}</tbody></table></div> : <p className="t-caption">{t("f360.reports.empty", "No inspection reports are available for the selected plant.")}</p>}
          </div>
        </details>

        {/* Violations & penalties */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.violations.heading", "Violations & penalties")}</Text>{badge(reportsResult.error, approvedEnforcement, !!factoryId)}</summary>
          <div className={styles.sectionBody}>
            {approvedEnforcement.length ? <ul>{approvedEnforcement.map(({ report, violation }) => <li key={violation.id}>
              <bdi className="id-code">{text(violation.violation_codes?.code)}</bdi> · {text(violation.violation_codes?.title)} · {label(violation.violation_codes?.level)}
              <div className="t-caption">{t("f360.violation.corrective", "Corrective")}: {text(violation.violation_codes?.corrective_action)}{violation.violation_codes?.grace_period_days != null ? ` · ${violation.violation_codes.grace_period_days} ${t("common.days", "days")}` : ""} · <a className={styles.link} href={`/reports/inspection/${report.id}`}>{text(report.inspection_no ?? report.id.slice(0, 8))}</a></div>
            </li>)}</ul> : <p className="t-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.violations.empty", "No violations from approved inspection reports are visible in your scope.")}</p>}
            <Heading level={3} visual="bodyStrong">{t("f360.enforcement.heading", "Penalty history")}</Heading>
            {penaltiesResult.error ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : penalties.length ? <ul>{penalties.map(row => <li key={row.id}><bdi className="id-code">{row.notice_number}</bdi> · {label(row.status)} · {dt(row.issued_at)}</li>)}</ul> : <p className="t-caption">{t("f360.enforcement.empty", "No penalty notices are visible in your scope.")}</p>}
          </div>
        </details>

        {/* Risk + AI explanation */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.risk.heading", "Saved risk")}</Text>{permissions["view_risk_details"] ? badge(riskResult.error, riskHistory, !!factoryId) : <span className="badge badge-outline">{t("f360.restricted", "restricted")}</span>}</summary>
          <div className={styles.sectionBody}>
            {!permissions["view_risk_details"] ? <p className="t-caption">{t("f360.risk.restricted", "Risk detail requires Factory Risk permission.")}</p> : <>
              <p><Metric>{text(factory?.risk_score)}</Metric> · {label(factory?.risk_band)}</p>
              <p className="t-caption">{t("f360.risk.version", "Model")} {text(factory?.risk_version)} · {dt(factory?.risk_calculated_at)} · {riskHistory.length} {t("f360.risk.snapshots", "saved snapshots")}</p>
              {factoryId ? <ContextualAiPanel
                surface="factory_risk_explanation"
                title={t("f360.risk.ai.title", "Explain saved risk")}
                description={t("f360.risk.ai.description", "Advisory only. The explanation is restricted to saved Risk Engine facts and cannot recalculate or change risk.")}
                context={JSON.stringify({ factory_id: factoryId })}
                evidenceRefs={["MVP1-M07-014", "MVP1-M07-015", "F360-AC-004", factory?.risk_version ?? "risk_version_unavailable"]}
                targetRef={factoryId}
                locale={locale === "ar" ? "ar" : "en"}
                generateLabel={t("f360.risk.ai.generate", "Explain recorded factors")}
                unavailableLabel={t("f360.risk.ai.unavailable", "AI explanation unavailable")}
                evidenceLabel={t("f360.risk.ai.evidence", "Source references")}
                advisoryLabel={t("f360.risk.ai.advisory", "Human decision required")}
              /> : null}
            </>}
          </div>
        </details>

        {/* Industrial information + official vs observed */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.industrial.heading", "Industrial information")}</Text>{badge(linesResult.error, lines, !!licenseId)}</summary>
          <div className={styles.sectionBody}>
            {lines.length ? <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("f360.hsCode", "HS / activity")}</th><th scope="col">{t("f360.quantity", "Qty / cap")}</th><th scope="col">{t("f360.production", "Real / max")}</th></tr></thead><tbody>{lines.map(row => <tr key={row.id}><td>{label(row.item_type)}</td><td>{showLineName(row)}</td><td className="id-code"><bdi>{text(row.hs_code ?? row.activity_code)}</bdi></td><td className="id-code">{text(row.quantity)} / {text(row.capacity)}</td><td className="id-code">{text(row.real_production)} / {text(row.maximum_production)}</td></tr>)}</tbody></table></div> : <p className="t-caption">{linesResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.industrial.empty", "No source-backed products, spare parts, machines, production lines or raw materials are available.")}</p>}
            <Heading level={3} visual="bodyStrong">{t("f360.observed.heading", "Official vs latest approved observed snapshot")}</Heading>
            {latestApprovedFactorySnapshot ? <>
              <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("common.field", "Field")}</th><th scope="col">{t("f360.observed.official", "Official")}</th><th scope="col">{t("f360.observed.captured", "Observed")}</th></tr></thead><tbody>{observedComparison.map(row => {
                const officialText = text(row.official); const observed = snapshotValue(row.observedKey); const matches = officialText === observed;
                return <tr key={row.key}><th scope="row">{compareLabel[row.key] ?? row.key}</th><td><bdi>{officialText}</bdi></td><td><bdi>{observed}</bdi> <span className={`badge ${matches ? "badge-compliant" : "badge-warning"}`}>{matches ? t("f360.observed.same", "unchanged") : t("f360.observed.changed", "changed")}</span></td></tr>;
              })}</tbody></table></div>
              <p className="t-caption">{t("f360.observed.rule", "The observed column shows the official record as it was when someone submitted a report that was later approved. It does not change the current official record.")} {snapshotOrigin ? <a className={styles.link} href={`/reports/inspection/${snapshotOrigin.id}`}>{t("f360.observed.origin", "origin approved report")}</a> : null}</p>
            </> : <p className="t-caption">{snapshotsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.observed.empty", "No approved report has a governed factory snapshot for this selected license yet.")}</p>}
          </div>
        </details>

        {/* Government */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.government.heading", "Government records")}</Text>{badge(governmentResult.error, government, !!licenseId)}</summary>
          <div className={styles.sectionBody}>
            {government.length ? <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th></tr></thead><tbody>{government.map(row => <tr key={row.id}><td>{text(row.title ?? row.record_type)}</td><td className="id-code"><bdi>{row.external_record_id}</bdi></td><td>{label(row.status)}</td><td className="id-code">{dt(row.valid_from)} → {dt(row.valid_to)}</td></tr>)}</tbody></table></div> : <p className="t-caption">{governmentResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.government.empty", "Government-domain records are unavailable until a governed source contract supplies them.")}</p>}
          </div>
        </details>

        {/* Documents & media */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.documents.heading", "Documents & factory media")}</Text>{permissions["view_factory_documents"] ? badge(docsResult.error || mediaResult.error, [...docs, ...officialMedia, ...linkedEvidence], !!factoryId) : <span className="badge badge-outline">{t("f360.restricted", "restricted")}</span>}</summary>
          <div className={styles.sectionBody}>
            {!permissions["view_factory_documents"] ? <p className="t-caption">{t("f360.documents.restricted", "Document metadata requires Factory Documents permission.")}</p> : <>
              {docs.length ? <ul>{docs.map(doc => <li key={doc.id}>{label(doc.business_category ?? doc.doc_type)} · {doc.title} · <bdi className="id-code">{text(doc.reference_no)}</bdi> {permissions["download_factory_documents"] && downloadUrls[doc.id] ? <a className={styles.link} href={downloadUrls[doc.id]} download>{t("common.download", "Download")}</a> : <span className="t-caption">{permissions["download_factory_documents"] ? t("f360.download.unavailable", "file unavailable") : t("f360.download.restricted", "download restricted")}</span>}</li>)}</ul> : <p className="t-caption">{t("f360.documents.empty", "No source-backed document metadata is available.")}</p>}
              {officialMedia.some(asset => mediaUrls[asset.id]) && <><Heading level={3} visual="bodyStrong">{t("f360.media.official", "Official factory gallery")}</Heading><div className={styles.mediaGrid}>{officialMedia.filter(asset => mediaUrls[asset.id]).map(asset => <figure key={asset.id} style={{ margin: 0 }}><img src={mediaUrls[asset.id]} alt={asset.title ?? t("f360.media.alt", "Official factory image")} /><figcaption className="t-caption">{asset.title ?? label(asset.category)}</figcaption></figure>)}</div></>}
              <p className="t-caption">{t("f360.media.boundary", "Only official factory/profile media appears here. Inspection evidence remains linked to its inspection report and is never merged into this gallery.")}</p>
              <Heading level={3} visual="bodyStrong">{t("f360.media.evidence", "Linked inspection evidence")}</Heading>
              {linkedEvidence.length ? <ul>{linkedEvidence.map(asset => <li key={asset.id}><span className="badge badge-info">{label(asset.category)}</span> {asset.title ?? text(asset.evidence_id)} · {dt(asset.captured_at)} {asset.inspection_id ? <a className={styles.link} href={`/reports/inspection/${asset.inspection_id}`}>{t("f360.media.origin", "origin report")}</a> : null} {asset.evidence_id ? <a className={styles.link} href={`/evidence-ocr?evidence=${asset.evidence_id}`}>{t("f360.media.ocr", "Contextual OCR")}</a> : null}</li>)}</ul> : <p className="t-caption">{t("f360.media.evidenceEmpty", "No linked inspection, arrival or violation evidence is visible in your scope.")}</p>}
            </>}
          </div>
        </details>

        {/* Cross-provider canonical source & discrepancies (F360IPAD-API-015) */}
        <details className={styles.section}>
          <summary><Text as="span" role="bodyStrong" tone="inherit">{t("f360.xpc.heading", "Source & cross-provider reconciliation")}</Text><span className={`badge ${discrepancyCounts["conflicting"] ? "badge-critical" : discrepancyCounts["contract_unverified"] ? "badge-warning" : "badge-compliant"}`}>{discrepancyCounts["conflicting"] ? t("f360.xpc.conflicts", "conflicts") : discrepancyCounts["contract_unverified"] ? t("f360.xpc.unverified", "unverified master") : t("f360.xpc.reconciled", "reconciled")}</span></summary>
          <div className={styles.sectionBody}>
            <p className="t-caption">{t("f360.xpc.rule", "Facts are resolved once, server-side. Industry Shared master data is not shown until it can be confirmed; Inspection API values are contextual; approved report facts are authoritative. Conflicts are surfaced, never overwritten.")}</p>
            <div className={styles.facts}>
              <div><dt>{t("f360.xpc.cr", "Commercial registration")}</dt><dd><span className={`badge ${roleBadge(canonical.commercialRegistration.role)}`}>{label(canonical.commercialRegistration.role)}</span> <span className="t-caption">{canonical.commercialRegistration.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.license", "Industrial license")}</dt><dd><span className={`badge ${roleBadge(canonical.industrialLicense.role)}`}>{label(canonical.industrialLicense.role)}</span> <span className="t-caption">{canonical.industrialLicense.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.plant", "Plant")}</dt><dd><span className={`badge ${roleBadge(canonical.plant.role)}`}>{label(canonical.plant.role)}</span> <span className="t-caption">{canonical.plant.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.activities", "Activities / products / materials")}</dt><dd><span className={`badge ${roleBadge(canonical.products.role)}`}>{label(canonical.products.role)}</span> <span className="t-caption">{canonical.products.value?.length ?? 0}/{canonical.materials.value?.length ?? 0}/{canonical.machines.value?.length ?? 0}</span></dd></div>
              <div><dt>{t("f360.xpc.workforce", "Workforce / contacts / delegations")}</dt><dd><span className={`badge ${roleBadge(canonical.workforce.role)}`}>{label(canonical.workforce.role)}</span> <span className="t-caption">INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED</span></dd></div>
              <div><dt>{t("f360.xpc.package", "Checklist version / submission version")}</dt><dd><span className={`badge ${roleBadge(canonical.approvedPackageVersion.role)}`}>{label(canonical.approvedPackageVersion.role)}</span> <span className="t-caption id-code">{text(canonical.approvedPackageVersion.value)} · {text(canonical.immutableSubmissionVersion.value)}</span></dd></div>
            </div>
            <p className="t-caption">{t("f360.xpc.discrepancies", "Reconciliation")}: {Object.entries(discrepancyCounts).map(([state, n]) => `${label(state)} ${n}`).join(" · ") || t("f360.xpc.none", "no reconcilable facts")}</p>
          </div>
        </details>

        {/* Sticky field action bar */}
        <div className={styles.actionBar} role="group" aria-label={t("common.actions", "Actions")}>
          {factoryId && (factory?.official_lat != null) && <a className="btn btn-secondary" href={`geo:${factory.official_lat},${factory.official_lng}?q=${factory.official_lat},${factory.official_lng}(${encodeURIComponent(factory.name)})`}>{t("f360.actions.openMap", "Open map")}</a>}
          {permissions["create_inspection"] && factoryId && <a className="btn btn-primary" href={`/planning/immediate?factory=${factoryId}&cr=${cr.id}&license=${selected?.id ?? ""}&returnTo=${encodeURIComponent(withLicense(selected?.id))}`}>{t("f360.actions.createInspection", "Create inspection")}</a>}
          {factoryId && <a className="btn btn-secondary" href={`/planning/single?cr=${encodeURIComponent(cr.cr_number)}&license=${encodeURIComponent(selected?.license_number ?? "")}&plant=${encodeURIComponent(selected?.plant_number ?? "")}&factory=${factoryId}&source=factory360`}>{t("f360.actions.planSingle", "Plan a single visit")}</a>}
          {permissions["export_factory"] && <Factory360ExportButton label={t("f360.actions.exportPdf", "Export / share PDF")} />}
          {safeReturn && <a className="btn btn-ghost" href={safeReturn}>{t("f360.actions.return", "Return to visit")}</a>}
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
