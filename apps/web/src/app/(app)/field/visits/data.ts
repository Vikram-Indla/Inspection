import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FieldVisit } from "./VisitsClient";

const CLEAN_FACTORY_CODES = new Set([
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204", "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305", "F-4401", "F-4402",
  "F-5501", "F-5502", "F-6601", "F-6602",
]);

type Row = {
  status: string | null; return_reason: string | null;
  visits: {
    id: string; visit_reference: string | null; planning_status: string; operational_state: string; window_start: string;
    window_end: string | null; visit_type: string; execution_mode: string; priority: string | null;
    package_version_id: string | null;
    factories: { name: string; factory_code: string | null; cr_number: string | null; license_number: string | null; region: string | null; city: string | null; official_lat: number | null; official_lng: number | null } | null;
    inspections: { id: string; status: string } | null;
  } | null;
};

/** CR-100: inspector_id is applied in the RLS-scoped server query, never in the browser. */
export async function loadAssignedVisits(sb: SupabaseClient, inspectorId: string) {
  const read = await sb.from("assignments")
    .select("status, return_reason, visits(id, visit_reference, planning_status, operational_state, window_start, window_end, visit_type, execution_mode, priority, package_version_id, factories(name, factory_code, cr_number, license_number, region, city, official_lat, official_lng), inspections(id, status))")
    .eq("inspector_id", inspectorId)
    .order("created_at", { ascending: false });
  if (read.error) return { visits: [] as FieldVisit[], error: read.error };
  const visits = ((read.data ?? []) as unknown as Row[])
    .filter((row): row is Row & { visits: NonNullable<Row["visits"]> } => !!row.visits?.factories)
    .filter(row => CLEAN_FACTORY_CODES.has(row.visits.factories!.factory_code ?? ""))
    .filter(row => !isTestFixtureEstablishment(row.visits.factories))
    .map((row): FieldVisit => ({
      id: row.visits.id, visitReference: row.visits.visit_reference,
      assignmentStatus: row.status, returnReason: row.return_reason,
      planningStatus: row.visits.planning_status, operationalState: row.visits.operational_state,
      windowStart: row.visits.window_start, windowEnd: row.visits.window_end,
      visitType: row.visits.visit_type, executionMode: row.visits.execution_mode,
      priority: row.visits.priority, packageVersionId: row.visits.package_version_id,
      inspectionId: row.visits.inspections?.id ?? null, inspectionStatus: row.visits.inspections?.status ?? null,
      unreadAlertCount: 0,
      factory: {
        name: row.visits.factories!.name, code: row.visits.factories!.factory_code,
        region: row.visits.factories!.region, city: row.visits.factories!.city,
        crNumber: row.visits.factories!.cr_number, licenseNumber: row.visits.factories!.license_number,
        officialLat: row.visits.factories!.official_lat, officialLng: row.visits.factories!.official_lng,
      },
    }));
  return { visits, error: null };
}
