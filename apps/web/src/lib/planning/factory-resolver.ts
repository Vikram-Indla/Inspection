// SERVER-ONLY — canonical CR → Industrial Licence → Plant target resolver for
// Single Planning (PLN-REQ-020/021/022/023). Imported only from Server
// Components and Server Actions.
//
// Source model (migration 20260720010000_factory360_v2_foundation.sql):
//   commercial_registrations (cr_number unique)
//     └─ industrial_licenses (license_number unique, plant_number unique,
//        factory_id unique → factories)
//           └─ plant_addresses (versioned; one is_current row per factory)
// `factories` remains the legacy working table and the publish-time plant
// identity (the publish RPC targets factory_id). The resolver therefore
// always carries the joined factories row through as the target's publish
// identity; canonical licence/plant identifiers ride alongside it.
//
// Contract:
//   - Exact, case-insensitive identifier matching only (identifiers are
//     governed codes; no partial/fuzzy matching — same rule as CD-022).
//   - A licence with no commercial_registration_id cannot show CR identity;
//     it is skipped here (the legacy factories fallback still surfaces the
//     factory row by its own identifiers — nothing is fabricated).
//   - Fail closed: any read error returns { ok: false } and is logged
//     server-side; callers render the neutral unavailable state, never a
//     fake-empty result.
//   - Empty result ({ portfolios: [] }) is the signal for the caller to fall
//     back to the legacy factories search (existing CD-022 behavior).

import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanningTargetMode = "cr" | "license" | "plant";

export type ResolvedFactory = {
  id: string;
  factoryCode: string | null;
  name: string;
  // The legacy publish identity column (factories.license_number) the
  // publish RPC revalidates p_license_number against — carried through so the
  // publish form never has to guess which licence value the RPC will accept.
  licenseNumber: string | null;
  region: string | null;
  city: string | null;
  officialLat: number | null;
  officialLng: number | null;
  geofenceRadiusM: number | null;
  riskBand: string | null;
  riskScore: number | null;
  source: string | null;
  sourceSyncedAt: string | null;
};

export type ResolvedPlantAddress = {
  addressLine1: string | null;
  districtEn: string | null;
  cityEn: string | null;
  regionEn: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceSystem: string | null;
  effectiveAt: string;
};

export type ResolvedLicence = {
  id: string;
  licenseNumber: string;
  plantNumber: string | null;
  licenseType: string | null;
  status: string | null;
  stage: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  holderName: string | null;
  sourceSystem: string | null;
  sourceSyncedAt: string | null;
  factory: ResolvedFactory | null;
  plantAddress: ResolvedPlantAddress | null;
};

export type ResolvedPortfolio = {
  id: string;
  crNumber: string;
  unifiedNumber: string | null;
  legalName: string | null;
  legalNameEn: string | null;
  legalNameAr: string | null;
  status: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  ownerDetails: string | null;
  sourceSystem: string | null;
  sourceSyncedAt: string | null;
  licences: ResolvedLicence[];
};

export type ResolverResult =
  | { ok: true; mode: PlanningTargetMode; portfolios: ResolvedPortfolio[] }
  | { ok: true; mode: null; portfolios: [] }
  | { ok: false };

const MAX_CRS = 10;
const MAX_LICENCES = 50;

