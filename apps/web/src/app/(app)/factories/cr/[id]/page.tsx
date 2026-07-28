import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { calculateApprovedCompliance } from "@/lib/factory360/compliance";
import { loadFactory360Dossier, resolveFactory360Permissions, latestSubmission } from "@/lib/factory360/dossier";
import Factory360ExportButton from "./Factory360ExportButton";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import { geminiProviderState } from "@/lib/providers/ai-gemini";
import styles from "./factory360.module.css";

const text = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);
type FactoryTimelineRow = {
  event_key: string;
  occurred_at: string;
  object_type: string;
  object_id: string;
  source: string;
  payload: Record<string, unknown> | null;
};
type VisitSummaryRow = {
  id: string;
  window_start: string;
  visit_type: string;
  planning_status: string;
  operational_state: string;
  planner_lat: number | null;
  planner_lng: number | null;
  visit_location_source: string | null;
};

// TASK-FACTORY-360-COMPLETE-010 · SCR-WEB-400 · MVP1-M07-001..020
// CR-centred, selected-license read model. The projection is loaded through the
// shared lib/factory360/dossier loader so the iPad field surface (SCR-IPAD)
// renders identical business data, calculations and permissions BY CONSTRUCTION.
export default async function Factory360ByCr({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string; visitStatus?: string; visitType?: string }>;
}) {
  const [{ id }, { license: requestedLicense, visitStatus, visitType }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);
  const aiProviderState = geminiProviderState();

  if (!permissions["view_factory_360"]) return (
    <Shell current="/factories" title={t("f360.title", "Factory 360")}>
      <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
        body={t("f360.permission.body", "You do not have access to this factory profile.")} />
    </Shell>
  );

  const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
  if (!dossier.found || !dossier.cr) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory 360 profile unavailable")}>
      <EmptyState glyph="∅" title={t("f360.notFound.desc", "Factory registration not found or not available to you.")}
        body={dossier.crError ? t("f360.err.neutral", "The Factory list is temporarily unavailable. Nothing was changed.") : undefined} />
    </Shell>
  );

  const {
    cr, crError, licenses, licenseError, selected, factory, factoryId, licenseId,
    address, lines, government, chemicalPermits, customsExemptions, chemicalPermitsError, customsExemptionsError,
    docs, media, officialMedia, linkedEvidence, reports, riskHistory, penalties,
    latestApprovedFactorySnapshot, snapshotOrigin, approvedTrend, currentCompliance, exportsProducts,
    approvedEnforcement, portfolioCounts, highestRiskLicense, downloadUrls, mediaUrls,
    addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult,
    penaltiesResult, portfolioReportsResult, snapshotsResult, canonical,
  } = dossier;

  const dt = (value: string | null | undefined) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const label = (value: string | null | undefined) => value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—";
  const bilingual = (english: string, arabic: string) => locale === "ar" ? arabic : english;
  const sourceStatus = (error: unknown, value: unknown, queried = true) => {
    if (error) return t("f360.source.degraded", "degraded");
    if (!queried) return t("f360.source.notAvailable", "Not Available");
    if (value == null || (Array.isArray(value) && value.length === 0)) return t("f360.source.empty", "available — no records");
    return t("f360.source.available", "available");
  };
  const sourceBadge = (error: unknown, value: unknown, queried = true) => <span className={`${styles.status} sq-lozenge ${error ? "sq-lozenge--warning" : queried ? "sq-lozenge--success" : ""}`}>{sourceStatus(error, value, queried)}</span>;
  const roleLozenge = (role: string) => role === "authoritative" ? "sq-lozenge--success" : role === "contract_unverified" ? "sq-lozenge--warning" : role === "conflicting" ? "sq-lozenge--critical" : role === "permission_restricted" || role === "unavailable" ? "" : "sq-lozenge--info";
  const discrepancyCounts = canonical.discrepancies.reduce<Record<string, number>>((acc, d) => { acc[d.state] = (acc[d.state] ?? 0) + 1; return acc; }, {});
  const showLineName = (row: { name_en: string | null; name_ar: string | null }) => locale === "ar" ? row.name_ar ?? row.name_en ?? "—" : row.name_en ?? row.name_ar ?? "—";
  const addressArabic = address
    ? [address.address_line_1, address.street_name_ar, address.city_ar, address.region_ar].filter(Boolean).join(" · ")
    : "";
  const addressEnglish = address
    ? [address.street_name_en, address.city_en, address.region_en].filter(Boolean).join(" · ")
    : "";
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
  // CR-426 / WA-M4-AC-005 — use the capability-bound database projection so
  // source sync, visits, immutable submissions, approvals, penalties and saved
  // risk events share one governed chronology. Failure degrades this section
  // without suppressing the rest of Factory 360.
  const [timelineResult, visitsResult] = factoryId
    ? await Promise.all([
      sb.rpc("factory_timeline" as never, { p_factory_id: factoryId } as never),
      sb.from("visits")
        .select("id, window_start, visit_type, planning_status, operational_state, planner_lat, planner_lng, visit_location_source")
        .eq("factory_id", factoryId)
        .order("window_start", { ascending: false })
        .limit(100),
    ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const visits = (visitsResult.data ?? []) as VisitSummaryRow[];
  const visitStatuses = [...new Set(visits.map(row => row.planning_status))].sort();
  const visitTypes = [...new Set(visits.map(row => row.visit_type))].sort();
  const filteredVisits = visits.filter(row =>
    (!visitStatus || row.planning_status === visitStatus)
    && (!visitType || row.visit_type === visitType));
  const timelineEvents = ((timelineResult.data ?? []) as FactoryTimelineRow[]).map(event => {
    const payload = event.payload ?? {};
    const title = t(`f360.timeline.${event.event_key}`, event.event_key.replaceAll("_", " "));
    const detail = Object.entries(payload)
      .filter(([, value]) => value != null && typeof value !== "object")
      .map(([key, value]) => `${label(key)}: ${text(value as string | number)}`)
      .join(" · ") || `${label(event.object_type)} · ${label(event.source)}`;
    const href = event.object_type === "inspections" ? `/reports/inspection/${event.object_id}` : undefined;
    return { key: `${event.event_key}-${event.object_id}`, at: event.occurred_at, title, detail, href };
  });

  return (
    <Shell current="/factories" title={locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number}
      context={<><span className="sq-lozenge sq-lozenge--info">Factory 360</span><span className="sq-freshness">{t("f360.meta.source", "source")} {text(selected?.source_system ?? cr.source_system)} · {t("f360.meta.synced", "recorded")} {dt(selected?.source_synced_at ?? cr.source_synced_at)}</span></>}>
      <h1 className="sr-only">{t("f360.title", "Factory 360")} — {locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number}</h1>
      {licenseError ? <div className="sq-banner sq-banner--warning" role="status"><div>{t("f360.licenses.degraded", "Industrial-license data is temporarily degraded; CR identity remains available.")}</div></div> : null}
      <div className={styles.workspace} data-factory360-layout="cr-license-dossier">
        <aside className={styles.left} aria-label={t("f360.licenses.heading", "Industrial licenses and plants")}>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("f360.licenses.heading", "Licenses & plants")}</h2>
            <p className="sq-caption"><bdi>{cr.cr_number}</bdi> · {licenses.length} {t("f360.licenses.count", "licenses")}</p>
            {licenses.length ? <ul className={styles.licenseList}>{licenses.map(row => <li key={row.id}>
              <a className={styles.licenseLink} href={`/factories/cr/${cr.id}?license=${row.id}`} aria-current={row.id === selected?.id ? "page" : undefined}>
                <strong className={styles.licenseName}>{text(row.factories?.name)}</strong>
                <dl className={styles.licenseFacts}>
                  <div><dt>{t("f360.id.license", "License")}</dt><dd><bdi>{row.license_number}</bdi></dd></div>
                  <div><dt>{t("f360.plant", "Plant")}</dt><dd><bdi>{text(row.plant_number)}</bdi></dd></div>
                  <div><dt>{t("f360.license.type", "Type")}</dt><dd>{label(row.license_type)}</dd></div>
                  <div><dt>{t("f360.license.stage", "Stage")}</dt><dd>{label(row.stage)}</dd></div>
                  <div><dt>{t("common.status", "Status")}</dt><dd>{label(row.status)}</dd></div>
                  <div><dt>{t("f360.risk.level", "Risk level")}</dt><dd>{label(row.factories?.risk_band)}</dd></div>
                </dl>
              </a>
            </li>)}</ul> : <p className="sq-caption">{t("f360.licenses.empty", "No industrial license is mapped to this CR.")}</p>}
          </section>
        </aside>

        <div className={styles.main}>
          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-cr-heading">
            <div className={styles.sectionHead}><h2 id="f360-cr-heading">{t("f360.cr.heading", "Commercial registration & legal identity")}</h2>{sourceBadge(crError, cr)}</div>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.number", "CR number")}</dt><dd className="sq-numeric"><bdi>{cr.cr_number}</bdi></dd></div>
              <div><dt>{t("f360.cr.unified", "Unified number")}</dt><dd className="sq-numeric"><bdi>{text(cr.unified_number)}</bdi></dd></div>
              <div><dt>{t("f360.cr.legalEn", "Legal name (English)")}</dt><dd lang="en" dir="ltr">{text(cr.legal_name_en ?? cr.legal_name)}</dd></div>
              <div><dt>{t("f360.cr.legalAr", "Legal name (Arabic)")}</dt><dd lang="ar" dir="rtl">{text(cr.legal_name_ar)}</dd></div>
              <div><dt>{t("common.status", "Status")}</dt><dd>{label(cr.status)}</dd></div>
              <div><dt>{t("f360.cr.dates", "Issued / expires")}</dt><dd className="sq-numeric">{dt(cr.issue_date)} → {dt(cr.expiry_date)}</dd></div>
              <div><dt>{t("f360.cr.owner", "Owner details")}</dt><dd>{text(cr.owner_details)}</dd></div>
            </dl>
            <h3>{t("f360.cr.portfolio", "All licenses")}</h3>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.totalLicenses", "Total licenses")}</dt><dd className="sq-numeric">{portfolioCounts.total}</dd></div>
              <div><dt>{t("f360.cr.licenseStates", "Active / expired / suspended")}</dt><dd className="sq-numeric">{portfolioCounts.active} / {portfolioCounts.expired} / {portfolioCounts.suspended}</dd></div>
              <div><dt>{t("f360.cr.highestRisk", "Highest-risk license")}</dt><dd>{highestRiskLicense ? <><bdi>{highestRiskLicense.license_number}</bdi> · {text(highestRiskLicense.factories?.risk_score)} · {label(highestRiskLicense.factories?.risk_band)}</> : t("f360.compliance.notAvailable", "Not Available")}</dd></div>
              <div><dt>{t("f360.cr.approvedInspections", "Approved inspections")}</dt><dd className="sq-numeric">{portfolioReportsResult.error ? t("f360.source.degraded", "degraded") : portfolioCounts.approvedInspections}</dd></div>
              <div><dt>{t("f360.cr.openViolations", "Open violations")}</dt><dd>{t("f360.cr.openViolationsUnavailable", "Not Available — runtime violations have no governed open/closed state")}</dd></div>
              <div><dt>{t("f360.cr.activePenalties", "Active penalties")}</dt><dd>{t("f360.cr.activePenaltiesUnavailable", "Not Available — current penalty statuses do not define Active/Expired/Cancelled")}</dd></div>
            </dl>
            <p className="sq-caption">{t("f360.cr.noAggregate", "All-licenses facts only. No CR-level risk score or compliance rate is calculated.")}</p>
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-license-heading">
            <div className={styles.sectionHead}><h2 id="f360-license-heading">{t("f360.license.heading", "Selected license, plant & address")}</h2>{sourceBadge(addressResult.error, address, !!selected)}</div>
            {selected && factory ? <dl className={styles.facts}>
              <div><dt>{t("f360.id.license", "Industrial license")}</dt><dd className="sq-numeric"><bdi>{selected.license_number}</bdi></dd></div>
              <div><dt>{t("f360.plant", "Plant number")}</dt><dd className="sq-numeric"><bdi>{text(selected.plant_number)}</bdi></dd></div>
              <div><dt>{t("f360.id.factory", "Factory")}</dt><dd>{factory.name} · <bdi>{factory.factory_code}</bdi></dd></div>
              <div><dt>{t("f360.id.licenseStatus", "Status / stage")}</dt><dd>{label(selected.status)} · {label(selected.stage)}</dd></div>
              <div><dt>{t("f360.id.licenseDates", "Issued / expires")}</dt><dd className="sq-numeric">{dt(selected.issue_date)} → {dt(selected.expiry_date)}</dd></div>
              <div><dt>{t("f360.id.licenseHolder", "License holder")}</dt><dd>{text(selected.holder_name)}</dd></div>
              <div><dt>{t("f360.location", "Address")}</dt><dd>{addressArabic || addressEnglish ? <>{addressArabic ? <span lang="ar" dir="rtl"><bdi>{addressArabic}</bdi></span> : null}{addressArabic && addressEnglish ? <br /> : null}{addressEnglish ? <span lang="en" dir="ltr"><bdi>{addressEnglish}</bdi></span> : null}</> : "—"}</dd></div>
              <div><dt>{t("f360.coordinates", "Coordinates")}</dt><dd className="sq-numeric"><bdi>{address ? `${text(address.latitude)}, ${text(address.longitude)}` : "—"}</bdi></dd></div>
              <div><dt>{t("f360.exportsProducts", "Exports products?")}</dt><dd>{exportsProducts == null ? t("f360.exportsProducts.unknown", "Unknown") : exportsProducts ? t("common.yes", "Yes") : t("common.no", "No")}</dd></div>
            </dl> : <p className="sq-caption">{t("f360.license.unavailable", "Select a mapped industrial license to load plant facts.")}</p>}
            <h3>{t("f360.visits.heading", bilingual("Visit summary", "ملخص الزيارات"))}</h3>
            <p className="sq-caption">{t("f360.visits.boundary", bilingual("Operational context only. Inspection answers, evidence, findings, reviewer comments and personal contact data are excluded.", "سياق تشغيلي فقط. تُستبعد إجابات التفتيش والأدلة والنتائج وتعليقات المراجع وبيانات الاتصال الشخصية."))}</p>
            {!visitsResult.error && visits.length ? <form method="get" className="sq-row">
              {selected?.id ? <input type="hidden" name="license" value={selected.id} /> : null}
              <label className="sq-field"><span className="sq-field__label">{t("f360.visits.filterStatus", bilingual("Planning status", "حالة التخطيط"))}</span>
                <select className="sq-select" name="visitStatus" defaultValue={visitStatus ?? ""}>
                  <option value="">{t("common.all", bilingual("All", "الكل"))}</option>
                  {visitStatuses.map(value => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
              <label className="sq-field"><span className="sq-field__label">{t("f360.visits.filterType", bilingual("Visit type", "نوع الزيارة"))}</span>
                <select className="sq-select" name="visitType" defaultValue={visitType ?? ""}>
                  <option value="">{t("common.all", bilingual("All", "الكل"))}</option>
                  {visitTypes.map(value => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
              <button className="sq-btn sq-btn--secondary" type="submit">{t("common.filter", bilingual("Filter", "تصفية"))}</button>
            </form> : null}
            {visitsResult.error
              ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p>
              : filteredVisits.length
                ? <div className="sq-tablewrap"><table className="sq-table">
                  <thead><tr><th scope="col">{t("f360.visits.reference", bilingual("Visit reference", "مرجع الزيارة"))}</th><th scope="col">{t("common.date", bilingual("Date", "التاريخ"))}</th><th scope="col">{t("common.type", bilingual("Type", "النوع"))}</th><th scope="col">{t("f360.visits.planningStatus", bilingual("Planning status", "حالة التخطيط"))}</th><th scope="col">{t("f360.visits.operationalStatus", bilingual("Operational status", "الحالة التشغيلية"))}</th><th scope="col">{t("f360.location.source", bilingual("Location source", "مصدر الموقع"))}</th><th scope="col">{t("f360.coordinates", bilingual("Coordinates", "الإحداثيات"))}</th></tr></thead>
                  <tbody>{filteredVisits.map(row => <tr key={row.id}>
                    <td className="sq-numeric"><bdi>{row.id.slice(0, 8)}</bdi></td>
                    <td className="sq-numeric">{dt(row.window_start)}</td>
                    <td>{label(row.visit_type)}</td>
                    <td>{label(row.planning_status)}</td>
                    <td>{label(row.operational_state)}</td>
                    <td>{label(row.visit_location_source)}</td>
                    <td className="sq-numeric"><bdi>{row.planner_lat == null || row.planner_lng == null ? "—" : `${row.planner_lat}, ${row.planner_lng}`}</bdi></td>
                  </tr>)}</tbody>
                </table></div>
                : <p className="sq-caption">{visits.length
                  ? t("f360.visits.filteredEmpty", bilingual("No visits match the selected filters.", "لا توجد زيارات تطابق عوامل التصفية المحددة."))
                  : t("f360.visits.empty", bilingual("No source-backed visits are available.", "لا تتوفر زيارات مدعومة بالمصدر."))}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-observed-heading">
            <div className={styles.sectionHead}><h2 id="f360-observed-heading">{t("f360.observed.heading", "Official vs latest approved observed snapshot")}</h2>{sourceBadge(snapshotsResult.error, latestApprovedFactorySnapshot, !!factoryId && !!licenseId)}</div>
            <p className="sq-caption">{t("f360.observed.rule", "The observed column is the immutable official hierarchy snapshot captured with a submission that later became an approved report. It does not overwrite current source truth.")}</p>
            {latestApprovedFactorySnapshot ? <>
              <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.field", "Field")}</th><th scope="col">{t("f360.observed.official", "Current official")}</th><th scope="col">{t("f360.observed.captured", "Observed at submission")}</th><th scope="col">{t("f360.observed.result", "Comparison")}</th></tr></thead><tbody>{observedComparison.map(([field, official, observed]) => {
                const officialText = text(official); const matches = officialText === observed;
                return <tr key={field}><th scope="row">{field}</th><td><bdi>{officialText}</bdi></td><td><bdi>{observed}</bdi></td><td><span className={`sq-lozenge ${matches ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{matches ? t("f360.observed.same", "unchanged") : t("f360.observed.changed", "changed or unavailable")}</span></td></tr>;
              })}</tbody></table></div>
              <p className="sq-caption">{t("f360.observed.capturedAt", "Captured")} {dt(latestApprovedFactorySnapshot.captured_at)} · SHA-256 <bdi>{latestApprovedFactorySnapshot.snapshot_sha256.slice(0, 12)}…</bdi>{snapshotOrigin ? <> · <a className="sq-link" href={`/reports/inspection/${snapshotOrigin.id}`}>{t("f360.observed.origin", "origin approved report")}</a></> : null}</p>
            </> : <p className="sq-caption">{snapshotsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.observed.empty", "No approved report has a governed factory snapshot for this selected license yet.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-compliance-heading">
            <div className={styles.sectionHead}><h2 id="f360-compliance-heading">{t("f360.compliance.heading", "Approved inspection compliance")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            <p className="sq-caption">{t("f360.compliance.rule", "Calculated only from the latest immutable submitted version of approved inspections and its frozen package definition. Returned or rejected inspections remain visible below but never affect this rate.")}</p>
            <p><strong className="sq-numeric" style={{ fontSize: "2rem" }}>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</strong> <span className="sq-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : t("f360.compliance.na", "No eligible approved scored answers")}</span></p>
            {approvedTrend.length > 1 && <div className={styles.trend} aria-label={t("f360.compliance.trend", "Approved compliance trend")}>{[...approvedTrend].reverse().map(({ report, compliance }) => <div className={styles.trendPoint} key={report.id} title={`${text(report.inspection_no)} · ${compliance.rate}%`}><span className={styles.trendBar} style={{ blockSize: `${Math.max(4, compliance.rate ?? 0)}px` }} /><span className="sq-caption sq-numeric">{compliance.rate}%</span></div>)}</div>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-reports-heading">
            <div className={styles.sectionHead}><h2 id="f360-reports-heading">{t("f360.reports.heading", "Inspection reports")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            {reports.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("f360.report.number", "Inspection")}</th><th scope="col">{t("common.date", "Date")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.report.version", "Latest immutable version")}</th><th scope="col">{t("f360.report.compliance", "Approved compliance")}</th><th scope="col" /></tr></thead><tbody>{reports.map(report => {
              const latest = latestSubmission(report); const compliance = report.status === "approved" && latest ? calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) : null;
              return <tr key={report.id}><td><bdi>{text(report.inspection_no ?? report.id.slice(0, 8))}</bdi></td><td className="sq-numeric">{dt(report.submitted_at ?? report.started_at)}</td><td><span className="sq-lozenge sq-lozenge--info">{label(report.status)}</span></td><td>{latest ? `v${latest.version_number}` : t("f360.report.notSubmitted", "not submitted")}</td><td className="sq-numeric">{compliance?.rate == null ? "—" : `${compliance.rate}%`}</td><td><a className="sq-link" href={`/reports/inspection/${report.id}`}>{t("f360.report.open", "Open report")}</a></td></tr>;
            })}</tbody></table></div> : <p className="sq-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.reports.empty", "No inspection reports are available for the selected plant.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-violations-heading">
            <div className={styles.sectionHead}><h2 id="f360-violations-heading">{t("f360.violations.heading", "Approved inspection violations & corrective actions")}</h2>{sourceBadge(reportsResult.error, approvedEnforcement, !!factoryId)}</div>
            {approvedEnforcement.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("f360.violation.title", "Violation")}</th><th scope="col">{t("f360.violation.severity", "Severity")}</th><th scope="col">{t("f360.violation.corrective", "Corrective action")}</th><th scope="col">{t("f360.violation.grace", "Grace period")}</th><th scope="col">{t("f360.violation.origin", "Originating approved report")}</th></tr></thead><tbody>{approvedEnforcement.map(({ report, violation }) => <tr key={violation.id}><td><bdi>{text(violation.violation_codes?.code)}</bdi> · {text(violation.violation_codes?.title)}</td><td>{label(violation.violation_codes?.level)}</td><td>{text(violation.violation_codes?.corrective_action)}</td><td className="sq-numeric">{violation.violation_codes?.grace_period_days == null ? "—" : `${violation.violation_codes.grace_period_days} ${t("common.days", "days")}`}</td><td><a className="sq-link" href={`/reports/inspection/${report.id}`}>{text(report.inspection_no ?? report.id.slice(0, 8))}</a>{(report.action_forms ?? []).length ? <div className="sq-caption">{report.action_forms.map(action => `${label(action.status)} · ${action.owner_name} · ${dt(action.due_at)}`).join("; ")}</div> : null}</td></tr>)}</tbody></table></div> : <p className="sq-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.violations.empty", "No violations from approved inspection reports are visible in your scope.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-industrial-heading">
            <div className={styles.sectionHead}><h2 id="f360-industrial-heading">{t("f360.industrial.heading", "Industrial information")}</h2>{sourceBadge(linesResult.error, lines, !!licenseId)}</div>
            {lines.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("f360.hsCode", "HS / activity code")}</th><th scope="col">{t("f360.quantity", "Quantity / capacity")}</th><th scope="col">{t("f360.production", "Real / maximum production")}</th><th scope="col">{t("f360.pricePrimary", "Price / primary")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{lines.map(row => <tr key={row.id}><td>{label(row.item_type)}</td><td>{showLineName(row)}</td><td className="sq-numeric"><bdi>{text(row.hs_code ?? row.activity_code)}</bdi>{row.hs_code_type ? ` · ${row.hs_code_type}` : ""}</td><td className="sq-numeric">{text(row.quantity)} / {text(row.capacity)} {text(row.unit_code)}</td><td className="sq-numeric">{text(row.real_production)} / {text(row.maximum_production)}</td><td className="sq-numeric">{text(row.price)} · {row.is_primary == null ? "—" : row.is_primary ? t("common.yes", "Yes") : t("common.no", "No")}</td><td>{text(row.source_system)} · v{row.version_number} · {dt(row.effective_at)}</td></tr>)}</tbody></table></div> : <p className="sq-caption">{linesResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.industrial.empty", "No source-backed products, spare parts, machines, production lines or raw materials are available.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-government-heading">
            <div className={styles.sectionHead}><h2 id="f360-government-heading">{t("f360.government.heading", "Government records")}</h2>{sourceBadge(governmentResult.error, government, !!licenseId)}</div>
            {government.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{government.map(row => <tr key={row.id}><td>{text(row.title ?? row.record_type)}</td><td className="sq-numeric"><bdi>{row.external_record_id}</bdi></td><td>{label(row.status)}</td><td className="sq-numeric">{dt(row.valid_from)} → {dt(row.valid_to)}</td><td>{row.source_system} · v{row.version_number}</td></tr>)}</tbody></table></div> : <p className="sq-caption">{governmentResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.government.empty", "Government-domain records are unavailable until a governed source contract supplies them.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-chemical-customs-heading">
            <div className={styles.sectionHead}><h2 id="f360-chemical-customs-heading">{t("f360.chemicalCustoms.heading", "Chemical permits & customs exemptions")}</h2>{sourceBadge(!!chemicalPermitsError || !!customsExemptionsError, [...chemicalPermits, ...customsExemptions], !!selected?.plant_number)}</div>
            {!selected?.plant_number ? <p className="sq-caption">{t("f360.chemicalCustoms.noPlant", "No plant number on the selected license — chemical permits and customs exemptions are looked up by plant number.")}</p> : <>
              <h3>{t("f360.chemicalPermits.heading", "Chemical permits")}</h3>
              {chemicalPermitsError ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p>
                : chemicalPermits.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("f360.chemicalPermits.approval", "Approval number")}</th><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th></tr></thead><tbody>{chemicalPermits.map(permit => <tr key={permit.externalId}><td className="sq-numeric"><bdi>{text(permit.approvalNumber)}</bdi></td><td>{label(permit.type?.label)}</td><td><span className="sq-lozenge sq-lozenge--info">{label(permit.status?.label)}</span></td><td className="sq-numeric">{dt(permit.startsAt)} → {dt(permit.endsAt)}</td></tr>)}</tbody></table></div>
                : <p className="sq-caption">{t("f360.chemicalPermits.empty", "No chemical permits found for this plant.")}</p>}
              <h3>{t("f360.customsExemptions.heading", "Customs exemptions")}</h3>
              {customsExemptionsError ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p>
                : customsExemptions.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("f360.customsExemptions.decree", "Decree number")}</th><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th></tr></thead><tbody>{customsExemptions.map(exemption => <tr key={exemption.externalId}><td className="sq-numeric"><bdi>{text(exemption.decreeNumber)}</bdi></td><td>{label(exemption.type?.label)}</td><td><span className="sq-lozenge sq-lozenge--info">{label(exemption.status?.label)}</span></td><td className="sq-numeric">{dt(exemption.startsAt)} → {dt(exemption.endsAt)}</td></tr>)}</tbody></table></div>
                : <p className="sq-caption">{t("f360.customsExemptions.empty", "No customs exemptions found for this plant.")}</p>}
            </>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-docs-heading">
            <div className={styles.sectionHead}><h2 id="f360-docs-heading">{t("f360.documents.heading", "Documents & factory media")}</h2>{permissions["view_factory_documents"] ? sourceBadge(docsResult.error || mediaResult.error, [...docs, ...media], !!factoryId) : <span className="sq-lozenge">{t("f360.restricted", "restricted")}</span>}</div>
            {!permissions["view_factory_documents"] ? <p className="sq-caption">{t("f360.documents.restricted", "Document metadata requires Factory Documents permission.")}</p> : <>
              {docs.length ? <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.category", "Category")}</th><th scope="col">{t("common.title", "Title")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th><th scope="col" /></tr></thead><tbody>{docs.map(doc => <tr key={doc.id}><td>{label(doc.business_category ?? doc.doc_type)}</td><td>{doc.title}</td><td className="sq-numeric"><bdi>{text(doc.reference_no)}</bdi></td><td className="sq-numeric">{dt(doc.valid_from)} → {dt(doc.valid_to)}</td><td>{text(doc.source_system)} · {text(doc.source_status)}</td><td>{permissions["download_factory_documents"] && downloadUrls[doc.id] ? <a className="sq-link" href={downloadUrls[doc.id]} download>{t("common.download", "Download")}</a> : <span className="sq-caption">{permissions["download_factory_documents"] ? t("f360.download.unavailable", "file unavailable") : t("f360.download.restricted", "download restricted")}</span>}</td></tr>)}</tbody></table></div> : <p className="sq-caption">{docsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.documents.empty", "No source-backed document metadata is available.")}</p>}
              {officialMedia.some(asset => mediaUrls[asset.id]) && <><h3>{t("f360.media.official", "Official factory gallery")}</h3><div className={styles.mediaGrid}>{officialMedia.filter(asset => mediaUrls[asset.id]).map(asset => <figure key={asset.id}><img src={mediaUrls[asset.id]} alt={asset.title ?? t("f360.media.alt", "Official factory image")} /><figcaption className="sq-caption">{asset.title ?? label(asset.category)} · {asset.source_system}</figcaption></figure>)}</div></>}
              <p className="sq-caption">{t("f360.media.boundary", "Only official factory/profile media appears here. Inspection evidence remains linked to its inspection report and is never merged into this gallery.")}</p>

              <h3>{t("f360.media.evidence", "Linked inspection evidence")}</h3>
              {linkedEvidence.length ? <ul>{linkedEvidence.map(asset => <li key={asset.id}>
                <span className="sq-lozenge sq-lozenge--info">{label(asset.category)}</span> {asset.title ?? text(asset.evidence_id)} · {dt(asset.captured_at)} {asset.inspection_id ? <a className="sq-link" href={`/reports/inspection/${asset.inspection_id}`}>{t("f360.media.origin", "origin report")}</a> : factoryId ? <a className="sq-link" href={`/factories/${factoryId}#timeline`}>{t("f360.media.origin", "origin context")}</a> : null} {asset.evidence_id ? <a className="sq-link" href={`/evidence-ocr?evidence=${asset.evidence_id}`}>{t("f360.media.ocr", "Contextual OCR")}</a> : null}
              </li>)}</ul> : <p className="sq-caption">{t("f360.media.evidenceEmpty", "No linked inspection, arrival or violation evidence is visible in your scope.")}</p>}
            </>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-timeline-heading">
            <div className={styles.sectionHead}>
              <h2 id="f360-timeline-heading">{t("f360.timeline.heading", "Business-event timeline")}</h2>
              {sourceBadge(timelineResult.error, timelineEvents, !!factoryId)}
            </div>
            <p className="sq-caption">{t("f360.timeline.rule", "Source-backed sync, visit, submission, approval, penalty and risk events.")}</p>
            {timelineResult.error ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : timelineEvents.length ? <ol className={styles.timeline}>{timelineEvents.map(event => (
              <li key={event.key}>
                <time className="sq-numeric" dateTime={event.at}>{dt(event.at)}</time>
                <span className={styles.timelineDot} aria-hidden="true" />
                <div>
                  <strong>{event.title}</strong>
                  <p className="sq-caption">{event.href ? <a className="sq-link" href={event.href}>{event.detail}</a> : event.detail}</p>
                </div>
              </li>
            ))}</ol> : <p className="sq-caption">{t("f360.timeline.empty", "No business events are available for the selected license.")}</p>}
          </section>

          <section className={`sq-surface ${styles.panel}`} aria-labelledby="f360-xpc-heading">
            <div className={styles.sectionHead}><h2 id="f360-xpc-heading">{t("f360.xpc.heading", "Source & cross-provider reconciliation")}</h2><span className={`sq-lozenge ${discrepancyCounts["conflicting"] ? "sq-lozenge--critical" : discrepancyCounts["contract_unverified"] ? "sq-lozenge--warning" : "sq-lozenge--success"}`}>{discrepancyCounts["conflicting"] ? t("f360.xpc.conflicts", "conflicts") : discrepancyCounts["contract_unverified"] ? t("f360.xpc.unverified", "unverified master") : t("f360.xpc.reconciled", "reconciled")}</span></div>
            <p className="sq-caption">{t("f360.xpc.rule", "Facts are resolved once, server-side. Industry Shared master data is contract-unverified (fail-closed); Inspection API values are contextual; approved report facts are authoritative. Conflicts are surfaced, never overwritten.")}</p>
            <dl className={styles.facts}>
              <div><dt>{t("f360.xpc.cr", "Commercial registration")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.commercialRegistration.role)}`}>{label(canonical.commercialRegistration.role)}</span> <span className="sq-caption">{canonical.commercialRegistration.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.license", "Industrial license")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.industrialLicense.role)}`}>{label(canonical.industrialLicense.role)}</span> <span className="sq-caption">{canonical.industrialLicense.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.plant", "Plant")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.plant.role)}`}>{label(canonical.plant.role)}</span> <span className="sq-caption">{canonical.plant.source.provider}</span></dd></div>
              <div><dt>{t("f360.xpc.activities", "Activities / products / materials")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.products.role)}`}>{label(canonical.products.role)}</span> <span className="sq-caption">{canonical.products.value?.length ?? 0}/{canonical.materials.value?.length ?? 0}/{canonical.machines.value?.length ?? 0}</span></dd></div>
              <div><dt>{t("f360.xpc.workforce", "Workforce / contacts / delegations")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.workforce.role)}`}>{label(canonical.workforce.role)}</span> <span className="sq-caption">INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED</span></dd></div>
              <div><dt>{t("f360.xpc.package", "Approved package / submission version")}</dt><dd><span className={`sq-lozenge ${roleLozenge(canonical.approvedPackageVersion.role)}`}>{label(canonical.approvedPackageVersion.role)}</span> <span className="sq-caption sq-numeric">{text(canonical.approvedPackageVersion.value)} · {text(canonical.immutableSubmissionVersion.value)}</span></dd></div>
            </dl>
            <p className="sq-caption">{t("f360.xpc.discrepancies", "Reconciliation")}: {Object.entries(discrepancyCounts).map(([state, n]) => `${label(state)} ${n}`).join(" · ") || t("f360.xpc.none", "no reconcilable facts")}</p>
          </section>
        </div>

        <aside className={styles.right} aria-label={t("f360.context.heading", "Selected context and actions")}>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("f360.context.heading", "Selected context")}</h2>
            <p><strong>{t("f360.id.cr", "CR")}</strong><br /><bdi className="sq-numeric">{cr.cr_number}</bdi></p>
            <p><strong>{t("f360.id.license", "License")}</strong><br /><bdi className="sq-numeric">{text(selected?.license_number)}</bdi></p>
            <p><strong>{t("f360.plant", "Plant")}</strong><br /><bdi className="sq-numeric">{text(selected?.plant_number)}</bdi></p>
          </section>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("f360.source.heading", "Source status & freshness")}</h2>
            <p>{sourceBadge(licenseError, selected, !!selected)}</p>
            <p className="sq-caption">{t("f360.source.system", "Source system")} <strong>{text(selected?.source_system ?? cr.source_system)}</strong></p>
            <p className="sq-caption">{t("f360.source.timestamp", "Recorded sync timestamp")} <bdi>{dt(selected?.source_synced_at ?? cr.source_synced_at)}</bdi></p>
            <p className="sq-caption">{t("f360.source.noSla", "Freshness is shown as a source fact; no unapproved staleness threshold is inferred.")}</p>
          </section>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("f360.risk.heading", "Saved risk")}</h2>
            {!permissions["view_risk_details"] ? <p className="sq-caption">{t("f360.risk.restricted", "Risk detail requires Factory Risk permission.")}</p> : <>
              <p><strong className="sq-numeric" style={{ fontSize: "2rem" }}>{text(factory?.risk_score)}</strong> · {label(factory?.risk_band)}</p>
              <p className="sq-caption">{t("f360.risk.version", "Model")} {text(factory?.risk_version)} · {dt(factory?.risk_calculated_at)}</p>
              {riskResult.error ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : <p className="sq-caption">{riskHistory.length} {t("f360.risk.snapshots", "saved snapshots")}</p>}
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
                providerState={aiProviderState}
              /> : null}
            </>}
          </section>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("f360.enforcement.heading", "Penalty history")}</h2>
            {penaltiesResult.error ? <p className="sq-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : penalties.length ? <ul>{penalties.map(row => <li key={row.id}><bdi>{row.notice_number}</bdi> · {label(row.status)} · {dt(row.issued_at)}{row.inspection_id ? <> · <a className="sq-link" href={`/reports/inspection/${row.inspection_id}`}>{t("f360.enforcement.origin", "origin report")}</a></> : null}</li>)}</ul> : <p className="sq-caption">{t("f360.enforcement.empty", "No penalty notices are visible in your scope.")}</p>}
          </section>
          <section className={`sq-surface ${styles.panel}`}>
            <h2>{t("common.actions", "Actions")}</h2>
            <div className={styles.actions}>
              {factoryId && <a className="sq-btn sq-btn--secondary" href={`/factories/${factoryId}?compat=legacy#location`}>{t("f360.actions.openMap", "Open map")}</a>}
              {permissions["create_inspection"] && factoryId && <a className="sq-btn sq-btn--primary" href={`/planning/immediate?factory=${factoryId}&cr=${cr.id}&license=${selected?.id ?? ""}&returnTo=${encodeURIComponent(`/factories/cr/${cr.id}?license=${selected?.id ?? ""}`)}`}>{t("f360.actions.createInspection", "Create inspection")}</a>}
              {permissions["create_inspection"] && factoryId && <a className="sq-btn sq-btn--secondary" href={`/planning/single?cr=${encodeURIComponent(cr.cr_number)}&license=${encodeURIComponent(selected?.license_number ?? "")}&plant=${encodeURIComponent(selected?.plant_number ?? "")}&factory=${factoryId}&source=factory360`}>{t("f360.actions.planSingle", "Plan single visit")}</a>}
              {permissions["export_factory"] && <Factory360ExportButton label={t("f360.actions.exportPdf", "Print / Save permitted PDF")} />}
              {!permissions["create_inspection"] && !permissions["export_factory"] && <p className="sq-caption">{t("f360.actions.restricted", "No create-inspection or export action is permitted for your role.")}</p>}
              {permissions["create_inspection"] && <p className="sq-caption" role="status">{t("f360.actions.submissionBlocked", "Inspection submission remains unavailable while is unresolved.")}</p>}
            </div>
          </section>
        </aside>
      </div>
    </Shell>
  );
}
