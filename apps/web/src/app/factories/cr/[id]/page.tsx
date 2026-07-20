import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { calculateApprovedCompliance } from "@/lib/factory360/compliance";
import { loadFactory360Dossier, resolveFactory360Permissions, latestSubmission } from "@/lib/factory360/dossier";
import Factory360ExportButton from "./Factory360ExportButton";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import styles from "./factory360.module.css";

export const dynamic = "force-dynamic";

const text = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);

// TASK-FACTORY-360-COMPLETE-010 · SCR-WEB-400 · MVP1-M07-001..020
// CR-centred, selected-license read model. The projection is loaded through the
// shared lib/factory360/dossier loader so the iPad field surface (SCR-IPAD)
// renders identical business data, calculations and permissions BY CONSTRUCTION.
export default async function Factory360ByCr({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string }>;
}) {
  const [{ id }, { license: requestedLicense }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);

  if (!permissions["view_factory_360"]) return (
    <Shell current="/factories" title={t("f360.title", "Factory 360")}>
      <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
        body={t("f360.permission.body", "This CR dossier is outside your authorized permissions.")} />
    </Shell>
  );

  const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
  if (!dossier.found || !dossier.cr) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory 360 dossier unavailable")}>
      <EmptyState glyph="∅" title={t("f360.notFound.desc", "CR not in your scope or does not exist")}
        body={dossier.crError ? t("f360.err.neutral", "The registry is temporarily unavailable. Nothing was changed.") : undefined} />
    </Shell>
  );

  const {
    cr, crError, licenses, licenseError, selected, factory, factoryId, licenseId,
    address, lines, government, docs, media, officialMedia, linkedEvidence, reports, riskHistory, penalties,
    latestApprovedFactorySnapshot, snapshotOrigin, approvedTrend, currentCompliance,
    approvedEnforcement, portfolioCounts, highestRiskLicense, downloadUrls, mediaUrls,
    addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult,
    penaltiesResult, portfolioReportsResult, snapshotsResult,
  } = dossier;

  const dt = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—";
  const sourceStatus = (error: unknown, value: unknown, queried = true) => {
    if (error) return t("f360.source.degraded", "degraded");
    if (!queried) return t("f360.source.notAvailable", "Not Available");
    if (value == null || (Array.isArray(value) && value.length === 0)) return t("f360.source.empty", "available — no records");
    return t("f360.source.available", "available");
  };
  const sourceBadge = (error: unknown, value: unknown, queried = true) => <span className={`${styles.status} ax-lozenge ${error ? "ax-lozenge--warning" : queried ? "ax-lozenge--success" : ""}`}>{sourceStatus(error, value, queried)}</span>;
  const showLineName = (row: { name_en: string | null; name_ar: string | null }) => locale === "ar" ? row.name_ar ?? row.name_en ?? "—" : row.name_en ?? row.name_ar ?? "—";
  const snapshotValue = (key: string) => {
    const value = latestApprovedFactorySnapshot?.snapshot?.[key];
    return value == null || value === "" || typeof value === "object" ? "—" : String(value);
  };
  const observedComparison = latestApprovedFactorySnapshot ? [
    [t("f360.compare.cr", "CR number"), cr.cr_number, snapshotValue("cr_number")],
    [t("f360.compare.license", "Industrial license"), selected?.license_number, snapshotValue("industrial_license_number")],
    [t("f360.compare.plant", "Plant number"), selected?.plant_number, snapshotValue("plant_number")],
    [t("f360.compare.factory", "Factory name"), factory?.name, snapshotValue("factory_name")],
    [t("f360.compare.region", "Region"), factory?.region, snapshotValue("region")],
    [t("f360.compare.city", "City"), factory?.city, snapshotValue("city")],
    [t("f360.compare.source", "Source system"), selected?.source_system ?? factory?.source, snapshotValue("source_system")],
  ] as const : [];

  return (
    <Shell current="/factories" title={locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number}
      context={<><span className="badge badge-info">SCR-WEB-400 · Factory 360</span><span className="ax-freshness">{t("f360.meta.source", "source")} {text(selected?.source_system ?? cr.source_system)} · {t("f360.meta.synced", "recorded")} {dt(selected?.source_synced_at ?? cr.source_synced_at)}</span></>}>
      {licenseError ? <div className="ax-banner ax-banner--warning" role="status"><div>{t("f360.licenses.degraded", "Industrial-license data is temporarily degraded; CR identity remains available.")}</div></div> : null}
      <div className={styles.workspace} data-factory360-layout="cr-license-dossier">
        <aside className={styles.left} aria-label={t("f360.licenses.heading", "Industrial licenses and plants")}>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("f360.licenses.heading", "Licenses & plants")}</h2>
            <p className="t-caption"><bdi>{cr.cr_number}</bdi> · {licenses.length} {t("f360.licenses.count", "licenses")}</p>
            {licenses.length ? <ul className={styles.licenseList}>{licenses.map(row => <li key={row.id}>
              <a className={styles.licenseLink} href={`/factories/cr/${cr.id}?license=${row.id}`} aria-current={row.id === selected?.id ? "page" : undefined}>
                <strong><bdi>{row.license_number}</bdi></strong><br />
                <span className="t-caption">{t("f360.plant", "Plant")} <bdi>{text(row.plant_number)}</bdi> · {label(row.status)}</span>
              </a>
            </li>)}</ul> : <p className="t-caption">{t("f360.licenses.empty", "No industrial license is mapped to this CR.")}</p>}
          </section>
        </aside>

        <main className={styles.main}>
          <section className={`panel ${styles.panel}`} aria-labelledby="f360-cr-heading">
            <div className={styles.sectionHead}><h2 id="f360-cr-heading">{t("f360.cr.heading", "Commercial registration & legal identity")}</h2>{sourceBadge(crError, cr)}</div>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.number", "CR number")}</dt><dd className="numeric"><bdi>{cr.cr_number}</bdi></dd></div>
              <div><dt>{t("f360.cr.unified", "Unified number")}</dt><dd className="numeric"><bdi>{text(cr.unified_number)}</bdi></dd></div>
              <div><dt>{t("f360.cr.legalEn", "Legal name (English)")}</dt><dd lang="en" dir="ltr">{text(cr.legal_name_en ?? cr.legal_name)}</dd></div>
              <div><dt>{t("f360.cr.legalAr", "Legal name (Arabic)")}</dt><dd lang="ar" dir="rtl">{text(cr.legal_name_ar)}</dd></div>
              <div><dt>{t("common.status", "Status")}</dt><dd>{label(cr.status)}</dd></div>
              <div><dt>{t("f360.cr.dates", "Issued / expires")}</dt><dd className="numeric">{dt(cr.issue_date)} → {dt(cr.expiry_date)}</dd></div>
              <div><dt>{t("f360.cr.owner", "Owner details")}</dt><dd>{text(cr.owner_details)}</dd></div>
            </dl>
            <h3>{t("f360.cr.portfolio", "License portfolio")}</h3>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.totalLicenses", "Total licenses")}</dt><dd className="numeric">{portfolioCounts.total}</dd></div>
              <div><dt>{t("f360.cr.licenseStates", "Active / expired / suspended")}</dt><dd className="numeric">{portfolioCounts.active} / {portfolioCounts.expired} / {portfolioCounts.suspended}</dd></div>
              <div><dt>{t("f360.cr.highestRisk", "Highest-risk license")}</dt><dd>{highestRiskLicense ? <><bdi>{highestRiskLicense.license_number}</bdi> · {text(highestRiskLicense.factories?.risk_score)} · {label(highestRiskLicense.factories?.risk_band)}</> : t("f360.compliance.notAvailable", "Not Available")}</dd></div>
              <div><dt>{t("f360.cr.approvedInspections", "Approved inspections")}</dt><dd className="numeric">{portfolioReportsResult.error ? t("f360.source.degraded", "degraded") : portfolioCounts.approvedInspections}</dd></div>
              <div><dt>{t("f360.cr.openViolations", "Open violations")}</dt><dd>{t("f360.cr.openViolationsUnavailable", "Not Available — runtime violations have no governed open/closed state")}</dd></div>
              <div><dt>{t("f360.cr.activePenalties", "Active penalties")}</dt><dd>{t("f360.cr.activePenaltiesUnavailable", "Not Available — current penalty statuses do not define Active/Expired/Cancelled")}</dd></div>
            </dl>
            <p className="t-caption">{t("f360.cr.noAggregate", "Portfolio facts only. No CR-level risk score or compliance rate is calculated.")}</p>
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-license-heading">
            <div className={styles.sectionHead}><h2 id="f360-license-heading">{t("f360.license.heading", "Selected license, plant & address")}</h2>{sourceBadge(addressResult.error, address, !!selected)}</div>
            {selected && factory ? <dl className={styles.facts}>
              <div><dt>{t("f360.id.license", "Industrial license")}</dt><dd className="numeric"><bdi>{selected.license_number}</bdi></dd></div>
              <div><dt>{t("f360.plant", "Plant number")}</dt><dd className="numeric"><bdi>{text(selected.plant_number)}</bdi></dd></div>
              <div><dt>{t("f360.id.factory", "Factory")}</dt><dd>{factory.name} · <bdi>{factory.factory_code}</bdi></dd></div>
              <div><dt>{t("f360.id.licenseStatus", "Status / stage")}</dt><dd>{label(selected.status)} · {label(selected.stage)}</dd></div>
              <div><dt>{t("f360.id.licenseDates", "Issued / expires")}</dt><dd className="numeric">{dt(selected.issue_date)} → {dt(selected.expiry_date)}</dd></div>
              <div><dt>{t("f360.id.licenseHolder", "License holder")}</dt><dd>{text(selected.holder_name)}</dd></div>
              <div><dt>{t("f360.location", "Address")}</dt><dd>{address ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en, locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en].filter(Boolean).join(" · ") || "—" : "—"}</dd></div>
              <div><dt>{t("f360.coordinates", "Coordinates")}</dt><dd className="numeric"><bdi>{address ? `${text(address.latitude)}, ${text(address.longitude)}` : "—"}</bdi></dd></div>
            </dl> : <p className="t-caption">{t("f360.license.unavailable", "Select a mapped industrial license to load plant facts.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-observed-heading">
            <div className={styles.sectionHead}><h2 id="f360-observed-heading">{t("f360.observed.heading", "Official vs latest approved observed snapshot")}</h2>{sourceBadge(snapshotsResult.error, latestApprovedFactorySnapshot, !!factoryId && !!licenseId)}</div>
            <p className="t-caption">{t("f360.observed.rule", "The observed column is the immutable official hierarchy snapshot captured with a submission that later became an approved report. It does not overwrite current source truth.")}</p>
            {latestApprovedFactorySnapshot ? <>
              <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.field", "Field")}</th><th scope="col">{t("f360.observed.official", "Current official")}</th><th scope="col">{t("f360.observed.captured", "Observed at submission")}</th><th scope="col">{t("f360.observed.result", "Comparison")}</th></tr></thead><tbody>{observedComparison.map(([field, official, observed]) => {
                const officialText = text(official); const matches = officialText === observed;
                return <tr key={field}><th scope="row">{field}</th><td><bdi>{officialText}</bdi></td><td><bdi>{observed}</bdi></td><td><span className={`ax-lozenge ${matches ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{matches ? t("f360.observed.same", "unchanged") : t("f360.observed.changed", "changed or unavailable")}</span></td></tr>;
              })}</tbody></table></div>
              <p className="t-caption">{t("f360.observed.capturedAt", "Captured")} {dt(latestApprovedFactorySnapshot.captured_at)} · SHA-256 <bdi>{latestApprovedFactorySnapshot.snapshot_sha256.slice(0, 12)}…</bdi>{snapshotOrigin ? <> · <a className="ax-link" href={`/reports/inspection/${snapshotOrigin.id}`}>{t("f360.observed.origin", "origin approved report")}</a></> : null}</p>
            </> : <p className="t-caption">{snapshotsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.observed.empty", "No approved report has a governed factory snapshot for this selected license yet.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-compliance-heading">
            <div className={styles.sectionHead}><h2 id="f360-compliance-heading">{t("f360.compliance.heading", "Approved inspection compliance")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            <p className="t-caption">{t("f360.compliance.rule", "Calculated only from the latest immutable submitted version of approved inspections and its frozen package definition. Returned or rejected inspections remain visible below but never affect this rate.")}</p>
            <p><strong className="numeric" style={{ fontSize: "2rem" }}>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</strong> <span className="t-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : t("f360.compliance.na", "No eligible approved scored answers")}</span></p>
            {approvedTrend.length > 1 && <div className={styles.trend} aria-label={t("f360.compliance.trend", "Approved compliance trend")}>{[...approvedTrend].reverse().map(({ report, compliance }) => <div className={styles.trendPoint} key={report.id} title={`${text(report.inspection_no)} · ${compliance.rate}%`}><span className={styles.trendBar} style={{ blockSize: `${Math.max(4, compliance.rate ?? 0)}px` }} /><span className="t-caption numeric">{compliance.rate}%</span></div>)}</div>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-reports-heading">
            <div className={styles.sectionHead}><h2 id="f360-reports-heading">{t("f360.reports.heading", "Inspection reports")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            {reports.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("f360.report.number", "Inspection")}</th><th scope="col">{t("common.date", "Date")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.report.version", "Latest immutable version")}</th><th scope="col">{t("f360.report.compliance", "Approved compliance")}</th><th scope="col" /></tr></thead><tbody>{reports.map(report => {
              const latest = latestSubmission(report); const compliance = report.status === "approved" && latest ? calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) : null;
              return <tr key={report.id}><td><bdi>{text(report.inspection_no ?? report.id.slice(0, 8))}</bdi></td><td className="numeric">{dt(report.submitted_at ?? report.started_at)}</td><td><span className="badge badge-info">{label(report.status)}</span></td><td>{latest ? `v${latest.version_number}` : t("f360.report.notSubmitted", "not submitted")}</td><td className="numeric">{compliance?.rate == null ? "—" : `${compliance.rate}%`}</td><td><a className="ax-link" href={`/reports/inspection/${report.id}`}>{t("f360.report.open", "Open report")}</a></td></tr>;
            })}</tbody></table></div> : <p className="t-caption">{t("f360.reports.empty", "No inspection reports are available for the selected plant.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-violations-heading">
            <div className={styles.sectionHead}><h2 id="f360-violations-heading">{t("f360.violations.heading", "Approved inspection violations & corrective actions")}</h2>{sourceBadge(reportsResult.error, approvedEnforcement, !!factoryId)}</div>
            {approvedEnforcement.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("f360.violation.title", "Violation")}</th><th scope="col">{t("f360.violation.severity", "Severity")}</th><th scope="col">{t("f360.violation.corrective", "Corrective action")}</th><th scope="col">{t("f360.violation.grace", "Grace period")}</th><th scope="col">{t("f360.violation.origin", "Originating approved report")}</th></tr></thead><tbody>{approvedEnforcement.map(({ report, violation }) => <tr key={violation.id}><td><bdi>{text(violation.violation_codes?.code)}</bdi> · {text(violation.violation_codes?.title)}</td><td>{label(violation.violation_codes?.level)}</td><td>{text(violation.violation_codes?.corrective_action)}</td><td className="numeric">{violation.violation_codes?.grace_period_days == null ? "—" : `${violation.violation_codes.grace_period_days} ${t("common.days", "days")}`}</td><td><a className="ax-link" href={`/reports/inspection/${report.id}`}>{text(report.inspection_no ?? report.id.slice(0, 8))}</a>{(report.action_forms ?? []).length ? <div className="t-caption">{report.action_forms.map(action => `${label(action.status)} · ${action.owner_name} · ${dt(action.due_at)}`).join("; ")}</div> : null}</td></tr>)}</tbody></table></div> : <p className="t-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.violations.empty", "No violations from approved inspection reports are visible in your scope.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-industrial-heading">
            <div className={styles.sectionHead}><h2 id="f360-industrial-heading">{t("f360.industrial.heading", "Industrial information")}</h2>{sourceBadge(linesResult.error, lines, !!licenseId)}</div>
            {lines.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("f360.hsCode", "HS / activity code")}</th><th scope="col">{t("f360.quantity", "Quantity / capacity")}</th><th scope="col">{t("f360.production", "Real / maximum production")}</th><th scope="col">{t("f360.pricePrimary", "Price / primary")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{lines.map(row => <tr key={row.id}><td>{label(row.item_type)}</td><td>{showLineName(row)}</td><td className="numeric"><bdi>{text(row.hs_code ?? row.activity_code)}</bdi>{row.hs_code_type ? ` · ${row.hs_code_type}` : ""}</td><td className="numeric">{text(row.quantity)} / {text(row.capacity)} {text(row.unit_code)}</td><td className="numeric">{text(row.real_production)} / {text(row.maximum_production)}</td><td className="numeric">{text(row.price)} · {row.is_primary == null ? "—" : row.is_primary ? t("common.yes", "Yes") : t("common.no", "No")}</td><td>{text(row.source_system)} · v{row.version_number} · {dt(row.effective_at)}</td></tr>)}</tbody></table></div> : <p className="t-caption">{linesResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.industrial.empty", "No source-backed products, spare parts, machines, production lines or raw materials are available.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-government-heading">
            <div className={styles.sectionHead}><h2 id="f360-government-heading">{t("f360.government.heading", "Government records")}</h2>{sourceBadge(governmentResult.error, government, !!licenseId)}</div>
            {government.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{government.map(row => <tr key={row.id}><td>{text(row.title ?? row.record_type)}</td><td className="numeric"><bdi>{row.external_record_id}</bdi></td><td>{label(row.status)}</td><td className="numeric">{dt(row.valid_from)} → {dt(row.valid_to)}</td><td>{row.source_system} · v{row.version_number}</td></tr>)}</tbody></table></div> : <p className="t-caption">{governmentResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.government.empty", "Government-domain records are unavailable until a governed source contract supplies them.")}</p>}
          </section>

          <section className={`panel ${styles.panel}`} aria-labelledby="f360-docs-heading">
            <div className={styles.sectionHead}><h2 id="f360-docs-heading">{t("f360.documents.heading", "Documents & factory media")}</h2>{permissions["view_factory_documents"] ? sourceBadge(docsResult.error || mediaResult.error, [...docs, ...media], !!factoryId) : <span className="badge">{t("f360.restricted", "restricted")}</span>}</div>
            {!permissions["view_factory_documents"] ? <p className="t-caption">{t("f360.documents.restricted", "Document metadata requires Factory Documents permission.")}</p> : <>
              {docs.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.category", "Category")}</th><th scope="col">{t("common.title", "Title")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th><th scope="col" /></tr></thead><tbody>{docs.map(doc => <tr key={doc.id}><td>{label(doc.business_category ?? doc.doc_type)}</td><td>{doc.title}</td><td className="numeric"><bdi>{text(doc.reference_no)}</bdi></td><td className="numeric">{dt(doc.valid_from)} → {dt(doc.valid_to)}</td><td>{text(doc.source_system)} · {text(doc.source_status)}</td><td>{permissions["download_factory_documents"] && downloadUrls[doc.id] ? <a className="ax-link" href={downloadUrls[doc.id]} download>{t("common.download", "Download")}</a> : <span className="t-caption">{permissions["download_factory_documents"] ? t("f360.download.unavailable", "file unavailable") : t("f360.download.restricted", "download restricted")}</span>}</td></tr>)}</tbody></table></div> : <p className="t-caption">{t("f360.documents.empty", "No source-backed document metadata is available.")}</p>}
              {officialMedia.some(asset => mediaUrls[asset.id]) && <><h3>{t("f360.media.official", "Official factory gallery")}</h3><div className={styles.mediaGrid}>{officialMedia.filter(asset => mediaUrls[asset.id]).map(asset => <figure key={asset.id}><img src={mediaUrls[asset.id]} alt={asset.title ?? t("f360.media.alt", "Official factory image")} /><figcaption className="t-caption">{asset.title ?? label(asset.category)} · {asset.source_system}</figcaption></figure>)}</div></>}
              <p className="t-caption">{t("f360.media.boundary", "Only official factory/profile media appears here. Inspection evidence remains linked to its inspection report and is never merged into this gallery.")}</p>
              <h3>{t("f360.media.evidence", "Linked inspection evidence")}</h3>
              {linkedEvidence.length ? <ul>{linkedEvidence.map(asset => <li key={asset.id}>
                <span className="badge badge-info">{label(asset.category)}</span> {asset.title ?? text(asset.evidence_id)} · {dt(asset.captured_at)} {asset.inspection_id ? <a className="ax-link" href={`/reports/inspection/${asset.inspection_id}`}>{t("f360.media.origin", "origin report")}</a> : factoryId ? <a className="ax-link" href={`/factories/${factoryId}#timeline`}>{t("f360.media.origin", "origin context")}</a> : null} {asset.evidence_id ? <a className="ax-link" href={`/evidence-ocr?evidence=${asset.evidence_id}`}>{t("f360.media.ocr", "Contextual OCR")}</a> : null}
              </li>)}</ul> : <p className="t-caption">{t("f360.media.evidenceEmpty", "No linked inspection, arrival or violation evidence is visible in your scope.")}</p>}
            </>}
          </section>
        </main>

        <aside className={styles.right} aria-label={t("f360.context.heading", "Selected context and actions")}>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("f360.context.heading", "Selected context")}</h2>
            <p><strong>{t("f360.id.cr", "CR")}</strong><br /><bdi className="numeric">{cr.cr_number}</bdi></p>
            <p><strong>{t("f360.id.license", "License")}</strong><br /><bdi className="numeric">{text(selected?.license_number)}</bdi></p>
            <p><strong>{t("f360.plant", "Plant")}</strong><br /><bdi className="numeric">{text(selected?.plant_number)}</bdi></p>
          </section>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("f360.source.heading", "Source status & freshness")}</h2>
            <p>{sourceBadge(licenseError, selected, !!selected)}</p>
            <p className="t-caption">{t("f360.source.system", "Source system")} <strong>{text(selected?.source_system ?? cr.source_system)}</strong></p>
            <p className="t-caption">{t("f360.source.timestamp", "Recorded sync timestamp")} <bdi>{dt(selected?.source_synced_at ?? cr.source_synced_at)}</bdi></p>
            <p className="t-caption">{t("f360.source.noSla", "Freshness is shown as a source fact; no unapproved staleness threshold is inferred.")}</p>
          </section>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("f360.risk.heading", "Saved risk")}</h2>
            {!permissions["view_risk_details"] ? <p className="t-caption">{t("f360.risk.restricted", "Risk detail requires Factory Risk permission.")}</p> : <>
              <p><strong className="numeric" style={{ fontSize: "2rem" }}>{text(factory?.risk_score)}</strong> · {label(factory?.risk_band)}</p>
              <p className="t-caption">{t("f360.risk.version", "Model")} {text(factory?.risk_version)} · {dt(factory?.risk_calculated_at)}</p>
              {riskResult.error ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : <p className="t-caption">{riskHistory.length} {t("f360.risk.snapshots", "saved snapshots")}</p>}
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
          </section>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("f360.enforcement.heading", "Penalty lineage")}</h2>
            {penaltiesResult.error ? <p className="t-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : penalties.length ? <ul>{penalties.map(row => <li key={row.id}><bdi>{row.notice_number}</bdi> · {label(row.status)} · {dt(row.issued_at)}</li>)}</ul> : <p className="t-caption">{t("f360.enforcement.empty", "No penalty notices are visible in your scope.")}</p>}
          </section>
          <section className={`panel ${styles.panel}`}>
            <h2>{t("common.actions", "Actions")}</h2>
            <div className={styles.actions}>
              {factoryId && <a className="btn btn-secondary btn-touch" href={`/factories/${factoryId}?compat=legacy#location`}>{t("f360.actions.openMap", "Open map")}</a>}
              {permissions["create_inspection"] && factoryId && <a className="btn btn-primary btn-touch" href={`/planning/immediate?factory=${factoryId}&cr=${cr.id}&license=${selected?.id ?? ""}&returnTo=${encodeURIComponent(`/factories/cr/${cr.id}?license=${selected?.id ?? ""}`)}`}>{t("f360.actions.createInspection", "Create inspection")}</a>}
              {permissions["export_factory"] && <Factory360ExportButton label={t("f360.actions.exportPdf", "Print / Save permitted PDF")} />}
              {!permissions["create_inspection"] && !permissions["export_factory"] && <p className="t-caption">{t("f360.actions.restricted", "No create-inspection or export action is permitted for your role.")}</p>}
            </div>
          </section>
        </aside>
      </div>
    </Shell>
  );
}
