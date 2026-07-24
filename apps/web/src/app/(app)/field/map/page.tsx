import { redirect } from "next/navigation";
import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import FieldNav from "@/components/field/FieldNav";
import FieldFullMap from "@/components/field/FieldFullMap";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { useT } from "@/lib/i18n";

// SAQEEL Field — full-screen task map ("View full map" from the Home map card /
// My Tasks visit location). Interactive Mapbox map of the inspector's own
// RLS-scoped assigned visits that carry official coordinates. Real markers only;
// GeoMap owns the governed "Map service unavailable"/empty state.
type VisitRow = {
  id: string;
  planning_status: string;
  factory_id: string | null;
  factories: { name: string; factory_code: string | null; official_lat: number | null; official_lng: number | null; risk_band: string | null } | null;
};

// GeoMap's center contract is [lat, lng] (it swaps internally for Mapbox),
// same order the home dashboard passes. Riyadh / national centre fallback.
const KSA_CENTER: [number, number] = [23.8859, 45.0792]; // [lat, lng]

const tone = (band: string | null): GeoTone =>
  band === "high" ? "high" : band === "medium" ? "medium" : band === "low" ? "low" : "neutral";

export default async function FieldMapPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const { data: asg } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, factory_id, factories(name, factory_code, official_lat, official_lng, risk_band))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  // Mirror the home "Nearby tasks map" and My Tasks exactly — same assigned
  // published/expired visits with GIS-Admin coordinates. No extra fixture
  // filtering here, so the full-screen map never diverges from the home card.
  const markers: GeoMarkerData[] = ((asg ?? []) as unknown as { visits: VisitRow | null }[])
    .map(a => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isTestFixtureEstablishment(v.factories))
    .filter(v => v.factories!.official_lat != null && v.factories!.official_lng != null)
    .map(v => ({
      id: v.id,
      lat: v.factories!.official_lat as number,
      lng: v.factories!.official_lng as number,
      label: v.factories!.name,
      tone: tone(v.factories!.risk_band),
    }));

  const center: [number, number] = markers.length ? [markers[0].lat, markers[0].lng] : KSA_CENTER;
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";

  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={back}
        title={tr("field.map.title", "Task map", "خريطة المهام")}
        subtitle={tr("field.map.sub", "Your assigned establishments", "منشآتك المسندة")}
        langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <FieldFullMap markers={markers} center={center}
        ariaLabel={tr("field.map.aria", "Map of your assigned tasks", "خريطة مهامك المسندة")} />
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      <FieldNav active="home" labels={{
        home: tr("field.tabs.home", "Home", "الرئيسية"),
        myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
        establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
        notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
        account: tr("field.tabs.account", "Account", "الحساب"),
      }} />
    </>
  );
}
