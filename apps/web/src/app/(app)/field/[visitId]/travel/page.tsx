import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import type { GeoTone } from "@/components/GeoMap";
import TravelClient, { type TravelStrings } from "./TravelClient";

// SAQEEL Field Travel — "Journey to Site" live-route/navigation screen. Shows
// the establishment on the shared Mapbox GeoMap with the inspector's live
// browser position, real road-network ETA/distance (via /api/routing/eta) and
// an honest geofence in/out-of-range status derived from the governed
// factories.geofence_radius_m (ENG-06 engine default fallback — the same
// governed chain Startup uses). This screen is DISPLAY-AND-NAVIGATE only: the governed arrival
// check-in that unlocks inspection start remains owned by the Startup flow at
// /field/[visitId] (M04-004). "Continue to check-in" links there; it never
// mutates visit/inspection state or creates a parallel arrival path.

// Same UUID short-circuit the sibling startup page uses — a cheap honest guard
// on shape alone so a non-visit literal never triggers a wasted RLS round trip.
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const tone = (band: string | null | undefined): GeoTone =>
  band === "high" ? "high" : band === "medium" ? "medium" : band === "low" ? "low" : "neutral";

export default async function FieldTravel({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const { t, locale } = await useT();
  const tr = (k: string, en: string, ar: string) => (locale === "ar" ? ar : t(k, en));
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  // RLS-scoped visit resolution — identical to the sibling field pages; the
  // policy is the authority for whether this inspector may see the visit.
  const valid = UUID_SHAPE.test(visitId);
  const { data: v } = valid
    ? await sb.from("visits")
        .select("id, factories(name, name_is_system_generated, official_lat, official_lng, geofence_radius_m, risk_band)")
        .eq("id", visitId).single()
    : { data: null };

  // ENG-06 engine default (gis). Absent settings stay absent — never defaulted.
  const { data: engines } = await sb.from("engine_settings").select("engine, settings").in("engine", ["gis"]);
  const gis = (engines?.find(e => e.engine === "gis")?.settings ?? {}) as { geofence_default_radius_m?: number };

  const strings: TravelStrings = {
    title: tr("field.travel.title", "Journey to Site", "الرحلة إلى الموقع"),
    back: tr("common.back", "Back", "رجوع"),
    stateEnRoute: tr("field.travel.stateEnRoute", "En Route", "في الطريق"),
    stateArrived: tr("field.travel.stateArrived", "Arrived", "تم الوصول"),
    stateLocating: tr("field.travel.stateLocating", "Locating…", "جارٍ تحديد الموقع…"),
    liveGps: tr("field.travel.liveGps", "Live GPS", "تتبّع مباشر"),
    eta: tr("field.travel.eta", "Est. Arrival", "الوقت المتوقع"),
    distance: tr("field.travel.distance", "Distance", "المسافة"),
    speed: tr("field.travel.speed", "Speed", "السرعة"),
    minUnit: tr("field.travel.minUnit", "min", "دقيقة"),
    kmUnit: tr("field.travel.kmUnit", "km", "كم"),
    mUnit: tr("field.travel.mUnit", "m", "م"),
    kmhUnit: tr("field.travel.kmhUnit", "km/h", "كم/س"),
    dash: "—",
    geofenceTitle: tr("field.travel.geofenceTitle", "Geofenced Arrival Verification", "التحقق الجغرافي من الوصول"),
    inRangeNote: tr("field.travel.inRangeNote", "Within establishment radius — arrival can be confirmed at check-in.", "داخل نطاق المنشأة — يمكن تأكيد الوصول عند تسجيل الدخول."),
    outOfRangeNote: tr("field.travel.outOfRangeNote", "Still outside the establishment's {r} m radius — keep navigating.", "لا تزال خارج نطاق المنشأة ({r}م) — تابع التنقل."),
    locatingNote: tr("field.travel.locatingNote", "Waiting for a GPS fix to check your distance to the establishment.", "بانتظار تحديد الموقع للتحقق من مسافتك إلى المنشأة."),
    geoUnavailableNote: tr("field.travel.geoUnavailableNote", "Location access is unavailable — enable GPS to verify arrival range.", "الوصول إلى الموقع غير متاح — فعّل تحديد الموقع للتحقق من نطاق الوصول."),
    geofenceRadius: tr("field.travel.geofenceRadius", "Geofence Radius", "نطاق التسييج"),
    // Radius provenance — same governance wording the Startup check-in card
    // uses (field.start.factoryOverride / field.start.engineDefault), so the
    // inspector reads one consistent statement of WHERE the fence came from.
    fenceFactoryOverride: tr("field.start.factoryOverride", "(factory override — )", "(تجاوز خاص بالمنشأة — )"),
    fenceEngineDefault: tr("field.start.engineDefault", "(engine default — )", "(الافتراضي من المحرّك — )"),
    fenceNotConfigured: tr("field.travel.fenceNotConfigured", "Not configured", "غير مُهيّأ"),
    fenceUnconfiguredChip: tr("field.travel.fenceUnconfiguredChip", "Radius not configured", "النطاق غير مُهيّأ"),
    fenceUnconfiguredNote: tr(
      "field.travel.fenceUnconfiguredNote",
      "No geofence radius is governed for this establishment (no factory override —, no engine default — ), so arrival range cannot be verified on this screen. Continue to the governed check-in, which owns the arrival decision.",
      "لا يوجد نطاق تسييج محكوم لهذه المنشأة (لا تجاوز خاص بالمنشأة — ولا افتراضي من المحرّك — )، لذا لا يمكن التحقق من نطاق الوصول في هذه الشاشة. تابع إلى تسجيل الدخول المحكوم الذي يملك قرار الوصول.",
    ),
    aiRouteNote: tr("field.travel.aiRouteNote", "AI route advisory: Not configured. Traffic rerouting is a Phase 2 capability.", "استشارة المسار بالذكاء الاصطناعي: غير مهيأة. إعادة التوجيه حسب الازدحام قدرة مؤجلة إلى المرحلة الثانية."),
    accuracy: tr("field.travel.accuracy", "GPS Accuracy", "دقة الموقع"),
    straightLine: tr("field.travel.straightLine", "Straight-line distance", "المسافة المباشرة"),
    etaUnavailable: tr("field.travel.etaUnavailable", "Routing provider unavailable — the live map and navigation remain available.", "خدمة تحديد المسار غير متاحة — تبقى الخريطة المباشرة والتنقل متاحة."),
    noCoords: tr("field.travel.noCoords", "No official location on file", "لا يوجد موقع رسمي مسجل"),
    noCoordsBody: tr("field.travel.noCoordsBody", "This establishment has no official coordinates, so a route and geofence cannot be shown. Continue to check-in for the governed arrival flow.", "لا تملك هذه المنشأة إحداثيات رسمية، لذا لا يمكن عرض المسار أو نطاق التسييج. تابع إلى تسجيل الدخول لإجراء الوصول المحكوم."),
    notFound: tr("field.travel.notFound", "Visit not found", "الزيارة غير موجودة"),
    notFoundBody: tr("field.start.notFoundDesc", "This visit does not exist or is outside your organizational scope.", "هذه الزيارة غير موجودة أو خارج نطاق مؤسستك."),
    youLabel: tr("field.travel.youLabel", "You", "أنت"),
    mapAria: tr("field.travel.mapAria", "Live route map to the establishment", "خريطة المسار المباشر إلى المنشأة"),
    // Fence-map verdict chip — wording follows the canonical Journey design
    // ("Within fence · {d}m" / "Outside fence · {d}m").
    fenceWithin: tr("field.travel.fenceWithin", "Within fence · {d} m", "ضمن النطاق · {d}م"),
    fenceOutside: tr("field.travel.fenceOutside", "Outside fence · {d} m", "خارج النطاق · {d}م"),
    fenceLocating: tr("field.travel.fenceLocating", "Locating…", "جارٍ تحديد الموقع…"),
    fenceMapAria: tr("field.travel.fenceMapAria", "Geofence verification map at establishment scale", "خريطة التحقق الجغرافي بمقياس المنشأة"),
    continueCheckin: tr("field.travel.continueCheckin", "Continue to check-in", "المتابعة إلى تسجيل الوصول"),
    connectivityOffline: tr("field.travel.connectivityOffline", "Offline — the live route ETA can't refresh. Your GPS position and geofence range below stay live.", "غير متصل — لا يمكن تحديث الوقت المتوقع للمسار. يبقى موقعك عبر GPS ونطاق التسييج أدناه محدّثين مباشرةً."),
    connectivityWeak: tr("field.travel.connectivityWeak", "Weak connection — the live route ETA may be delayed.", "اتصال ضعيف — قد يتأخر تحديث الوقت المتوقع للمسار."),
    updated: tr("field.travel.updated", "Fix age", "عمر التحديد"),
    updatedAgo: tr("field.travel.updatedAgo", "{n}s ago", "قبل {n} ثانية"),
    updatedNow: tr("field.travel.updatedNow", "just now", "الآن"),
  };

  const factory = (v?.factories ?? null) as { name: string; name_is_system_generated: boolean; official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null; risk_band: string | null } | null;
  const factoryName = factory
    ? (factory.name_is_system_generated ? tr("field.start.unregisteredFactory", "Unregistered factory", "منشأة غير مسجلة") : factory.name)
    : "";
  const destination = factory && factory.official_lat != null && factory.official_lng != null
    ? { lat: factory.official_lat, lng: factory.official_lng }
    : null;
  // SB20 → ENG-06 governed geofence chain: per-factory override, else the
  // ENG-06 engine default. Startup.tsx (M04-004) evaluates the SAME two
  // governed sources and additionally falls back to a 150 m code constant
  // because it must still gate arrival when nothing is governed. This screen
  // gates nothing — it only displays — so it stops at the governed chain and
  // renders `null` honestly ("Not configured") rather than printing that code
  // constant as if it were policy. Whenever either governed source resolves,
  // travel and Startup carry the identical number, so the two surfaces never
  // disagree about a real fence; when neither does, travel shows no radius, no
  // ring and no in/out verdict instead of a plausible default.
  const fence = factory?.geofence_radius_m ?? gis.geofence_default_radius_m ?? null;
  const fenceSource: "factory" | "engine" | null =
    factory?.geofence_radius_m != null ? "factory"
      : gis.geofence_default_radius_m != null ? "engine"
        : null;

  return (
    <TravelClient
      visitId={visitId}
      exists={!!v}
      destination={destination}
      factoryName={factoryName}
      factoryTone={tone(factory?.risk_band)}
      fenceRadiusM={fence}
      fenceSource={fenceSource}
      backHref={`/field/${visitId}`}
      langHref={langHref}
      langLabel={langLabel}
      strings={strings}
    />
  );
}