// Identifiers are matched exactly (case-insensitive). ilike treats % and _ as
// wildcards, so escape them; strip characters that would break PostgREST
// filter syntax (same treatment as lib/planning/visit-list.ts).
const escExact = (q: string) => q.replace(/[(),"\\]/g, " ").replace(/[%_]/g, c => `\\${c}`).trim();

const num = (v: unknown): number | null => (v == null ? null : Number(v));

type LicenceRow = {
  id: string;
  commercial_registration_id: string | null;
  factory_id: string;
  license_number: string;
  plant_number: string | null;
  license_type: string | null;
  status: string | null;
  stage: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  holder_name: string | null;
  source_system: string | null;
  source_synced_at: string | null;
  factories: {
    id: string; factory_code: string | null; name: string; license_number: string | null;
    region: string | null; city: string | null;
    official_lat: number | null; official_lng: number | null;
    geofence_radius_m: number | null;
    risk_band: string | null; risk_score: number | null;
    source: string | null; source_synced_at: string | null;
  } | null;
};

export async function resolvePlanningTargets(
  sb: SupabaseClient,
  { q, mode = "auto" }: { q: string; mode?: PlanningTargetMode | "auto" },
): Promise<ResolverResult> {
  const query = escExact(q);
  if (!query) return { ok: true, mode: null, portfolios: [] };

  const byCr = mode === "auto" || mode === "cr";
  const byLicense = mode === "auto" || mode === "license";
  const byPlant = mode === "auto" || mode === "plant";
  const empty = { data: [] as { id?: string; commercial_registration_id?: string | null }[], error: null };

  // Step 1 — locate matching commercial_registration ids per mode. Identifier
  // equality only; mode "auto" tries all three legs and reports which matched.
  const [crRead, licRead, plantRead] = await Promise.all([
    byCr
      ? sb.from("commercial_registrations").select("id").ilike("cr_number", query).limit(MAX_CRS)
      : Promise.resolve(empty),
    byLicense
      ? sb.from("industrial_licenses").select("commercial_registration_id").ilike("license_number", query).limit(MAX_LICENCES)
      : Promise.resolve(empty),
    byPlant
      ? sb.from("industrial_licenses").select("commercial_registration_id").ilike("plant_number", query).limit(MAX_LICENCES)
      : Promise.resolve(empty),
  ]);
  if (crRead.error || licRead.error || plantRead.error) {
    console.error("[planning.resolver] identifier read failed:",
      crRead.error?.message ?? licRead.error?.message ?? plantRead.error?.message);
    return { ok: false };
  }

  const crIds = new Set<string>();
  let matchedMode: PlanningTargetMode | null = null;
  // Precedence: a licence/plant hit is the more specific target; a CR hit
  // opens the whole portfolio.
  for (const row of licRead.data ?? []) {
    if (row.commercial_registration_id) { crIds.add(row.commercial_registration_id); matchedMode = matchedMode ?? "license"; }
  }
  for (const row of plantRead.data ?? []) {
    if (row.commercial_registration_id) { crIds.add(row.commercial_registration_id); matchedMode = matchedMode ?? "plant"; }
  }
  for (const row of crRead.data ?? []) {
    if (row.id) { crIds.add(row.id); matchedMode = matchedMode ?? "cr"; }
  }
  if (crIds.size === 0 || matchedMode == null) return { ok: true, mode: null, portfolios: [] };

  const ids = [...crIds].slice(0, MAX_CRS);

  // Step 2 — full CR identity rows and every licence under them (with the
  // joined factory/plant identity the publish path targets).
  const [crFullRead, licenceFullRead] = await Promise.all([
    sb.from("commercial_registrations")
      .select("id, cr_number, unified_number, legal_name, legal_name_en, legal_name_ar, status, issue_date, expiry_date, owner_details, source_system, source_synced_at")
      .in("id", ids),
    sb.from("industrial_licenses")
      .select(`id, commercial_registration_id, factory_id, license_number, plant_number,
        license_type, status, stage, issue_date, expiry_date, holder_name,
        source_system, source_synced_at,
        factories(id, factory_code, name, license_number, region, city, official_lat, official_lng,
          geofence_radius_m, risk_band, risk_score, source, source_synced_at)`)
      .in("commercial_registration_id", ids)
      .order("license_number")
      .limit(MAX_LICENCES),
  ]);
  if (crFullRead.error || licenceFullRead.error) {
    console.error("[planning.resolver] portfolio read failed:", crFullRead.error?.message ?? licenceFullRead.error?.message);
    return { ok: false };
  }

  const licenceRows = (licenceFullRead.data ?? []) as unknown as LicenceRow[];
  const licenceIds = licenceRows.map(l => l.id);

  // Step 3 — current plant address per licence (versioned; is_current only).
  const addressRead = licenceIds.length
    ? await sb.from("plant_addresses")
        .select("industrial_license_id, address_line_1, district_en, city_en, region_en, latitude, longitude, source_system, effective_at")
        .in("industrial_license_id", licenceIds)
        .eq("is_current", true)
    : { data: [] as Record<string, unknown>[], error: null };
  if (addressRead.error) {
    console.error("[planning.resolver] plant address read failed:", addressRead.error.message);
    return { ok: false };
  }
  const addressByLicence = new Map<string, ResolvedPlantAddress>();
  for (const a of (addressRead.data ?? []) as Record<string, unknown>[]) {
    addressByLicence.set(a.industrial_license_id as string, {
      addressLine1: (a.address_line_1 as string | null) ?? null,
      districtEn: (a.district_en as string | null) ?? null,
      cityEn: (a.city_en as string | null) ?? null,
      regionEn: (a.region_en as string | null) ?? null,
      latitude: num(a.latitude),
      longitude: num(a.longitude),
      sourceSystem: (a.source_system as string | null) ?? null,
      effectiveAt: (a.effective_at as string) ?? "",
    });
  }

  const licencesByCr = new Map<string, ResolvedLicence[]>();
  for (const l of licenceRows) {
    if (!l.commercial_registration_id) continue; // no CR identity — never fabricate one
    const f = l.factories;
    const resolved: ResolvedLicence = {
      id: l.id,
      licenseNumber: l.license_number,
      plantNumber: l.plant_number,
      licenseType: l.license_type,
      status: l.status,
      stage: l.stage,
      issueDate: l.issue_date,
      expiryDate: l.expiry_date,
      holderName: l.holder_name,
      sourceSystem: l.source_system,
      sourceSyncedAt: l.source_synced_at,
      factory: f
        ? {
            id: f.id, factoryCode: f.factory_code, name: f.name,
            licenseNumber: f.license_number,
            region: f.region, city: f.city,
            officialLat: num(f.official_lat), officialLng: num(f.official_lng),
            geofenceRadiusM: num(f.geofence_radius_m),
            riskBand: f.risk_band, riskScore: num(f.risk_score),
            source: f.source, sourceSyncedAt: f.source_synced_at,
          }
        : null,
      plantAddress: addressByLicence.get(l.id) ?? null,
    };
    const list = licencesByCr.get(l.commercial_registration_id) ?? [];
    list.push(resolved);
    licencesByCr.set(l.commercial_registration_id, list);
  }

  const portfolios: ResolvedPortfolio[] = ((crFullRead.data ?? []) as Record<string, unknown>[]).map(cr => ({
    id: cr.id as string,
    crNumber: cr.cr_number as string,
    unifiedNumber: (cr.unified_number as string | null) ?? null,
    legalName: (cr.legal_name as string | null) ?? null,
    legalNameEn: (cr.legal_name_en as string | null) ?? null,
    legalNameAr: (cr.legal_name_ar as string | null) ?? null,
    status: (cr.status as string | null) ?? null,
    issueDate: (cr.issue_date as string | null) ?? null,
    expiryDate: (cr.expiry_date as string | null) ?? null,
    ownerDetails: (cr.owner_details as string | null) ?? null,
    sourceSystem: (cr.source_system as string | null) ?? null,
    sourceSyncedAt: (cr.source_synced_at as string | null) ?? null,
    licences: licencesByCr.get(cr.id as string) ?? [],
  }));

  return { ok: true, mode: matchedMode, portfolios };
}

// Factory 360 handoff prefill (PLN-REQ-024) — resolve an explicit
// cr/license/plant identifier set to ONE portfolio and, when the licence leg
// pins it, ONE licence inside it. Exact identifier equality only; a handoff
// that names both licence and plant must match BOTH on the same licence row
// (a disagreeing pair is a miss, never a best-effort pick). A CR-only handoff
// preselects the licence only when the CR resolves to exactly one.
export type HandoffTarget =
  | { ok: true; portfolio: ResolvedPortfolio; licence: ResolvedLicence | null }
  | { ok: true; portfolio: null; licence: null }
  | { ok: false };

export async function resolveHandoffTarget(
  sb: SupabaseClient,
  { cr, license, plant }: { cr?: string; license?: string; plant?: string },
): Promise<HandoffTarget> {
  const lic = (license ?? "").trim().toLowerCase();
  const pl = (plant ?? "").trim().toLowerCase();
  const crn = (cr ?? "").trim();
  const q = pl || lic || crn.toLowerCase();
  if (!q) return { ok: true, portfolio: null, licence: null };
  const mode: PlanningTargetMode = pl ? "plant" : lic ? "license" : "cr";
  const res = await resolvePlanningTargets(sb, { q, mode });
  if (!res.ok) return { ok: false };
  if (res.mode == null || res.portfolios.length === 0) return { ok: true, portfolio: null, licence: null };

  for (const portfolio of res.portfolios) {
    for (const licence of portfolio.licences) {
      if (lic && licence.licenseNumber.toLowerCase() === lic && (!pl || licence.plantNumber?.toLowerCase() === pl)) {
        return { ok: true, portfolio, licence };
      }
      if (!lic && pl && licence.plantNumber?.toLowerCase() === pl) {
        return { ok: true, portfolio, licence };
      }
    }
  }
  if (!lic && !pl) {
    const portfolio = res.portfolios[0];
    return { ok: true, portfolio, licence: portfolio.licences.length === 1 ? portfolio.licences[0] : null };
  }
  return { ok: true, portfolio: null, licence: null };
}
