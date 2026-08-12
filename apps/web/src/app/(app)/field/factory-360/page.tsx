import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import Icon from "@/components/saqeel/icon/icon";
import { Heading } from "@/components/saqeel/type";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
] as const;

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

  async function goIfClean(crId: string, licenseId?: string | null) {
    let query = sb.from("industrial_licenses")
      .select("id, commercial_registration_id, factory_id")
      .eq("commercial_registration_id", crId);
    if (licenseId) query = query.eq("id", licenseId);
    const { data: candidates } = await query.order("license_number").limit(50);
    const factoryIds = (candidates ?? []).map(row => row.factory_id).filter(Boolean);
    if (!factoryIds.length) return false;
    const { data: cleanFactories } = await sb.from("factories")
      .select("id")
      .in("id", factoryIds)
      .in("factory_code", [...CLEAN_FACTORY_CODES]);
    const cleanIds = new Set((cleanFactories ?? []).map(row => row.id));
    const match = (candidates ?? []).find(row => cleanIds.has(row.factory_id));
    if (!match) return false;
    go(match.commercial_registration_id, match.id);
  }

  if (license) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("id", license).maybeSingle();
    if (data?.commercial_registration_id) await goIfClean(data.commercial_registration_id, data.id);
  }
  if (factory) {
    const { data: cleanFactory } = await sb.from("factories").select("id").eq("id", factory).in("factory_code", [...CLEAN_FACTORY_CODES]).maybeSingle();
    if (cleanFactory) {
      const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("factory_id", cleanFactory.id).order("license_number").limit(1).maybeSingle();
      if (data?.commercial_registration_id) go(data.commercial_registration_id, data.id);
    }
  }
  if (plant) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("plant_number", plant).order("license_number").limit(1).maybeSingle();
    if (data?.commercial_registration_id) await goIfClean(data.commercial_registration_id, data.id);
  }
  if (license_no) {
    const { data } = await sb.from("industrial_licenses").select("id, commercial_registration_id").eq("license_number", license_no).order("license_number").limit(1).maybeSingle();
    if (data?.commercial_registration_id) await goIfClean(data.commercial_registration_id, data.id);
  }
  if (cr_no) {
    const { data } = await sb.from("commercial_registrations").select("id").eq("cr_number", cr_no).maybeSingle();
    if (data?.id) await goIfClean(data.id, license ?? null);
  }
  if (cr) await goIfClean(cr, license);

  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="m15 6-6 6 6 6" /></svg>
    </Link>
  );
  return (
    <>
      <FieldHeader leading={back} title={t("f360.title", "Factory 360")}
        langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"} />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
        <div className="empty" role="status">
          <Icon name="factory" size="xl" />
          <Heading level={2} visual="subheading">
            {t("f360.resolve.title", "Factory 360 context not found")}
          </Heading>
          <p className="t-caption" style={{ margin: 0, maxWidth: 320 }}>
            {t("f360.resolve.body", "No commercial registration, license or plant in your scope matched this entry point.")}
          </p>
        </div>
      </div>
    </>
  );
}
