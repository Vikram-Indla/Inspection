import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateApprovedCompliance, type FrozenPackageDefinition, type ComplianceSnapshot, type ComplianceResult } from "@/lib/factory360/compliance";
import { FACTORY_360_PERMISSIONS, hasFactory360Permission, type Factory360Permission } from "@/lib/factory360/permissions";

// TASK-FACTORY-360-IPAD-011 · F360IPAD-EXTRACT-016
// Shared, platform-neutral Factory 360 read model. Both the web CR dossier
// (SCR-WEB-400) and the iPad field surface (SCR-IPAD) render from the object
// this loader returns, so business data, calculations, permissions,
// identifiers and versions are identical BY CONSTRUCTION — parity is
// structural, not asserted. Layout/density/touch/offline/action-placement are
// the only permitted platform differences (FACTORY_360_PLATFORM_PARITY_LEDGER).
//
// Every provider/table is queried independently so one unavailable domain never
// erases healthy dossier facts (BR-012 partial-failure isolation).

export type Factory = {
  id: string; factory_code: string; name: string; region: string | null; city: string | null;
  activity_class: string | null; official_lat: number | null; official_lng: number | null;
  risk_score: number | null; risk_band: string | null; risk_version: string | null;
  risk_calculated_at: string | null; source: string | null; source_synced_at: string | null;
};
export type License = {
  id: string; commercial_registration_id: string; factory_id: string; license_number: string;
  plant_number: string | null; license_type: string | null; status: string | null; stage: string | null;
  issue_date: string | null; expiry_date: string | null; holder_name: string | null;
  investment_type: string | null; investment_size: number | null; source_system: string | null;
  source_synced_at: string | null; factories: Factory | null;
};
export type Submission = { id: string; version_number: number; snapshot: ComplianceSnapshot; submitted_at: string };
export type FactorySnapshot = { id: string; submission_version_id: string; snapshot: Record<string, unknown>; snapshot_sha256: string; captured_at: string };
export type Report = {
  id: string; inspection_no: string | null; status: string; started_at: string | null; submitted_at: string | null;
  package_versions: { version_label: string; definition: FrozenPackageDefinition; packages: { code: string; title: string } | null } | null;
  submission_versions: Submission[]; visits: { factory_id: string; visit_type: string; window_start: string } | null;
  violations: { id: string; mapping_version: string; violation_codes: { code: string; title: string; level: string; corrective_action: string | null; grace_period_days: number | null } | null }[];
  action_forms: { id: string; status: string; owner_name: string; due_at: string | null }[];
};
export type CommercialRegistration = {
  id: string; cr_number: string; unified_number: string | null; legal_name: string | null;
  legal_name_en: string | null; legal_name_ar: string | null; status: string | null;
  issue_date: string | null; expiry_date: string | null; owner_details: string | null;
  source_system: string | null; source_synced_at: string | null;
};
export type ProductionLine = {
  id: string; item_type: string; version_number: number; name_en: string | null; name_ar: string | null;
  hs_code: string | null; hs_code_type: string | null; activity_code: string | null;
  activity_name_en: string | null; activity_name_ar: string | null; quantity: number | null;
  capacity: number | null; real_production: number | null; maximum_production: number | null;
  price: number | null; is_primary: boolean | null; unit_code: string | null;
  unit_name_en: string | null; unit_name_ar: string | null; source_system: string | null; effective_at: string;
};
export type GovernmentRecord = { id: string; record_type: string; external_record_id: string; version_number: number; status: string; title: string | null; valid_from: string | null; valid_to: string | null; source_system: string; recorded_at: string };
export type FactoryDocument = { id: string; industrial_license_id: string | null; business_category: string | null; doc_type: string; title: string; reference_no: string | null; valid_from: string | null; valid_to: string | null; storage_path: string | null; source_system: string | null; source_status: string | null; created_at: string };
export type MediaAsset = { id: string; industrial_license_id: string | null; category: string; evidence_id: string | null; inspection_id: string | null; violation_id: string | null; storage_path: string | null; title: string | null; mime_type: string | null; source_system: string; captured_at: string | null };
export type RiskSnapshot = { id: string; score: number; band: string; model_version: string; drivers: unknown; calculated_at: string };
export type PenaltyNotice = { id: string; inspection_id: string | null; notice_number: string; status: string; issued_at: string };
export type ObservedRow = { key: string; official: string | number | null | undefined; observedKey: string };

type Result<T> = { data: T | null; error: unknown };

export type Factory360Permissions = Record<Factory360Permission, boolean>;

