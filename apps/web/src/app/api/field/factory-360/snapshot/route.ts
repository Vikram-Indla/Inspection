import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { loadFactory360Dossier, resolveFactory360Permissions } from "@/lib/factory360/dossier";
import { FACTORY_360_PERMISSIONS } from "@/lib/factory360/permissions";
import type { Factory360Snapshot } from "@/lib/factory360/offline-snapshot";

export const dynamic = "force-dynamic";

// v2 adds cross-provider canonical summary (F360IPAD-API-015). Backward
// compatible: pre-015 cached snapshots (v1) remain readable — the offline
// island does not gate on version.
const PROJECTION_VERSION = "f360-ipad-snapshot-2";

// TASK-FACTORY-360-IPAD-011 · F360IPAD-OFFLINE-005
// Permission-filtered, versioned Factory 360 snapshot projection for the iPad
// offline cache. RLS-scoped (uses the caller's supabaseServer client, never
// elevated). Signed storage URLs are intentionally NOT generated — offline
// documents/media require an explicit authorized online download. Sections the
// caller cannot see are omitted and recorded in sectionsOmitted, never faked.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const crId = url.searchParams.get("cr");
  const licenseId = url.searchParams.get("license");
  if (!crId) return NextResponse.json({ error: "cr required" }, { status: 400 });

  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);
  if (!permissions["view_factory_360"]) {
    return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  }

  const dossier = await loadFactory360Dossier(sb, crId, licenseId ?? undefined, permissions, { withSignedUrls: false });
  if (!dossier.found || !dossier.cr) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { cr, selected, factory, currentCompliance, portfolioCounts, lines, government, docs, canonical } = dossier;

  const sectionsOmitted: string[] = [];
  if (!permissions["view_risk_details"]) sectionsOmitted.push("risk");
  if (!permissions["view_factory_documents"]) sectionsOmitted.push("documents");

  // Provider-gap surface: government domain is served through a contract that is
  // not supplied for undocumented endpoints. Record the honest gap so the iPad
  // never presents an absent integration as live.
  const providerGaps: string[] = [];
  if ((dossier.governmentResult.error) || government.length === 0) providerGaps.push("SENAEI_API_CONTRACT_NOT_SUPPLIED:government_services_incentives");

  const summary: Factory360Snapshot["summary"] = {
    crNumber: cr.cr_number,
    unifiedNumber: cr.unified_number,
    companyName: cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar,
    licenseNumber: selected?.license_number ?? null,
    plantNumber: selected?.plant_number ?? null,
    licenseType: selected?.license_type ?? null,
    licenseStatus: selected?.status ?? null,
    licenseStage: selected?.stage ?? null,
    factoryName: factory?.name ?? null,
    region: factory?.region ?? null,
    city: factory?.city ?? null,
    latitude: factory?.official_lat ?? null,
    longitude: factory?.official_lng ?? null,
    riskScore: permissions["view_risk_details"] ? (factory?.risk_score ?? null) : null,
    riskBand: permissions["view_risk_details"] ? (factory?.risk_band ?? null) : null,
    riskModelVersion: permissions["view_risk_details"] ? (factory?.risk_version ?? null) : null,
    complianceRate: currentCompliance.rate,
    approvedInspections: portfolioCounts.approvedInspections,
    openViolationsNote: "Not Available — runtime violations have no governed open/closed state",
    industrialLineCount: lines.length,
    governmentRecordCount: government.length,
    documentCount: permissions["view_factory_documents"] ? docs.length : 0,
    sourceSystem: selected?.source_system ?? cr.source_system,
    sourceSyncedAt: selected?.source_synced_at ?? cr.source_synced_at,
    // Cross-provider summary (F360IPAD-API-015) — source-labelled, never raw payload.
    canonicalVersion: "f360-xpc-1",
    sourceFamilies: Array.from(new Set([
      canonical.commercialRegistration.source.provider,
      canonical.approvedPackageVersion.source.provider,
      canonical.workforce.source.provider,
    ])),
    activitySummary: {
      activities: canonical.activities.value?.length ?? 0,
      products: canonical.products.value?.length ?? 0,
      materials: canonical.materials.value?.length ?? 0,
      machines: canonical.machines.value?.length ?? 0,
      spareParts: canonical.spareParts.value?.length ?? 0,
    },
    discrepancyStates: canonical.discrepancies.reduce<Record<string, number>>((acc, d) => { acc[d.state] = (acc[d.state] ?? 0) + 1; return acc; }, {}),
    contractUnverifiedDomains: [
      canonical.workforce.role === "contract_unverified" ? "workforce" : null,
      canonical.contacts.role === "contract_unverified" ? "contacts" : null,
      canonical.delegations.role === "contract_unverified" ? "delegations" : null,
    ].filter((d): d is string => !!d),
  };

  const permissionsApplied = FACTORY_360_PERMISSIONS.filter(p => permissions[p]);
  const checksum = createHash("sha256").update(JSON.stringify({ v: PROJECTION_VERSION, summary, permissionsApplied, sectionsOmitted, providerGaps })).digest("hex");

  const snapshot: Factory360Snapshot = {
    snapshotId: `${crId}:${selected?.id ?? "_"}:${checksum.slice(0, 12)}`,
    crId,
    licenseId: selected?.id ?? null,
    projectionVersion: PROJECTION_VERSION,
    checksum,
    generatedAt: new Date().toISOString(),
    permissionsApplied,
    sectionsOmitted,
    providerGaps,
    summary,
  };

  return NextResponse.json(snapshot, { headers: { "cache-control": "no-store" } });
}
