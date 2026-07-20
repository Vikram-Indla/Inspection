import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// TASK-FACTORY-360-IPAD-011 · F360IPAD-ENTRY-001 · CHUNK 1
// Field Factory 360 entry resolver. Any inspector entry point (assigned visit,
// immediate inspection, search, map, notification, report, risk/compliance
// drill-through) links here with whatever identifier it holds; this resolves
// the canonical CR + selected license + plant and redirects to
// /field/factory-360/{crId}?license={licenseId}. RLS-scoped — a caller only
// resolves records inside their own visibility.
export default async function FieldFactory360Resolver({ searchParams }: {
  searchParams: Promise<{ factory?: string; license?: string; plant?: string; cr?: string; license_no?: string; cr_no?: string; return?: string }>;
}) {
  const { factory, license, plant, cr, license_no, cr_no, return: returnTo } = await searchParams;
  const suffix = returnTo && returnTo.startsWith("/field") ? `&return=${encodeURIComponent(returnTo)}` : "";
  const go = (crId: string, licenseId?: string | null) => redirect(`/field/factory-360/${crId}?license=${licenseId ?? ""}${suffix}`);

  const sb = await supabaseServer();

  if (cr) go(cr, license);

  if (license) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("id", license).maybeSingle();
    if (data?.commercial_registration_id) go(data.commercial_registration_id, data.id);
  }
  if (factory) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("factory_id", factory).order("license_number").limit(1).maybeSingle();
    if (data?.commercial_registration_id) go(data.commercial_registration_id, data.id);
  }
  if (plant) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("plant_number", plant).order("license_number").limit(1).maybeSingle();
    if (data?.commercial_registration_id) go(data.commercial_registration_id, data.id);
  }
  if (license_no) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("license_number", license_no).order("license_number").limit(1).maybeSingle();
    if (data?.commercial_registration_id) go(data.commercial_registration_id, data.id);
  }
  if (cr_no) {
    const { data } = await sb.from("commercial_registrations").select("id").eq("cr_number", cr_no).maybeSingle();
    if (data?.id) go(data.id, license ?? null);
  }

  const { t } = await useT();
  return (
    <Shell current="/field" title={t("f360.title", "Factory 360")}>
      <EmptyState glyph="∅" title={t("f360.resolve.title", "Factory 360 context not found")}
        body={t("f360.resolve.body", "No commercial registration, license or plant in your scope matched this entry point.")} />
    </Shell>
  );
}
