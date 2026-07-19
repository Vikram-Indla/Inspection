import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { calculateApprovedCompliance, type FrozenPackageDefinition, type ComplianceSnapshot } from "@/lib/factory360/compliance";
import { FACTORY_360_PERMISSIONS, hasFactory360Permission } from "@/lib/factory360/permissions";
import Factory360ExportButton from "./Factory360ExportButton";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import styles from "./factory360.module.css";

export const dynamic = "force-dynamic";

type Factory = {
  id: string; factory_code: string; name: string; region: string | null; city: string | null;
  activity_class: string | null; official_lat: number | null; official_lng: number | null;
  risk_score: number | null; risk_band: string | null; risk_version: string | null;
  risk_calculated_at: string | null; source: string | null; source_synced_at: string | null;
};
type License = {
  id: string; commercial_registration_id: string; factory_id: string; license_number: string;
  plant_number: string | null; license_type: string | null; status: string | null; stage: string | null;
  issue_date: string | null; expiry_date: string | null; holder_name: string | null;
  investment_type: string | null; investment_size: number | null; source_system: string | null;
  source_synced_at: string | null; factories: Factory | null;
};
type Submission = { id: string; version_number: number; snapshot: ComplianceSnapshot; submitted_at: string };
type FactorySnapshot = { id: string; submission_version_id: string; snapshot: Record<string, unknown>; snapshot_sha256: string; captured_at: string };
type Report = {
  id: string; inspection_no: string | null; status: string; started_at: string | null; submitted_at: string | null;
  package_versions: { version_label: string; definition: FrozenPackageDefinition; packages: { code: string; title: string } | null } | null;
  submission_versions: Submission[]; visits: { factory_id: string; visit_type: string; window_start: string } | null;
  violations: { id: string; mapping_version: string; violation_codes: { code: string; title: string; level: string; corrective_action: string | null; grace_period_days: number | null } | null }[];
  action_forms: { id: string; status: string; owner_name: string; due_at: string | null }[];
};