export type Factory360Dossier = {
  found: boolean;
  permissions: Factory360Permissions;
  cr: CommercialRegistration | null;
  crError: unknown;
  licenses: License[];
  licenseError: unknown;
  selected: License | null;
  factory: Factory | null;
  factoryId: string | undefined;
  licenseId: string | undefined;
  address: Record<string, string | number | null> | null;
  lines: ProductionLine[];
  government: GovernmentRecord[];
  docs: FactoryDocument[];
  media: MediaAsset[];
  officialMedia: MediaAsset[];
  linkedEvidence: MediaAsset[];
  reports: Report[];
  riskHistory: RiskSnapshot[];
  penalties: PenaltyNotice[];
  snapshots: FactorySnapshot[];
  latestApprovedFactorySnapshot: FactorySnapshot | null;
  snapshotOrigin: Report | null | undefined;
  approvedTrend: { report: Report; latest: Submission; compliance: ComplianceResult }[];
  currentCompliance: ComplianceResult;
  reportCompliance: Record<string, ComplianceResult | null>;
  approvedEnforcement: { report: Report; violation: Report["violations"][number] }[];
  portfolioCounts: { total: number; active: number; expired: number; suspended: number; approvedInspections: number };
  highestRiskLicense: License | null;
  downloadUrls: Record<string, string>;
  mediaUrls: Record<string, string>;
  observedComparison: ObservedRow[];
  // Raw provider results preserved so callers can render per-section degraded state.
  addressResult: Result<unknown>;
  linesResult: Result<unknown>;
  governmentResult: Result<unknown>;
  docsResult: Result<unknown>;
  mediaResult: Result<unknown>;
  reportsResult: Result<unknown>;
  riskResult: Result<unknown>;
  penaltiesResult: Result<unknown>;
  portfolioReportsResult: Result<unknown>;
  snapshotsResult: Result<unknown>;
};

