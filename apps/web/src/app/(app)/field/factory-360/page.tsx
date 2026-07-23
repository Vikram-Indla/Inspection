import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

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
        langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"}
        themeLabels={{
          toLight: tr("field.theme.toLight", "Light mode", "الوضع الفاتح"),
          toDark: tr("field.theme.toDark", "Dark mode", "الوضع الداكن"),
        }} />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
        <div className="empty" role="status">
          <div style={{ fontSize: 30, lineHeight: 1, marginBlockEnd: 10 }} aria-hidden="true">∅</div>
          <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>
            {t("f360.resolve.title", "Factory 360 context not found")}
          </h2>
          <p className="t-caption" style={{ margin: 0, maxWidth: 320 }}>
            {t("f360.resolve.body", "No commercial registration, license or plant in your scope matched this entry point.")}
          </p>
        </div>
      </div>
    </>
  );
}