const text = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);
const latestSubmission = (report: Report) => [...(report.submission_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];

// TASK-FACTORY-360-COMPLETE-010 · SCR-WEB-400 · MVP1-M07-001..020
// CR-centred, selected-license read model. Each provider/table is queried
// independently so one unavailable domain never erases healthy dossier facts.
export default async function Factory360ByCr({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string }>;
}) {
  const [{ id }, { license: requestedLicense }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissionResults = await Promise.all(FACTORY_360_PERMISSIONS.map(permission => hasFactory360Permission(sb, permission)));
  const permissions = Object.fromEntries(FACTORY_360_PERMISSIONS.map((permission, index) => [permission, permissionResults[index].allowed])) as Record<typeof FACTORY_360_PERMISSIONS[number], boolean>;

  if (!permissions["view_factory_360"]) return (
    <Shell current="/factories" title={t("f360.title", "Factory 360")}>
      <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
        body={t("f360.permission.body", "This CR dossier is outside your authorized permissions.")} />
    </Shell>
  );

  const [{ data: cr, error: crError }, { data: licenseRows, error: licenseError }] = await Promise.all([
    sb.from("commercial_registrations").select("id, cr_number, unified_number, legal_name, legal_name_en, legal_name_ar, status, issue_date, expiry_date, owner_details, source_system, source_synced_at").eq("id", id).maybeSingle(),
    sb.from("industrial_licenses").select(`id, commercial_registration_id, factory_id, license_number, plant_number,
      license_type, status, stage, issue_date, expiry_date, holder_name, investment_type, investment_size,
      source_system, source_synced_at,
      factories(id, factory_code, name, region, city, activity_class, official_lat, official_lng,
        risk_score, risk_band, risk_version, risk_calculated_at, source, source_synced_at)`)
      .eq("commercial_registration_id", id).order("license_number"),
  ]);
  if (!cr) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory 360 dossier unavailable")}>
      <EmptyState glyph="∅" title={t("f360.notFound.desc", "CR not in your scope or does not exist")}
        body={crError ? t("f360.err.neutral", "The registry is temporarily unavailable. Nothing was changed.") : undefined} />
    </Shell>
  );
  const licenses = (licenseRows ?? []) as unknown as License[];
  const selected = licenses.find(row => row.id === requestedLicense) ?? licenses[0] ?? null;
  const factory = selected?.factories ?? null;
  const factoryId = factory?.id;
  const licenseId = selected?.id;
  const portfolioFactoryIds = licenses.map(row => row.factory_id);

  const emptyResult = { data: [] as unknown[], error: null };
  const [addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult, penaltiesResult, portfolioReportsResult, snapshotsResult] = await Promise.all([
    licenseId ? sb.from("plant_addresses").select("id, address_line_1, landmark, district_en, district_ar, building_number, postal_code, street_name_en, street_name_ar, city_en, city_ar, region_en, region_ar, latitude, longitude, source_system, effective_at").eq("industrial_license_id", licenseId).eq("is_current", true).maybeSingle() : Promise.resolve({ data: null, error: null }),
    licenseId ? sb.from("plant_production_line_items").select("id, item_type, version_number, name_en, name_ar, hs_code, hs_code_type, activity_code, activity_name_en, activity_name_ar, quantity, capacity, real_production, maximum_production, price, is_primary, unit_code, unit_name_en, unit_name_ar, is_spare_part, is_machine, is_end_product, is_raw_material, attributes, source_system, effective_at").eq("industrial_license_id", licenseId).is("superseded_at", null).order("item_type") : Promise.resolve(emptyResult),
    licenseId ? sb.from("factory_government_records").select("id, record_type, external_record_id, version_number, status, title, valid_from, valid_to, source_system, recorded_at").eq("industrial_license_id", licenseId).order("recorded_at", { ascending: false }) : Promise.resolve(emptyResult),
    factoryId && permissions["view_factory_documents"] ? sb.from("factory_documents").select("id, industrial_license_id, business_category, doc_type, title, reference_no, valid_from, valid_to, storage_path, source_system, source_status, created_at").eq("factory_id", factoryId).order("created_at", { ascending: false }) : Promise.resolve(emptyResult),
    factoryId && permissions["view_factory_documents"] ? sb.from("factory_media_assets").select("id, industrial_license_id, category, evidence_id, inspection_id, violation_id, storage_path, title, mime_type, source_system, captured_at").eq("factory_id", factoryId).in("category", ["official_factory_image", "factory_profile_image", "inspection_evidence", "arrival_evidence", "violation_evidence"]).order("created_at", { ascending: false }) : Promise.resolve(emptyResult),
    factoryId ? sb.from("inspections").select(`id, inspection_no, status, started_at, submitted_at,
      visits!inner(factory_id, visit_type, window_start),
      package_versions(version_label, definition, packages(code, title)),
      violations(id, mapping_version, violation_codes(code, title, level, corrective_action, grace_period_days)),
      action_forms(id, status, owner_name, due_at),
      submission_versions!inner(id, version_number, snapshot, submitted_at)`)
      .eq("visits.factory_id", factoryId).order("submitted_at", { ascending: false }) : Promise.resolve(emptyResult),
    factoryId && permissions["view_risk_details"] ? sb.from("factory_risk_snapshots").select("id, score, band, model_version, drivers, calculated_at").eq("factory_id", factoryId).order("calculated_at", { ascending: false }).limit(20) : Promise.resolve(emptyResult),
    factoryId ? sb.from("penalty_notices").select("id, inspection_id, violation_id, notice_number, status, issued_at").eq("factory_id", factoryId).order("issued_at", { ascending: false }).limit(50) : Promise.resolve(emptyResult),
    portfolioFactoryIds.length ? sb.from("inspections").select("id, status, visits!inner(factory_id), violations(id)").in("visits.factory_id", portfolioFactoryIds).eq("status", "approved") : Promise.resolve(emptyResult),
    factoryId && licenseId ? sb.from("inspection_factory_snapshots").select("id, submission_version_id, snapshot, snapshot_sha256, captured_at").eq("factory_id", factoryId).eq("industrial_license_id", licenseId).order("captured_at", { ascending: false }).limit(50) : Promise.resolve(emptyResult),
  ]);

  const address = addressResult.data as null | Record<string, string | number | null>;
  const lines = (linesResult.data ?? []) as unknown as { id: string; item_type: string; version_number: number; name_en: string | null; name_ar: string | null; hs_code: string | null; hs_code_type: string | null; activity_code: string | null; activity_name_en: string | null; activity_name_ar: string | null; quantity: number | null; capacity: number | null; real_production: number | null; maximum_production: number | null; price: number | null; is_primary: boolean | null; unit_code: string | null; unit_name_en: string | null; unit_name_ar: string | null; source_system: string | null; effective_at: string }[];
  const government = ((governmentResult.data ?? []) as unknown as { id: string; record_type: string; external_record_id: string; version_number: number; status: string; title: string | null; valid_from: string | null; valid_to: string | null; source_system: string; recorded_at: string }[])
    .filter(row => !["pending", "returned", "rejected", "draft"].includes(row.status));
  const docs = ((docsResult.data ?? []) as unknown as { id: string; industrial_license_id: string | null; business_category: string | null; doc_type: string; title: string; reference_no: string | null; valid_from: string | null; valid_to: string | null; storage_path: string | null; source_system: string | null; source_status: string | null; created_at: string }[]).filter(row => !row.industrial_license_id || row.industrial_license_id === licenseId);
  const media = ((mediaResult.data ?? []) as unknown as { id: string; industrial_license_id: string | null; category: string; evidence_id: string | null; inspection_id: string | null; violation_id: string | null; storage_path: string | null; title: string | null; mime_type: string | null; source_system: string; captured_at: string | null }[]).filter(row => !row.industrial_license_id || row.industrial_license_id === licenseId);
  const officialMedia = media.filter(asset => ["official_factory_image", "factory_profile_image"].includes(asset.category));
  const linkedEvidence = media.filter(asset => ["inspection_evidence", "arrival_evidence", "violation_evidence"].includes(asset.category));
  // !inner plus this defensive check ensure this section is a report register,
  // never a visit/inspection-work queue. Submitted returned/rejected reports
  // stay visible; an inspection without an immutable version does not.
  const reports = ((reportsResult.data ?? []) as unknown as Report[]).filter(report => !!latestSubmission(report))
    .sort((a, b) => String(b.submitted_at ?? b.started_at ?? "").localeCompare(String(a.submitted_at ?? a.started_at ?? "")));
  const riskHistory = (riskResult.data ?? []) as unknown as { id: string; score: number; band: string; model_version: string; drivers: unknown; calculated_at: string }[];
  const penalties = (penaltiesResult.data ?? []) as unknown as { id: string; inspection_id: string | null; notice_number: string; status: string; issued_at: string }[];
  const snapshots = (snapshotsResult.data ?? []) as unknown as FactorySnapshot[];
  const approvedTrend = reports.filter(report => report.status === "approved" && latestSubmission(report)).map(report => {
    const latest = latestSubmission(report)!;
    return { report, latest, compliance: calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) };
  }).filter(row => row.compliance.status === "available");
  const currentCompliance = approvedTrend[0]?.compliance ?? { status: "not_available" as const, passed: 0, answered: 0, rate: null };
  const approvedSubmissionOrigins = new Map(reports.filter(report => report.status === "approved").flatMap(report =>
    (report.submission_versions ?? []).map(submission => [submission.id, report] as const),
  ));
  const latestApprovedFactorySnapshot = snapshots.find(row => approvedSubmissionOrigins.has(row.submission_version_id)) ?? null;
  const snapshotOrigin = latestApprovedFactorySnapshot ? approvedSubmissionOrigins.get(latestApprovedFactorySnapshot.submission_version_id) : null;
  const approvedEnforcement = reports.filter(report => report.status === "approved").flatMap(report =>
    (report.violations ?? []).map(violation => ({ report, violation })),
  );
  const normalizedStatus = (value: string | null) => value?.trim().toLowerCase().replaceAll(" ", "_") ?? "";
  const portfolioCounts = {
    total: licenses.length,
    active: licenses.filter(row => normalizedStatus(row.status) === "active").length,
    expired: licenses.filter(row => normalizedStatus(row.status) === "expired").length,
    suspended: licenses.filter(row => normalizedStatus(row.status) === "suspended").length,
    approvedInspections: (portfolioReportsResult.data ?? []).length,
  };
  const highestRiskLicense = [...licenses].filter(row => row.factories?.risk_score != null)
    .sort((a, b) => Number(b.factories?.risk_score) - Number(a.factories?.risk_score))[0] ?? null;

  const downloadUrls: Record<string, string> = {};
  if (permissions["download_factory_documents"]) await Promise.all(docs.filter(doc => !!doc.storage_path).map(async doc => {
    const { data } = await sb.storage.from("evidence").createSignedUrl(doc.storage_path!, 600);
    if (data?.signedUrl) downloadUrls[doc.id] = data.signedUrl;
  }));
  const mediaUrls: Record<string, string> = {};
  if (permissions["view_factory_documents"]) await Promise.all(officialMedia.filter(asset => !!asset.storage_path).map(async asset => {
    const { data } = await sb.storage.from("evidence").createSignedUrl(asset.storage_path!, 600);
    if (data?.signedUrl) mediaUrls[asset.id] = data.signedUrl;
  }));

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
      context={<><span className="ax-lozenge ax-lozenge--info">SCR-WEB-400 · Factory 360</span><span className="ax-freshness">{t("f360.meta.source", "source")} {text(selected?.source_system ?? cr.source_system)} · {t("f360.meta.synced", "recorded")} {dt(selected?.source_synced_at ?? cr.source_synced_at)}</span></>}>
      {licenseError && <div className="ax-banner ax-banner--warning" role="status"><div>{t("f360.licenses.degraded", "Industrial-license data is temporarily degraded; CR identity remains available.")}</div></div>}
      <div className={styles.workspace} data-factory360-layout="cr-license-dossier">
        <aside className={styles.left} aria-label={t("f360.licenses.heading", "Industrial licenses and plants")}>
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("f360.licenses.heading", "Licenses & plants")}</h2>
            <p className="ax-caption"><bdi>{cr.cr_number}</bdi> · {licenses.length} {t("f360.licenses.count", "licenses")}</p>
            {licenses.length ? <ul className={styles.licenseList}>{licenses.map(row => <li key={row.id}>
              <a className={styles.licenseLink} href={`/factories/cr/${cr.id}?license=${row.id}`} aria-current={row.id === selected?.id ? "page" : undefined}>
                <strong><bdi>{row.license_number}</bdi></strong><br />
                <span className="ax-caption">{t("f360.plant", "Plant")} <bdi>{text(row.plant_number)}</bdi> · {label(row.status)}</span>
              </a>
            </li>)}</ul> : <p className="ax-caption">{t("f360.licenses.empty", "No industrial license is mapped to this CR.")}</p>}
          </section>
        </aside>

        <main className={styles.main}>
          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-cr-heading">
            <div className={styles.sectionHead}><h2 id="f360-cr-heading">{t("f360.cr.heading", "Commercial registration & legal identity")}</h2>{sourceBadge(crError, cr)}</div>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.number", "CR number")}</dt><dd className="ax-numeric"><bdi>{cr.cr_number}</bdi></dd></div>
              <div><dt>{t("f360.cr.unified", "Unified number")}</dt><dd className="ax-numeric"><bdi>{text(cr.unified_number)}</bdi></dd></div>
              <div><dt>{t("f360.cr.legalEn", "Legal name (English)")}</dt><dd lang="en" dir="ltr">{text(cr.legal_name_en ?? cr.legal_name)}</dd></div>
              <div><dt>{t("f360.cr.legalAr", "Legal name (Arabic)")}</dt><dd lang="ar" dir="rtl">{text(cr.legal_name_ar)}</dd></div>
              <div><dt>{t("common.status", "Status")}</dt><dd>{label(cr.status)}</dd></div>
              <div><dt>{t("f360.cr.dates", "Issued / expires")}</dt><dd className="ax-numeric">{dt(cr.issue_date)} → {dt(cr.expiry_date)}</dd></div>
              <div><dt>{t("f360.cr.owner", "Owner details")}</dt><dd>{text(cr.owner_details)}</dd></div>
            </dl>
            <h3>{t("f360.cr.portfolio", "License portfolio")}</h3>
            <dl className={styles.facts}>
              <div><dt>{t("f360.cr.totalLicenses", "Total licenses")}</dt><dd className="ax-numeric">{portfolioCounts.total}</dd></div>
              <div><dt>{t("f360.cr.licenseStates", "Active / expired / suspended")}</dt><dd className="ax-numeric">{portfolioCounts.active} / {portfolioCounts.expired} / {portfolioCounts.suspended}</dd></div>
              <div><dt>{t("f360.cr.highestRisk", "Highest-risk license")}</dt><dd>{highestRiskLicense ? <><bdi>{highestRiskLicense.license_number}</bdi> · {text(highestRiskLicense.factories?.risk_score)} · {label(highestRiskLicense.factories?.risk_band)}</> : t("f360.compliance.notAvailable", "Not Available")}</dd></div>
              <div><dt>{t("f360.cr.approvedInspections", "Approved inspections")}</dt><dd className="ax-numeric">{portfolioReportsResult.error ? t("f360.source.degraded", "degraded") : portfolioCounts.approvedInspections}</dd></div>
              <div><dt>{t("f360.cr.openViolations", "Open violations")}</dt><dd>{t("f360.cr.openViolationsUnavailable", "Not Available — runtime violations have no governed open/closed state")}</dd></div>
              <div><dt>{t("f360.cr.activePenalties", "Active penalties")}</dt><dd>{t("f360.cr.activePenaltiesUnavailable", "Not Available — current penalty statuses do not define Active/Expired/Cancelled")}</dd></div>
            </dl>
            <p className="ax-caption">{t("f360.cr.noAggregate", "Portfolio facts only. No CR-level risk score or compliance rate is calculated.")}</p>
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-license-heading">
            <div className={styles.sectionHead}><h2 id="f360-license-heading">{t("f360.license.heading", "Selected license, plant & address")}</h2>{sourceBadge(addressResult.error, address, !!selected)}</div>
            {selected && factory ? <dl className={styles.facts}>
              <div><dt>{t("f360.id.license", "Industrial license")}</dt><dd className="ax-numeric"><bdi>{selected.license_number}</bdi></dd></div>
              <div><dt>{t("f360.plant", "Plant number")}</dt><dd className="ax-numeric"><bdi>{text(selected.plant_number)}</bdi></dd></div>
              <div><dt>{t("f360.id.factory", "Factory")}</dt><dd>{factory.name} · <bdi>{factory.factory_code}</bdi></dd></div>
              <div><dt>{t("f360.id.licenseStatus", "Status / stage")}</dt><dd>{label(selected.status)} · {label(selected.stage)}</dd></div>
              <div><dt>{t("f360.id.licenseDates", "Issued / expires")}</dt><dd className="ax-numeric">{dt(selected.issue_date)} → {dt(selected.expiry_date)}</dd></div>
              <div><dt>{t("f360.id.licenseHolder", "License holder")}</dt><dd>{text(selected.holder_name)}</dd></div>
              <div><dt>{t("f360.location", "Address")}</dt><dd>{address ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en, locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en].filter(Boolean).join(" · ") || "—" : "—"}</dd></div>
              <div><dt>{t("f360.coordinates", "Coordinates")}</dt><dd className="ax-numeric"><bdi>{address ? `${text(address.latitude)}, ${text(address.longitude)}` : "—"}</bdi></dd></div>
            </dl> : <p className="ax-caption">{t("f360.license.unavailable", "Select a mapped industrial license to load plant facts.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-observed-heading">
            <div className={styles.sectionHead}><h2 id="f360-observed-heading">{t("f360.observed.heading", "Official vs latest approved observed snapshot")}</h2>{sourceBadge(snapshotsResult.error, latestApprovedFactorySnapshot, !!factoryId && !!licenseId)}</div>
            <p className="ax-caption">{t("f360.observed.rule", "The observed column is the immutable official hierarchy snapshot captured with a submission that later became an approved report. It does not overwrite current source truth.")}</p>
            {latestApprovedFactorySnapshot ? <>
              <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.field", "Field")}</th><th scope="col">{t("f360.observed.official", "Current official")}</th><th scope="col">{t("f360.observed.captured", "Observed at submission")}</th><th scope="col">{t("f360.observed.result", "Comparison")}</th></tr></thead><tbody>{observedComparison.map(([field, official, observed]) => {
                const officialText = text(official); const matches = officialText === observed;
                return <tr key={field}><th scope="row">{field}</th><td><bdi>{officialText}</bdi></td><td><bdi>{observed}</bdi></td><td><span className={`ax-lozenge ${matches ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{matches ? t("f360.observed.same", "unchanged") : t("f360.observed.changed", "changed or unavailable")}</span></td></tr>;
              })}</tbody></table></div>
              <p className="ax-caption">{t("f360.observed.capturedAt", "Captured")} {dt(latestApprovedFactorySnapshot.captured_at)} · SHA-256 <bdi>{latestApprovedFactorySnapshot.snapshot_sha256.slice(0, 12)}…</bdi>{snapshotOrigin ? <> · <a className="ax-link" href={`/reports/inspection/${snapshotOrigin.id}`}>{t("f360.observed.origin", "origin approved report")}</a></> : null}</p>
            </> : <p className="ax-caption">{snapshotsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.observed.empty", "No approved report has a governed factory snapshot for this selected license yet.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-compliance-heading">
            <div className={styles.sectionHead}><h2 id="f360-compliance-heading">{t("f360.compliance.heading", "Approved inspection compliance")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            <p className="ax-caption">{t("f360.compliance.rule", "Calculated only from the latest immutable submitted version of approved inspections and its frozen package definition. Returned or rejected inspections remain visible below but never affect this rate.")}</p>
            <p><strong className="ax-numeric" style={{ fontSize: "2rem" }}>{currentCompliance.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</strong> <span className="ax-caption">{currentCompliance.status === "available" ? `${currentCompliance.passed}/${currentCompliance.answered}` : t("f360.compliance.na", "No eligible approved scored answers")}</span></p>
            {approvedTrend.length > 1 && <div className={styles.trend} aria-label={t("f360.compliance.trend", "Approved compliance trend")}>{[...approvedTrend].reverse().map(({ report, compliance }) => <div className={styles.trendPoint} key={report.id} title={`${text(report.inspection_no)} · ${compliance.rate}%`}><span className={styles.trendBar} style={{ blockSize: `${Math.max(4, compliance.rate ?? 0)}px` }} /><span className="ax-caption ax-numeric">{compliance.rate}%</span></div>)}</div>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-reports-heading">
            <div className={styles.sectionHead}><h2 id="f360-reports-heading">{t("f360.reports.heading", "Inspection reports")}</h2>{sourceBadge(reportsResult.error, reports, !!factoryId)}</div>
            {reports.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("f360.report.number", "Inspection")}</th><th scope="col">{t("common.date", "Date")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.report.version", "Latest immutable version")}</th><th scope="col">{t("f360.report.compliance", "Approved compliance")}</th><th scope="col" /></tr></thead><tbody>{reports.map(report => {
              const latest = latestSubmission(report); const compliance = report.status === "approved" && latest ? calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) : null;
              return <tr key={report.id}><td><bdi>{text(report.inspection_no ?? report.id.slice(0, 8))}</bdi></td><td className="ax-numeric">{dt(report.submitted_at ?? report.started_at)}</td><td><span className="ax-lozenge ax-lozenge--info">{label(report.status)}</span></td><td>{latest ? `v${latest.version_number}` : t("f360.report.notSubmitted", "not submitted")}</td><td className="ax-numeric">{compliance?.rate == null ? "—" : `${compliance.rate}%`}</td><td><a className="ax-link" href={`/reports/inspection/${report.id}`}>{t("f360.report.open", "Open report")}</a></td></tr>;
            })}</tbody></table></div> : <p className="ax-caption">{t("f360.reports.empty", "No inspection reports are available for the selected plant.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-violations-heading">
            <div className={styles.sectionHead}><h2 id="f360-violations-heading">{t("f360.violations.heading", "Approved inspection violations & corrective actions")}</h2>{sourceBadge(reportsResult.error, approvedEnforcement, !!factoryId)}</div>
            {approvedEnforcement.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("f360.violation.title", "Violation")}</th><th scope="col">{t("f360.violation.severity", "Severity")}</th><th scope="col">{t("f360.violation.corrective", "Corrective action")}</th><th scope="col">{t("f360.violation.grace", "Grace period")}</th><th scope="col">{t("f360.violation.origin", "Originating approved report")}</th></tr></thead><tbody>{approvedEnforcement.map(({ report, violation }) => <tr key={violation.id}><td><bdi>{text(violation.violation_codes?.code)}</bdi> · {text(violation.violation_codes?.title)}</td><td>{label(violation.violation_codes?.level)}</td><td>{text(violation.violation_codes?.corrective_action)}</td><td className="ax-numeric">{violation.violation_codes?.grace_period_days == null ? "—" : `${violation.violation_codes.grace_period_days} ${t("common.days", "days")}`}</td><td><a className="ax-link" href={`/reports/inspection/${report.id}`}>{text(report.inspection_no ?? report.id.slice(0, 8))}</a>{(report.action_forms ?? []).length ? <div className="ax-caption">{report.action_forms.map(action => `${label(action.status)} · ${action.owner_name} · ${dt(action.due_at)}`).join("; ")}</div> : null}</td></tr>)}</tbody></table></div> : <p className="ax-caption">{reportsResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.violations.empty", "No violations from approved inspection reports are visible in your scope.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-industrial-heading">
            <div className={styles.sectionHead}><h2 id="f360-industrial-heading">{t("f360.industrial.heading", "Industrial information")}</h2>{sourceBadge(linesResult.error, lines, !!licenseId)}</div>
            {lines.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("f360.hsCode", "HS / activity code")}</th><th scope="col">{t("f360.quantity", "Quantity / capacity")}</th><th scope="col">{t("f360.production", "Real / maximum production")}</th><th scope="col">{t("f360.pricePrimary", "Price / primary")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{lines.map(row => <tr key={row.id}><td>{label(row.item_type)}</td><td>{showLineName(row)}</td><td className="ax-numeric"><bdi>{text(row.hs_code ?? row.activity_code)}</bdi>{row.hs_code_type ? ` · ${row.hs_code_type}` : ""}</td><td className="ax-numeric">{text(row.quantity)} / {text(row.capacity)} {text(row.unit_code)}</td><td className="ax-numeric">{text(row.real_production)} / {text(row.maximum_production)}</td><td className="ax-numeric">{text(row.price)} · {row.is_primary == null ? "—" : row.is_primary ? t("common.yes", "Yes") : t("common.no", "No")}</td><td>{text(row.source_system)} · v{row.version_number} · {dt(row.effective_at)}</td></tr>)}</tbody></table></div> : <p className="ax-caption">{linesResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.industrial.empty", "No source-backed products, spare parts, machines, production lines or raw materials are available.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-government-heading">
            <div className={styles.sectionHead}><h2 id="f360-government-heading">{t("f360.government.heading", "Government records")}</h2>{sourceBadge(governmentResult.error, government, !!licenseId)}</div>
            {government.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th></tr></thead><tbody>{government.map(row => <tr key={row.id}><td>{text(row.title ?? row.record_type)}</td><td className="ax-numeric"><bdi>{row.external_record_id}</bdi></td><td>{label(row.status)}</td><td className="ax-numeric">{dt(row.valid_from)} → {dt(row.valid_to)}</td><td>{row.source_system} · v{row.version_number}</td></tr>)}</tbody></table></div> : <p className="ax-caption">{governmentResult.error ? t("f360.section.degraded", "This source section is degraded; other sections remain available.") : t("f360.government.empty", "Government-domain records are unavailable until a governed source contract supplies them.")}</p>}
          </section>

          <section className={`ax-surface ${styles.panel}`} aria-labelledby="f360-docs-heading">
            <div className={styles.sectionHead}><h2 id="f360-docs-heading">{t("f360.documents.heading", "Documents & factory media")}</h2>{permissions["view_factory_documents"] ? sourceBadge(docsResult.error || mediaResult.error, [...docs, ...media], !!factoryId) : <span className="ax-lozenge">{t("f360.restricted", "restricted")}</span>}</div>
            {!permissions["view_factory_documents"] ? <p className="ax-caption">{t("f360.documents.restricted", "Document metadata requires Factory Documents permission.")}</p> : <>
              {docs.length ? <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.category", "Category")}</th><th scope="col">{t("common.title", "Title")}</th><th scope="col">{t("common.reference", "Reference")}</th><th scope="col">{t("f360.validity", "Validity")}</th><th scope="col">{t("f360.source", "Source")}</th><th scope="col" /></tr></thead><tbody>{docs.map(doc => <tr key={doc.id}><td>{label(doc.business_category ?? doc.doc_type)}</td><td>{doc.title}</td><td className="ax-numeric"><bdi>{text(doc.reference_no)}</bdi></td><td className="ax-numeric">{dt(doc.valid_from)} → {dt(doc.valid_to)}</td><td>{text(doc.source_system)} · {text(doc.source_status)}</td><td>{permissions["download_factory_documents"] && downloadUrls[doc.id] ? <a className="ax-link" href={downloadUrls[doc.id]} download>{t("common.download", "Download")}</a> : <span className="ax-caption">{permissions["download_factory_documents"] ? t("f360.download.unavailable", "file unavailable") : t("f360.download.restricted", "download restricted")}</span>}</td></tr>)}</tbody></table></div> : <p className="ax-caption">{t("f360.documents.empty", "No source-backed document metadata is available.")}</p>}
              {officialMedia.some(asset => mediaUrls[asset.id]) && <><h3>{t("f360.media.official", "Official factory gallery")}</h3><div className={styles.mediaGrid}>{officialMedia.filter(asset => mediaUrls[asset.id]).map(asset => <figure key={asset.id}><img src={mediaUrls[asset.id]} alt={asset.title ?? t("f360.media.alt", "Official factory image")} /><figcaption className="ax-caption">{asset.title ?? label(asset.category)} · {asset.source_system}</figcaption></figure>)}</div></>}
              <p className="ax-caption">{t("f360.media.boundary", "Only official factory/profile media appears here. Inspection evidence remains linked to its inspection report and is never merged into this gallery.")}</p>
              <h3>{t("f360.media.evidence", "Linked inspection evidence")}</h3>
              {linkedEvidence.length ? <ul>{linkedEvidence.map(asset => <li key={asset.id}>
                <span className="ax-lozenge ax-lozenge--info">{label(asset.category)}</span> {asset.title ?? text(asset.evidence_id)} · {dt(asset.captured_at)} {asset.inspection_id ? <a className="ax-link" href={`/reports/inspection/${asset.inspection_id}`}>{t("f360.media.origin", "origin report")}</a> : factoryId ? <a className="ax-link" href={`/factories/${factoryId}#timeline`}>{t("f360.media.origin", "origin context")}</a> : null} {asset.evidence_id ? <a className="ax-link" href={`/evidence-ocr?evidence=${asset.evidence_id}`}>{t("f360.media.ocr", "Contextual OCR")}</a> : null}
              </li>)}</ul> : <p className="ax-caption">{t("f360.media.evidenceEmpty", "No linked inspection, arrival or violation evidence is visible in your scope.")}</p>}
            </>}
          </section>
        </main>

        <aside className={styles.right} aria-label={t("f360.context.heading", "Selected context and actions")}>
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("f360.context.heading", "Selected context")}</h2>
            <p><strong>{t("f360.id.cr", "CR")}</strong><br /><bdi className="ax-numeric">{cr.cr_number}</bdi></p>
            <p><strong>{t("f360.id.license", "License")}</strong><br /><bdi className="ax-numeric">{text(selected?.license_number)}</bdi></p>
            <p><strong>{t("f360.plant", "Plant")}</strong><br /><bdi className="ax-numeric">{text(selected?.plant_number)}</bdi></p>
          </section>
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("f360.source.heading", "Source status & freshness")}</h2>
            <p>{sourceBadge(licenseError, selected, !!selected)}</p>
            <p className="ax-caption">{t("f360.source.system", "Source system")} <strong>{text(selected?.source_system ?? cr.source_system)}</strong></p>
            <p className="ax-caption">{t("f360.source.timestamp", "Recorded sync timestamp")} <bdi>{dt(selected?.source_synced_at ?? cr.source_synced_at)}</bdi></p>
            <p className="ax-caption">{t("f360.source.noSla", "Freshness is shown as a source fact; no unapproved staleness threshold is inferred.")}</p>
          </section>
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("f360.risk.heading", "Saved risk")}</h2>
            {!permissions["view_risk_details"] ? <p className="ax-caption">{t("f360.risk.restricted", "Risk detail requires Factory Risk permission.")}</p> : <>
              <p><strong className="ax-numeric" style={{ fontSize: "2rem" }}>{text(factory?.risk_score)}</strong> · {label(factory?.risk_band)}</p>
              <p className="ax-caption">{t("f360.risk.version", "Model")} {text(factory?.risk_version)} · {dt(factory?.risk_calculated_at)}</p>
              {riskResult.error ? <p className="ax-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : <p className="ax-caption">{riskHistory.length} {t("f360.risk.snapshots", "saved snapshots")}</p>}
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
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("f360.enforcement.heading", "Penalty lineage")}</h2>
            {penaltiesResult.error ? <p className="ax-caption">{t("f360.section.degraded", "This source section is degraded; other sections remain available.")}</p> : penalties.length ? <ul>{penalties.map(row => <li key={row.id}><bdi>{row.notice_number}</bdi> · {label(row.status)} · {dt(row.issued_at)}</li>)}</ul> : <p className="ax-caption">{t("f360.enforcement.empty", "No penalty notices are visible in your scope.")}</p>}
          </section>
          <section className={`ax-surface ${styles.panel}`}>
            <h2>{t("common.actions", "Actions")}</h2>
            <div className={styles.actions}>
              {factoryId && <a className="ax-btn ax-btn--secondary" href={`/factories/${factoryId}?compat=legacy#location`}>{t("f360.actions.openMap", "Open map")}</a>}
              {permissions["create_inspection"] && factoryId && <a className="ax-btn ax-btn--primary" href={`/planning/immediate?factory=${factoryId}&cr=${cr.id}&license=${selected?.id ?? ""}&returnTo=${encodeURIComponent(`/factories/cr/${cr.id}?license=${selected?.id ?? ""}`)}`}>{t("f360.actions.createInspection", "Create inspection")}</a>}
              {permissions["export_factory"] && <Factory360ExportButton label={t("f360.actions.exportPdf", "Print / Save permitted PDF")} />}
              {!permissions["create_inspection"] && !permissions["export_factory"] && <p className="ax-caption">{t("f360.actions.restricted", "No create-inspection or export action is permitted for your role.")}</p>}
            </div>
          </section>
        </aside>
      </div>
    </Shell>
  );
}
