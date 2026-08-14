import { redirect } from "next/navigation";
import Link from "next/link";
import FieldHeader from "@/components/field/FieldHeader";
import FieldFullMap from "@/components/field/FieldFullMap";
import EmptyState from "@/components/EmptyState";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { formatTime } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import styles from "./map.module.css";

// SAQEEL Field — full-screen task map ("View full map" from the Home map card /
// My Tasks visit location). Interactive Mapbox map of the inspector's own
// RLS-scoped assigned visits that carry official coordinates, with the numbered
// route-sequence strip and risk legend from the Dashboard design's operations
// map card. Real markers only; GeoMap owns the governed "Map service
// unavailable" state and the real KSA region layer.
//
// The design renders this card as a schematic ("Route schematic · not to
// scale") with hand-placed nodes. That schematic is not reproduced: the canvas
// is the real basemap, and the ordering it encoded is carried by the sequence
// strip below, driven by the governed visits.window_start.
type VisitRow = {
  id: string;
  planning_status: string;
  window_start: string | null;
  factory_id: string | null;
  factories: { name: string; factory_code: string | null; official_lat: number | null; official_lng: number | null; risk_band: string | null } | null;
};

// GeoMap's center contract is [lat, lng] (it swaps internally for Mapbox),
// same order the home dashboard passes. Riyadh / national centre fallback.
const KSA_CENTER: [number, number] = [23.8859, 45.0792]; // [lat, lng]

// Partner-workstation PWA data boundary: only the 24 curated factories in
// CURRENT_LIVE_TEST_DATA_GUIDE may appear. Explicit allowlist so legacy and
// bulk-clutter rows fail closed — same list as the Establishments, Reports and
// Factory 360 field routes.
const CLEAN_FACTORY_CODES: readonly string[] = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402", "F-5501", "F-5502", "F-6601", "F-6602",
];

const tone = (band: string | null): GeoTone =>
  band === "high" ? "high" : band === "medium" ? "medium" : band === "low" ? "low" : "neutral";

const TONE_CLASS: Record<GeoTone, string> = {
  high: styles.toneHigh, medium: styles.toneMedium, low: styles.toneLow, neutral: styles.toneNeutral,
  brand: styles.toneBrand,
};

export default async function FieldMapPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const { data: asg, error: assignmentsError } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, window_start, factory_id, factories(name, factory_code, official_lat, official_lng, risk_band))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  // Same assigned published/expired visits with GIS-Admin coordinates the home
  // "Nearby tasks map" shows, narrowed to the curated establishment set.
  const stops = ((asg ?? []) as unknown as { visits: VisitRow | null }[])
    .map(a => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isTestFixtureEstablishment(v.factories))
    .filter(v => CLEAN_FACTORY_CODES.includes(v.factories!.factory_code ?? ""))
    .filter(v => v.factories!.official_lat != null && v.factories!.official_lng != null)
    // Governed visit window drives the order. Visits with no window sort last
    // and are never given a sequence number.
    .sort((a, b) => {
      if (!a.window_start) return b.window_start ? 1 : 0;
      if (!b.window_start) return -1;
      return a.window_start.localeCompare(b.window_start);
    });

  const markers: GeoMarkerData[] = stops.map(v => ({
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

  // Sequence numbers count only the visits that carry a governed window.
  let sequence = 0;

  return (
    <>
      <FieldHeader
        leading={back}
        title={tr("field.map.title", "Task map", "خريطة المهام")}
        subtitle={tr("field.map.sub", "Your assigned establishments", "منشآتك المسندة")}
        langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"}
      />

      {assignmentsError ? (
        <div className={styles.empty}>
          <EmptyState
            glyph="!"
            title={tr("field.map.errorTitle", "Task map unavailable", "خريطة المهام غير متاحة")}
            body={tr("field.map.errorBody", "Your assigned establishments could not be loaded. Try again when the service is available.", "تعذر تحميل منشآتك المسندة. حاول مرة أخرى عند توفر الخدمة.")}
          />
        </div>
      ) : markers.length ? (
        <>
          <FieldFullMap markers={markers} center={center}
            ariaLabel={tr("field.map.aria", "Map of your assigned tasks", "خريطة مهامك المسندة")} />

          <div className={styles.panel}>
            <ol className={styles.sequence} aria-label={tr("field.map.sequenceAria", "Assigned establishments in visit-window order", "المنشآت المسندة بترتيب نافذة الزيارة")}>
              {stops.map(v => {
                const band = tone(v.factories!.risk_band);
                const n = v.window_start ? ++sequence : null;
                return (
                  <li key={v.id} className={styles.stop}>
                    {n != null
                      ? <span className={`${styles.stopIndex} ${TONE_CLASS[band]}`}>{n}</span>
                      : <span className={`${styles.stopDot} ${TONE_CLASS[band]}`} />}
                    <span className={styles.stopName}><bdi>{v.factories!.name}</bdi></span>
                    {v.window_start && (
                      <span className={`id-code ${styles.stopTime}`}>{formatTime(v.window_start, locale)}</span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.toneHigh}`} />{tr("field.home.legend.high", "High risk", "خطورة عالية")}
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.toneMedium}`} />{tr("field.home.legend.med", "Medium risk", "خطورة متوسطة")}
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.toneLow}`} />{tr("field.home.legend.low", "Low risk", "خطورة منخفضة")}
              </span>
              <span className={`t-caption ${styles.legendNote}`}>
                {tr("field.map.orderNote", "Ordered by visit window (Riyadh)", "مرتبة حسب نافذة الزيارة (الرياض)")}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <EmptyState
            glyph="⌖"
            title={tr("field.map.emptyTitle", "No mapped assignments", "لا توجد مهام على الخريطة")}
            body={tr("field.map.emptyBody", "None of your assigned establishments has official coordinates on file, so there is nothing to place on the map.", "لا تملك أي من المنشآت المسندة إليك إحداثيات رسمية مسجلة، لذا لا يوجد ما يمكن عرضه على الخريطة.")}
          />
        </div>
      )}

      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
    </>
  );
}
