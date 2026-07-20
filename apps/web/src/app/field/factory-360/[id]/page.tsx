import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import EmptyState from "@/components/EmptyState";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import Factory360ExportButton from "@/app/factories/cr/[id]/Factory360ExportButton";
import Factory360Offline from "./Factory360Offline";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { loadFactory360Dossier, resolveFactory360Permissions, latestSubmission } from "@/lib/factory360/dossier";
import styles from "./field-factory360.module.css";

export const dynamic = "force-dynamic";

const text = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);

// TASK-FACTORY-360-IPAD-011 · SCR-IPAD Factory 360 · F360IPAD-NATIVE-003
// Field-native, read-only Factory 360 for the Inspector iPad channel. Renders
// from the SHARED lib/factory360 dossier loader — identical business data,
// calculations and permissions as the web dossier (SCR-WEB-400). Only layout,
// density, touch and action placement differ (platform-parity ledger).
export default async function FieldFactory360({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string; return?: string }>;
}) {
  const [{ id }, { license: requestedLicense, return: returnTo }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);

  const tabs = (
    <FieldTabs active="visits" fabHref="/field#visits" labels={{
      dashboard: t("field.tabs.dashboard", "Dashboard"),
      visits: t("field.tabs.visits", "Visits"),
      virtual: t("field.tabs.virtual", "Virtual"),
      fab: t("field.tabs.startNext", "Start next visit"),
    }} />
  );

  if (!permissions["view_factory_360"]) return (
    <Shell current="/field" title={t("f360.title", "Factory 360")}>
      <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
        body={t("f360.permission.body", "This CR dossier is outside your authorized permissions.")} />
      {tabs}
    </Shell>
  );

  const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
  if (!dossier.found || !dossier.cr) return (
    <Shell current="/field" title={t("f360.notFound.title", "Factory 360 dossier unavailable")}>
      <EmptyState glyph="∅" title={t("f360.notFound.desc", "CR not in your scope or does not exist")}
        body={dossier.crError ? t("f360.err.neutral", "The registry is temporarily unavailable. Nothing was changed.") : undefined} />
      {tabs}
    </Shell>
  );

  const {
    cr, licenses, licenseError, selected, factory, factoryId, licenseId,
    address, lines, government, docs, officialMedia, linkedEvidence, reports, riskHistory, penalties,
    latestApprovedFactorySnapshot, snapshotOrigin, approvedTrend, currentCompliance, reportCompliance,
    approvedEnforcement, portfolioCounts, highestRiskLicense, downloadUrls, mediaUrls, observedComparison,
    addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult,
    penaltiesResult, portfolioReportsResult, snapshotsResult, canonical,
  } = dossier;
  // Cross-provider canonical facts (TASK-...-015): consumed from the shared
  // server projection only — the iPad never calls a provider or re-resolves
  // precedence. Roles/discrepancy states surfaced honestly.
  const roleLozenge = (role: string) => role === "authoritative" ? "ax-lozenge--success" : role === "contract_unverified" ? "ax-lozenge--warning" : role === "conflicting" ? "ax-lozenge--critical" : role === "permission_restricted" || role === "unavailable" ? "" : "ax-lozenge--info";
  const discrepancyCounts = canonical.discrepancies.reduce<Record<string, number>>((acc, d) => { acc[d.state] = (acc[d.state] ?? 0) + 1; return acc; }, {});

  const dt = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—";
  const sourceStatus = (error: unknown, value: unknown, queried = true) => {
    if (error) return t("f360.source.degraded", "degraded");
    if (!queried) return t("f360.source.notAvailable", "Not Available");
    if (value == null || (Array.isArray(value) && value.length === 0)) return t("f360.source.empty", "available — no records");
    return t("f360.source.available", "available");
  };
  const badge = (error: unknown, value: unknown, queried = true) => <span className={`ax-lozenge ${error ? "ax-lozenge--warning" : queried ? "ax-lozenge--success" : ""}`}>{sourceStatus(error, value, queried)}</span>;
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
  const safeReturn = returnTo && returnTo.startsWith("/field") ? returnTo : null;

  return (
    <Shell current="/field" title={crTitle}
      context={<><span className="badge badge-info">SCR-IPAD · Factory 360</span><span className="ax-freshness">{t("f360.meta.source", "source")} {text(selected?.source_system ?? cr.source_system)} · {t("f360.meta.synced", "recorded")} {dt(selected?.source_synced_at ?? cr.source_synced_at)}</span></>}>
      <div className={`ax-field-page ${styles.page}`} data-factory360-layout="ipad-field">
        {licenseError ? <div className="ax-banner ax-banner--warning" role="status">{t("f360.licenses.degraded", "Industrial-license data is temporarily degraded; CR identity remains available.")}</div> : null}

        {/* Header: identity + source freshness */}
        <section className={`panel ${styles.header}`} aria-label={t("f360.context.heading", "Selected context")}>
          <div className={styles.headerTop}>
            <h2 className={styles.headerName}>{crTitle}</h2>
            {badge(dossier.crError, cr)}
          </div>
          <div className={styles.ids}>
            <span><strong>{t("f360.id.cr", "CR")}</strong> <bdi className="numeric">{cr.cr_number}</bdi></span>
            {cr.unified_number && <span><strong>{t("f360.cr.unified", "Unified")}</strong> <bdi className="numeric">{cr.unified_number}</bdi></span>}
            <span><strong>{t("f360.id.license", "License")}</strong> <bdi className="numeric">{text(selected?.license_number)}</bdi></span>
            <span><strong>{t("f360.plant", "Plant")}</strong> <bdi className="numeric">{text(selected?.plant_number)}</bdi></span>
            {selected && <span>{label(selected.license_type)} · {label(selected.stage)} · {label(selected.status)}</span>}
          </div>
          <Factory360Offline crId={cr.id} licenseId={selected?.id ?? null} locale={locale === "ar" ? "ar" : "en"} strings={{
            live: t("f360.offline.live", "Available offline · cached {ts}"),
            offline: t("f360.offline.offline", "Offline — showing cached snapshot from {ts} (not live)"),
            cached: t("f360.offline.cached", "Cached for offline · {ts} (values may be out of date; refresh failed)"),
            unavailable: t("f360.offline.unavailable", "No offline snapshot cached for this license yet — open while online to cache it."),
            refreshing: t("f360.offline.refreshing", "Refreshing offline snapshot…"),
            omitted: t("f360.offline.omitted", "Sections excluded by your permissions:"),
            gaps: t("f360.offline.gaps", "Integration gaps:"),
          }} />
        </section>

        {/* License selector strip */}
        <section className={`panel ${styles.header}`} aria-label={t("f360.licenses.heading", "Industrial licenses and plants")}>
          <p className="t-caption"><bdi>{cr.cr_number}</bdi> · {licenses.length} {t("f360.licenses.count", "licenses")}</p>
          {licenses.length ? <div className={styles.licenseStrip}>{licenses.map(row => (
            <a key={row.id} className={styles.licenseChip} href={withLicense(row.id)} aria-current={row.id === selected?.id ? "page" : undefined}>
              <strong><bdi>{row.license_number}</bdi></strong>
              <span className="t-caption">{t("f360.plant", "Plant")} <bdi>{text(row.plant_number)}</bdi> · {label(row.status)}</span>
              <span className="t-caption">{row.factories?.name ?? "—"}</span>
            </a>
          ))}</div> : <p className="t-caption">{t("f360.licenses.empty", "No industrial license is mapped to this CR.")}</p>}
        </section>

        {/* Field readiness quick facts */}
        <section className={`panel`} aria-label={t("f360.readiness.heading", "Field readiness")}>
          <div className={styles.readiness}>
            <div className={`panel ${styles.tile}`}>
              <span className="t-caption">{t("f360.risk.heading", "Saved risk")}</span>
              <span className={`${styles.tileValue} numeric`}>{permissions["view_risk_details"] ? text(factory?.risk_score) : t("f360.restricted", "restricted")}</span>
              <span className="t-caption">{permissions["view_risk_details"] ? label(factory?.risk_band) : ""}</span>
            </div>
            <div className={`panel ${styles.tile}`}>
              <span className="t-caption">{t("f360.compliance.heading", "Approved compliance")}</span>
              <span className={`${styles.tileValue} numeric`}>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</span>
              <span className="t-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : ""}</span>
            </div>
            <div className={`panel ${styles.tile}`}>
              <span className="t-caption">{t("f360.cr.approvedInspections", "Approved inspections")}</span>
              <span className={`${styles.tileValue} numeric`}>{portfolioReportsResult.error ? t("f360.source.degraded", "degraded") : portfolioCounts.approvedInspections}</span>
            </div>
            <div className={`panel ${styles.tile}`}>
              <span className="t-caption">{t("f360.location", "Location")}</span>
              <span className="numeric"><bdi>{address ? `${text(address.latitude)}, ${text(address.longitude)}` : (factory?.official_lat != null ? `${factory.official_lat}, ${factory.official_lng}` : "—")}</bdi></span>
            </div>
          </div>
          <p className="t-caption">{t("f360.cr.noAggregate", "Portfolio facts only. No CR-level risk score or compliance rate is calculated.")} {portfolioCounts.total} {t("f360.cr.totalLicenses", "licenses")} · {portfolioCounts.active}/{portfolioCounts.expired}/{portfolioCounts.suspended} {t("f360.cr.licenseStates", "active/expired/suspended")}{highestRiskLicense ? ` · ${t("f360.cr.highestRisk", "highest-risk")}: ${highestRiskLicense.license_number}` : ""}</p>
        </section>

        {/* Factory profile */}
        <details className={`panel ${styles.section}`} open>
          <summary><span>{t("f360.license.heading", "Selected license, plant & address")}</span>{badge(addressResult.error, address, !!selected)}</summary>
          <div className={styles.sectionBody}>
            {selected && factory ? <dl className={styles.facts}>
              <div><dt>{t("f360.id.factory", "Factory")}</dt><dd>{factory.name} · <bdi>{factory.factory_code}</bdi></dd></div>
              <div><dt>{t("f360.id.licenseDates", "Issued / expires")}</dt><dd className="numeric">{dt(selected.issue_date)} → {dt(selected.expiry_date)}</dd></div>
              <div><dt>{t("f360.id.licenseHolder", "License holder")}</dt><dd>{text(selected.holder_name)}</dd></div>
              <div><dt>{t("f360.location", "Address")}</dt><dd>{address ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en, locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en].filter(Boolean).join(" · ") || "—" : "—"}</dd></div>
              <div><dt>{t("common.region", "Region / city")}</dt><dd>{label(factory.region)} · {label(factory.city)}</dd></div>
              <div><dt>{t("f360.activity", "Activity")}</dt><dd>{label(factory.activity_class)}</dd></div>
            </dl> : <p className="t-caption">{t("f360.license.unavailable", "Select a mapped industrial license to load plant facts.")}</p>}
          </div>
        </details>

        {/* Compliance + reports */}
        <details className={`panel ${styles.section}`} open>
          <summary><span>{t("f360.compliance.heading", "Approved inspection compliance")}</span>{badge(reportsResult.error, reports, !!factoryId)}</summary>
          <div className={styles.sectionBody}>
            <p className="t-caption">{t("f360.compliance.rule", "Calculated only from the latest immutable submitted version of approved inspections and its frozen package definition. Returned or rejected inspections remain visible below but never affect this rate.")}</p>
            <p><strong className="numeric" style={{ fontSize: "2rem" }}>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</strong> <span className="t-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : t("f360.compliance.na", "No eligible approved scored answers")}{approvedTrend.length > 1 ? ` · ${t("f360.compliance.trend", "trend")} ${approvedTrend.map(row => `${row.compliance.rate}%`).join(" ← ")}` : ""}</span></p>
            {reports.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("f360.report.number", "Inspection")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.report.version", "Version")}</th><th scope="col">{t("f360.report.compliance", "Compliance")}</th><th scope="col" /></tr></thead><tbody>{reports.map(report => {
              const latest = latestSubmission(report); const compliance = reportCompliance[report.id];
              return <tr key={report.id}><td><bdi>{text(report.inspection_no ?? report.id.slice(0, 8))}</bdi><br /><span className="t-caption numeric">{dt(report.submitted_at ?? report.started_at)}</span></td><td><span className="badge badge-info">{label(report.status)}</span></td><td>{latest ? `v${latest.version_number}` : t("f360.report.notSubmitted", "not submitted")}</td><td className="numeric">{compliance?.rate == null ? "—" : `${compliance.rate}%`}</td><td><a className="ax-link" href={`/reports/inspection/${report.id}`}>{t("f360.report.open", "Open")}</a></td></tr>;
            })}</tbody></table></div> : <p className="t-caption">{t("f360.reports.empty", "No inspection reports are available for the selected plant.")}</p>}
          </div>
        </details>

        {/* Violations & penalties */}
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.violations.heading", "Violations & penalties")}</span>{badge(reportsResult.error, approvedEnforcement, !!factoryId)}</summary>
          <div className={styles.sectionBody}>
            {approvedEnforcement.length ? <ul>{approvedEnforcement.map(({ report, violation }) => <li key={violation.id}>
              <bdi>{text(violation.violation_codes?.code)}</bdi> · {text(violation.violation_codes?.title)} · {label(violation.violation_codes?.level)}
              <div className="t-caption">{t("f360.violation.corrective", "Corrective")}: {text(violation.violation_codes?.corrective_action)}{violation.violation_codes?.grace_period_days != null ? ` · ${violation.violation_codes.grace_period_days} ${t("common.days", "days")}` : ""} · <a className="ax-link" href={`/reports/inspection/${report.id}`}>{text(report.inspection_no ?? report.id.slice(0, 8))}</a></div>
            </li>)}</ul> : <p className="t-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.violations.empty", "No violations from approved inspection reports are visible in your scope.")}</p>}
            <h3>{t("f360.enforcement.heading", "Penalty lineage")}</h3>
            {penaltiesResult.error ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : penalties.length ? <ul>{penalties.map(row => <li key={row.id}><bdi>{row.notice_number}</bdi> · {label(row.status)} · {dt(row.issued_at)}</li>)}</ul> : <p className="t-caption">{t("f360.enforcement.empty", "No penalty notices are visible in your scope.")}</p>}
          </div>
        </details>

        {/* Risk + AI explanation */}
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.risk.heading", "Saved risk")}</span>{permissions["view_risk_details"] ? badge(riskResult.error, riskHistory, !!factoryId) : <span className="badge">{t("f360.restricted", "restricted")}</span>}</summary>
          <div className={styles.sectionBody}>
            {!permissions["view_risk_details"] ? <p className="t-caption">{t("f360.risk.restricted", "Risk detail requires Factory Risk permission.")}</p> : <>
              <p><strong className="numeric" style={{ fontSize: "2rem" }}>{text(factory?.risk_score)}</strong> · {label(factory?.risk_band)}</p>
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
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.industrial.heading", "Industrial information")}</span>{badge(linesResult.error, lines, !!licenseId)}</summary>
          <div className={styles.sectionBody}>
            {lines.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("f360.hsCode", "HS / activity")}</th><th scope="col">{t("f360.quantity", "Qty / cap")}</th><th scope="col">{t("f360.production", "Real / max")}</th></tr></thead><tbody>{lines.map(row => <tr key={row.id}><td>{label(row.item_type)}</td><td>{showLineName(row)}</td><td className="numeric"><bdi>{text(row.hs_code ?? row.activity_code)}</bdi></td><td className="numeric">{text(row.quantity)} / {text(row.capacity)}</td><td className="numeric">{text(row.real_production)} / {text(row.maximum_production)}</td></tr>)}</tbody></table></div> : <p className="t-caption">{linesResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.industrial.empty", "No source-backed products, spare parts, machines, production lines or raw materials are available.")}</p>}
            <h3>{t("f360.observed.heading", "Official vs latest approved observed snapshot")}</h3>
            {latestApprovedFactorySnapshot ? <>
              <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.field", "Field")}</th><th scope="col">{t("f360.observed.official", "Official")}</th><th scope="col">{t("f360.observed.captured", "Observed")}</th></tr></thead><tbody>{observedComparison.map(row => {
                const officialText = text(row.official); const observed = snapshotValue(row.observedKey); const matches = officialText === observed;
                return <tr key={row.key}><th scope="row">{compareLabel[row.key] ?? row.key}</th><td><bdi>{officialText}</bdi></td><td><bdi>{observed}</bdi> <span className={`ax-lozenge ${matches ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{matches ? t("f360.observed.same", "unchanged") : t("f360.observed.changed", "changed")}</span></td></tr>;
              })}</tbody></table></div>
              <p className="t-caption">{t("f360.observed.rule", "The observed column is the immutable official hierarchy snapshot captured with a submission that later became an approved report. It does not overwrite current source truth.")} {snapshotOrigin ? <a className="ax-link" href={`/reports/inspection/${snapshotOrigin.id}`}>{t("f360.observed.origin", "origin approved report")}</a> : null}</p>
            </> : <p className="t-caption">{snapshotsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.observed.empty", "No approved report has a governed factory snapshot for this selected license yet.")}</p>}
          </div>
        </details>

        {/* Government */}
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.government.heading", "Government records")}</span>{badge(governmentResult.error, government, !!licenseId)}</summary>
          <div className={styles.sectionBody}>
            {government.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th></tr></thead><tbody>{government.map(row => <tr key={row.id}><td>{text(row.title ?? row.record_type)}</td><td className="numeric"><bdi>{row.external_record_id}</bdi></td><td>{label(row.status)}</td><td className="numeric">{dt(row.valid_from)} → {dt(row.valid_to)}</td></tr>)}</tbody></table></div> : <p className="t-caption">{governmentResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.government.empty", "Government-domain records are unavailable until a governed source contract supplies them.")}</p>}
          </div>
        </details>

        {/* Documents & media */}
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.documents.heading", "Documents & factory media")}</span>{permissions["view_factory_documents"] ? badge(docsResult.error || mediaResult.error, [...docs, ...officialMedia, ...linkedEvidence], !!factoryId) : <span className="badge">{t("f360.restricted", "restricted")}</span>}</summary>
          <div className={styles.sectionBody}>
            {!permissions["view_factory_documents"] ? <p className="t-caption">{t("f360.documents.restricted", "Document metadata requires Factory Documents permission.")}</p> : <>
              {docs.length ? <ul>{docs.map(doc => <li key={doc.id}>{label(doc.business_category ?? doc.doc_type)} · {doc.title} · <bdi>{text(doc.reference_no)}</bdi> {permissions["download_factory_documents"] && downloadUrls[doc.id] ? <a className="ax-link" href={downloadUrls[doc.id]} download>{t("common.download", "Download")}</a> : <span className="t-caption">{permissions["download_factory_documents"] ? t("f360.download.unavailable", "file unavailable") : t("f360.download.restricted", "download restricted")}</span>}</li>)}</ul> : <p className="t-caption">{t("f360.documents.empty", "No source-backed document metadata is available.")}</p>}
              {officialMedia.some(asset => mediaUrls[asset.id]) && <><h3>{t("f360.media.official", "Official factory gallery")}</h3><div className={styles.mediaGrid}>{officialMedia.filter(asset => mediaUrls[asset.id]).map(asset => <figure key={asset.id}><img src={mediaUrls[asset.id]} alt={asset.title ?? t("f360.media.alt", "Official factory image")} /><figcaption className="t-caption">{asset.title ?? label(asset.category)}</figcaption></figure>)}</div></>}
              <p className="t-caption">{t("f360.media.boundary", "Only official factory/profile media appears here. Inspection evidence remains linked to its inspection report and is never merged into this gallery.")}</p>
              <h3>{t("f360.media.evidence", "Linked inspection evidence")}</h3>
              {linkedEvidence.length ? <ul>{linkedEvidence.map(asset => <li key={asset.id}><span className="badge badge-info">{label(asset.category)}</span> {asset.title ?? text(asset.evidence_id)} · {dt(asset.captured_at)} {asset.inspection_id ? <a className="ax-link" href={`/reports/inspection/${asset.inspection_id}`}>{t("f360.media.origin", "origin report")}</a> : null} {asset.evidence_id ? <a className="ax-link" href={`/evidence-ocr?evidence=${asset.evidence_id}`}>{t("f360.media.ocr", "Contextual OCR")}</a> : null}</li>)}</ul> : <p className="t-caption">{t("f360.media.evidenceEmpty", "No linked inspection, arrival or violation evidence is visible in your scope.")}</p>}
            </>}
          </div>
        </details>

        {/* Cross-provider canonical source & discrepancies (F360IPAD-API-015) */}
        <details className={`panel ${styles.section}`}>
          <summary><span>{t("f360.xpc.heading", "Source & cross-provider reconciliation")}</span><span className={`ax-lozenge ${discrepancyCounts["conflicting"] ? "ax-lozenge--critical" : discrepancyCounts["contract_unverified"] ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{discrepancyCounts["conflicting"] ? t("f360.xpc.conflicts", "conflicts") : discrepancyCounts["contract_unverified"] ? t("f360.xpc.unverified", "unverified master") : t("f360.xpc.reconciled", "reconciled")}</span></summary>
          <div className={styles.sectionBody}>
            <p className="t-caption">{t("f360.xpc.rule", "Facts are resolved once, server-side. Industry Shared master data is contract-unverified (fail-closed); Inspection API values are contextual; approved report facts are authoritative. Conflicts are surfaced, never overwritten.")}</p>
            <div className={styles.facts}>
              <div><dt>{t("f360.xpc.cr", "Commercial registration")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.commercialRegistration.role)}`}>{label(canonical.commercialRegistration.role)}</span> <span className="t-caption">{canonical.commercialRegistration.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.license", "Industrial license")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.industrialLicense.role)}`}>{label(canonical.industrialLicense.role)}</span> <span className="t-caption">{canonical.industrialLicense.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.plant", "Plant")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.plant.role)}`}>{label(canonical.plant.role)}</span> <span className="t-caption">{canonical.plant.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.activities", "Activities / products / materials")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.products.role)}`}>{label(canonical.products.role)}</span> <span className="t-caption">{canonical.products.value?.length ?? 0}/{canonical.materials.value?.length ?? 0}/{canonical.machines.value?.length ?? 0}</span></dd></div>
              <div><dt>{t("f360.xpc.workforce", "Workforce / contacts / delegations")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.workforce.role)}`}>{label(canonical.workforce.role)}</span> <span className="t-caption">INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED</span></dd></div>
              <div><dt>{t("f360.xpc.package", "Approved package / submission version")}</dt><dd><span className={`ax-lozenge ${roleLozenge(canonical.approvedPackageVersion.role)}`}>{label(canonical.approvedPackageVersion.role)}</span> <span className="t-caption numeric">{text(canonical.approvedPackageVersion.value)} · {text(canonical.immutableSubmissionVersion.value)}</span></dd></div>
            </div>
            <p className="t-caption">{t("f360.xpc.discrepancies", "Reconciliation")}: {Object.entries(discrepancyCounts).map(([state, n]) => `${label(state)} ${n}`).join(" · ") || t("f360.xpc.none", "no reconcilable facts")}</p>
          </div>
        </details>

        {/* Sticky field action bar */}
        <div className={`panel ${styles.actionBar}`} role="group" aria-label={t("common.actions", "Actions")}>
          {factoryId && (factory?.official_lat != null) && <a className="ax-btn ax-btn--field" href={`geo:${factory.official_lat},${factory.official_lng}?q=${factory.official_lat},${factory.official_lng}(${encodeURIComponent(factory.name)})`}>{t("f360.actions.openMap", "Open map")}</a>}
          {permissions["create_inspection"] && factoryId && <a className="btn btn-primary btn-lg btn-touch" href={`/planning/immediate?factory=${factoryId}&cr=${cr.id}&license=${selected?.id ?? ""}&returnTo=${encodeURIComponent(withLicense(selected?.id))}`}>{t("f360.actions.createInspection", "Create inspection")}</a>}
          {permissions["export_factory"] && <Factory360ExportButton label={t("f360.actions.exportPdf", "Export / share PDF")} />}
          {safeReturn && <a className="btn btn-ghost btn-touch" href={safeReturn}>{t("f360.actions.return", "Return to visit")}</a>}
        </div>
      </div>
      {tabs}
    </Shell>
  );
}