const latestSubmission = (report: Report) => [...(report.submission_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
export { latestSubmission };

export async function resolveFactory360Permissions(sb: SupabaseClient): Promise<Factory360Permissions> {
  const permissionResults = await Promise.all(FACTORY_360_PERMISSIONS.map(permission => hasFactory360Permission(sb, permission)));
  return Object.fromEntries(FACTORY_360_PERMISSIONS.map((permission, index) => [permission, permissionResults[index].allowed])) as Factory360Permissions;
}

/**
 * Load the complete CR-centred, selected-license Factory 360 read model.
 * @param sb          RLS-scoped Supabase server client (never elevated).
 * @param id          commercial_registrations.id
 * @param requestedLicense industrial_licenses.id (defaults to first license)
 * @param permissions resolved Factory 360 permission map
 * @param withSignedUrls when false (e.g. offline snapshot generation), skips storage signing
 */
export async function loadFactory360Dossier(
  sb: SupabaseClient,
  id: string,
  requestedLicense: string | undefined,
  permissions: Factory360Permissions,
  opts: { withSignedUrls?: boolean } = {},
): Promise<Factory360Dossier> {
  const withSignedUrls = opts.withSignedUrls !== false;

  const [{ data: cr, error: crError }, { data: licenseRows, error: licenseError }] = await Promise.all([
    sb.from("commercial_registrations").select("id, cr_number, unified_number, legal_name, legal_name_en, legal_name_ar, status, issue_date, expiry_date, owner_details, source_system, source_synced_at").eq("id", id).maybeSingle(),
    sb.from("industrial_licenses").select(`id, commercial_registration_id, factory_id, license_number, plant_number,
      license_type, status, stage, issue_date, expiry_date, holder_name, investment_type, investment_size,
      source_system, source_synced_at,
      factories(id, factory_code, name, region, city, activity_class, official_lat, official_lng,
        risk_score, risk_band, risk_version, risk_calculated_at, source, source_synced_at)`)
      .eq("commercial_registration_id", id).order("license_number"),
  ]);

  const emptyPermissions = permissions;
  if (!cr) {
    return blankDossier(emptyPermissions, (cr ?? null) as CommercialRegistration | null, crError, licenseError);
  }

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
  const lines = (linesResult.data ?? []) as unknown as ProductionLine[];
  const government = ((governmentResult.data ?? []) as unknown as GovernmentRecord[])
    .filter(row => !["pending", "returned", "rejected", "draft"].includes(row.status));
  const docs = ((docsResult.data ?? []) as unknown as FactoryDocument[]).filter(row => !row.industrial_license_id || row.industrial_license_id === licenseId);
  const media = ((mediaResult.data ?? []) as unknown as MediaAsset[]).filter(row => !row.industrial_license_id || row.industrial_license_id === licenseId);
  const officialMedia = media.filter(asset => ["official_factory_image", "factory_profile_image"].includes(asset.category));
  const linkedEvidence = media.filter(asset => ["inspection_evidence", "arrival_evidence", "violation_evidence"].includes(asset.category));
  // !inner plus this defensive check ensure this section is a report register,
  // never a visit/inspection-work queue. Submitted returned/rejected reports
  // stay visible; an inspection without an immutable version does not.
  const reports = ((reportsResult.data ?? []) as unknown as Report[]).filter(report => !!latestSubmission(report))
    .sort((a, b) => String(b.submitted_at ?? b.started_at ?? "").localeCompare(String(a.submitted_at ?? a.started_at ?? "")));
  const riskHistory = (riskResult.data ?? []) as unknown as RiskSnapshot[];
  const penalties = (penaltiesResult.data ?? []) as unknown as PenaltyNotice[];
  const snapshots = (snapshotsResult.data ?? []) as unknown as FactorySnapshot[];
  const approvedTrend = reports.filter(report => report.status === "approved" && latestSubmission(report)).map(report => {
    const latest = latestSubmission(report)!;
    return { report, latest, compliance: calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) };
  }).filter(row => row.compliance.status === "available");
  const currentCompliance = approvedTrend[0]?.compliance ?? { status: "not_available" as const, passed: 0, answered: 0, rate: null };
  const reportCompliance: Record<string, ComplianceResult | null> = Object.fromEntries(reports.map(report => {
    const latest = latestSubmission(report);
    return [report.id, report.status === "approved" && latest ? calculateApprovedCompliance(latest.snapshot, report.package_versions?.definition) : null];
  }));
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
  const mediaUrls: Record<string, string> = {};
  if (withSignedUrls) {
    if (permissions["download_factory_documents"]) await Promise.all(docs.filter(doc => !!doc.storage_path).map(async doc => {
      const { data } = await sb.storage.from("evidence").createSignedUrl(doc.storage_path!, 600);
      if (data?.signedUrl) downloadUrls[doc.id] = data.signedUrl;
    }));
    if (permissions["view_factory_documents"]) await Promise.all(officialMedia.filter(asset => !!asset.storage_path).map(async asset => {
      const { data } = await sb.storage.from("evidence").createSignedUrl(asset.storage_path!, 600);
      if (data?.signedUrl) mediaUrls[asset.id] = data.signedUrl;
    }));
  }

  // Presentation-neutral comparison pairs; callers translate the field label
  // and map observedKey -> snapshot value with their own snapshotValue() helper.
  const observedComparison: ObservedRow[] = latestApprovedFactorySnapshot ? [
    { key: "cr", official: cr.cr_number, observedKey: "cr_number" },
    { key: "license", official: selected?.license_number, observedKey: "industrial_license_number" },
    { key: "plant", official: selected?.plant_number, observedKey: "plant_number" },
    { key: "factory", official: factory?.name, observedKey: "factory_name" },
    { key: "region", official: factory?.region, observedKey: "region" },
    { key: "city", official: factory?.city, observedKey: "city" },
    { key: "source", official: selected?.source_system ?? factory?.source, observedKey: "source_system" },
  ] : [];

  return {
    found: true, permissions, cr: cr as unknown as CommercialRegistration, crError, licenses, licenseError,
    selected, factory, factoryId, licenseId, address, lines, government, docs, media, officialMedia, linkedEvidence,
    reports, riskHistory, penalties, snapshots, latestApprovedFactorySnapshot, snapshotOrigin,
    approvedTrend, currentCompliance, reportCompliance, approvedEnforcement, portfolioCounts, highestRiskLicense,
    downloadUrls, mediaUrls, observedComparison,
    addressResult, linesResult, governmentResult, docsResult, mediaResult, reportsResult, riskResult, penaltiesResult, portfolioReportsResult, snapshotsResult,
  };
}

function blankDossier(permissions: Factory360Permissions, cr: CommercialRegistration | null, crError: unknown, licenseError: unknown): Factory360Dossier {
  const empty: Result<unknown> = { data: null, error: null };
  return {
    found: false, permissions, cr, crError, licenses: [], licenseError, selected: null, factory: null,
    factoryId: undefined, licenseId: undefined, address: null, lines: [], government: [], docs: [], media: [],
    officialMedia: [], linkedEvidence: [], reports: [], riskHistory: [], penalties: [], snapshots: [],
    latestApprovedFactorySnapshot: null, snapshotOrigin: null, approvedTrend: [],
    currentCompliance: { status: "not_available", passed: 0, answered: 0, rate: null }, reportCompliance: {},
    approvedEnforcement: [], portfolioCounts: { total: 0, active: 0, expired: 0, suspended: 0, approvedInspections: 0 },
    highestRiskLicense: null, downloadUrls: {}, mediaUrls: {}, observedComparison: [],
    addressResult: empty, linesResult: empty, governmentResult: empty, docsResult: empty, mediaResult: empty,
    reportsResult: empty, riskResult: empty, penaltiesResult: empty, portfolioReportsResult: empty, snapshotsResult: empty,
  };
}
