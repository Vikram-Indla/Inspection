import type { SupabaseClient } from "@supabase/supabase-js";
import { readRows } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";

export type GlobalSearchType = "commercial_registration" | "industrial_license" | "plant" | "factory" | "visit" | "inspection";
export type GlobalSearchResult = { id: string; type: GlobalSearchType; label: string | null; detail: string; href: string };
export type ShellSearchOutcome = { results: GlobalSearchResult[]; degraded: boolean };

type FactoryHit = { name: string | null; factory_code: string | null };

const factoryHit: Shape<FactoryHit> = f => ({
  name: f.optionalText("name"),
  factory_code: f.optionalText("factory_code"),
});

const visitHitRow: Shape<{
  id: string; visit_type: string | null; planning_status: string | null; factories: FactoryHit | null;
}> = f => ({
  id: f.text("id"),
  visit_type: f.optionalText("visit_type"),
  planning_status: f.optionalText("planning_status"),
  factories: f.toOne("factories", factoryHit),
});

const inspectionHitRow: Shape<{
  id: string; inspection_no: string | null; status: string | null;
  visits: { factories: FactoryHit | null } | null;
}> = f => ({
  id: f.text("id"),
  inspection_no: f.optionalText("inspection_no"),
  status: f.optionalText("status"),
  visits: f.toOne("visits", visit => ({ factories: visit.toOne("factories", factoryHit) })),
});

