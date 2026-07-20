import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// TASK-WEB-COMPLIANCE-SHARED-SHELL-001 · CMP-REQ-SHELL-002
// This endpoint performs ordinary authenticated SELECTs. Supabase RLS is the
// result boundary; the shell never uses an elevated client or bypass query.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return NextResponse.json({ results: [] }, { status: 401 });

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

  const visits = (visitRead.data ?? []).map(row => {
    const factory = row.factories as unknown as { name: string | null; factory_code: string | null } | null;
    return {
      id: row.id,
      type: "visit" as const,
      label: factory?.name ?? row.id.slice(0, 8),
      detail: [factory?.factory_code, row.visit_type, row.planning_status].filter(Boolean).join(" · "),
      href: `/visits/${row.id}`,
    };
  });

  const inspections = (inspectionRead.data ?? []).map(row => {
    const visit = row.visits as unknown as { factories: { name: string | null; factory_code: string | null } | null } | null;
    return {
      id: row.id,
      type: "inspection" as const,
      label: row.inspection_no ?? row.id.slice(0, 8),
      detail: [visit?.factories?.name, visit?.factories?.factory_code, row.status].filter(Boolean).join(" · "),
      href: `/field/inspection/${row.id}`,
    };
  });

  const failed = [crNumber.error, crUnified.error, crNameEn.error, crNameAr.error, licenseNumber.error, plantNumber.error, factoryName.error, factoryCode.error, factoryCr.error, factoryLicense.error, visitRead.error, inspectionRead.error].filter(Boolean).length;
  return NextResponse.json({ results: [...commercialRegistrations, ...licenses, ...factories, ...visits, ...inspections].slice(0, 12), degraded: failed > 0 });
}