// TASK-WEB-COMPLIANCE-SHARED-SHELL-001 · CMP-REQ-SHELL-002
// Shared by the header dropdown (api/shell/search/route.ts) and the dedicated
// /field/search page — one query/ranking rule, not two. RLS is the result
// boundary; callers pass their own RLS-scoped Supabase client, never elevated.
export async function performShellSearch(sb: SupabaseClient, rawQuery: string): Promise<ShellSearchOutcome> {
  const q = rawQuery.trim().slice(0, 80);
  if (q.length < 2) return { results: [], degraded: false };

  // K-011 — one RLS-preserving SQL union replaces twelve leading-wildcard
  // requests after the additive migration is present. SECURITY INVOKER.
  const { data: consolidated, error: consolidatedError } = await sb.rpc("shell_global_search", {
    p_query: q,
    p_limit: 12,
  });
  if (!consolidatedError) {
    const results = ((consolidated ?? []) as {
      id: string; result_type: GlobalSearchType; label: string; detail: string; href: string;
    }[]).map(row => ({ id: row.id, type: row.result_type, label: row.label, detail: row.detail, href: row.href }));
    return { results, degraded: false };
  }

  const pattern = `%${q}%`;
  // F360-BR-001..003 · F360 search contract. Each source is queried
  // independently so an unapplied/external hierarchy cannot blank legacy search.
  const [crNumber, crUnified, crNameEn, crNameAr, licenseNumber, plantNumber, factoryName, factoryCode, factoryCr, factoryLicense, visitRead, inspectionRead] = await Promise.all([
    sb.from("commercial_registrations").select("id,cr_number,unified_number,legal_name,legal_name_en,legal_name_ar,status").ilike("cr_number", pattern).limit(5),
    sb.from("commercial_registrations").select("id,cr_number,unified_number,legal_name,legal_name_en,legal_name_ar,status").ilike("unified_number", pattern).limit(5),
    sb.from("commercial_registrations").select("id,cr_number,unified_number,legal_name,legal_name_en,legal_name_ar,status").ilike("legal_name_en", pattern).limit(5),
    sb.from("commercial_registrations").select("id,cr_number,unified_number,legal_name,legal_name_en,legal_name_ar,status").ilike("legal_name_ar", pattern).limit(5),
    sb.from("industrial_licenses").select("id,commercial_registration_id,factory_id,license_number,plant_number,license_type,status").ilike("license_number", pattern).limit(5),
    sb.from("industrial_licenses").select("id,commercial_registration_id,factory_id,license_number,plant_number,license_type,status").ilike("plant_number", pattern).limit(5),
    sb.from("factories").select("id,name,factory_code,region,city").ilike("name", pattern).limit(5),
    sb.from("factories").select("id,name,factory_code,region,city").ilike("factory_code", pattern).limit(5),
    sb.from("factories").select("id,name,factory_code,region,city").ilike("cr_number", pattern).limit(5),
    sb.from("factories").select("id,name,factory_code,region,city").ilike("license_number", pattern).limit(5),
    sb.from("visits").select("id,visit_type,planning_status,factories(name,factory_code)").ilike("visit_type", pattern).limit(5),
    sb.from("inspections").select("id,inspection_no,status,visits(factories(name,factory_code))").ilike("inspection_no", pattern).limit(5),
  ]);

  const seenCrs = new Set<string>();
  const commercialRegistrations = [...(crNumber.data ?? []), ...(crUnified.data ?? []), ...(crNameEn.data ?? []), ...(crNameAr.data ?? [])].flatMap(row => {
    if (seenCrs.has(row.id)) return [];
    seenCrs.add(row.id);
    return [{
      id: row.id,
      type: "commercial_registration" as const,
      label: row.legal_name_en ?? row.legal_name_ar ?? row.legal_name ?? row.cr_number,
      detail: [row.cr_number, row.unified_number, row.status].filter(Boolean).join(" · "),
      href: `/factories/cr/${row.id}`,
    }];
  }).slice(0, 5);

  const seenLicenses = new Set<string>();
  const licenses = [...(licenseNumber.data ?? []), ...(plantNumber.data ?? [])].flatMap(row => {
    if (seenLicenses.has(row.id)) return [];
    seenLicenses.add(row.id);
    const hasCr = Boolean(row.commercial_registration_id);
    return [{
      id: row.id,
      type: row.plant_number ? "plant" as const : "industrial_license" as const,
      label: row.license_number,
      detail: [row.plant_number, row.license_type, row.status].filter(Boolean).join(" · "),
      href: hasCr ? `/factories/cr/${row.commercial_registration_id}?license=${row.id}` : `/factories/${row.factory_id}`,
    }];
  }).slice(0, 5);

  const seenFactories = new Set<string>();
  const factories = [...(factoryName.data ?? []), ...(factoryCode.data ?? []), ...(factoryCr.data ?? []), ...(factoryLicense.data ?? [])].flatMap(row => {
    if (seenFactories.has(row.id)) return [];
    seenFactories.add(row.id);
    return [{
      id: row.id,
      type: "factory" as const,
      label: row.name,
      detail: [row.factory_code, row.region, row.city].filter(Boolean).join(" · "),
      href: `/factories/${row.id}`,
    }];
  }).slice(0, 5);

  const visits = readRows(visitRead, visitHitRow, "shell.visit_search").rows.map(row => ({
    id: row.id,
    type: "visit" as const,
    label: row.factories?.name ?? row.id.slice(0, 8),
    detail: [row.factories?.factory_code, row.visit_type, row.planning_status].filter(Boolean).join(" · "),
    href: `/visits/${row.id}`,
  }));

  const inspections = readRows(inspectionRead, inspectionHitRow, "shell.inspection_search").rows.map(row => ({
    id: row.id,
    type: "inspection" as const,
    label: row.inspection_no ?? row.id.slice(0, 8),
    detail: [row.visits?.factories?.name, row.visits?.factories?.factory_code, row.status].filter(Boolean).join(" · "),
    href: `/field/inspection/${row.id}`,
  }));

  const failed = [consolidatedError, crNumber.error, crUnified.error, crNameEn.error, crNameAr.error, licenseNumber.error, plantNumber.error, factoryName.error, factoryCode.error, factoryCr.error, factoryLicense.error, visitRead.error, inspectionRead.error].filter(Boolean).length;
  return { results: [...commercialRegistrations, ...licenses, ...factories, ...visits, ...inspections].slice(0, 12), degraded: failed > 0 };
}
