// KSA-REGIONS — the single canonical map source for Saudi first-level
// administrative geography across every map surface (login atlas, shared
// GeoMap, Operations Live, Admin GIS). One bundled GeoJSON, one id space, one
// loader. Regenerate the asset with `npm run geo:regions`
// (scripts/fetch-ksa-regions.mjs, GADM v4.1 via ArcGIS).
//
// Rules:
//   - Never hardcode region polygons anywhere else; import from here.
//   - Never live-fetch the ArcGIS endpoint from the app (pre-auth IP leak +
//     5 MB payload). The build-time script owns that; the app serves the
//     bundled asset from /public.

export const KSA_REGIONS_URL = "/geo/sau-regions.geo.json";

// Canonical framing for the Kingdom, shared so every map centres identically.
export const KSA_CENTER: [number, number] = [23.9, 45.0]; // [lat, lng]
export const KSA_BOUNDS: [[number, number], [number, number]] = [[15.8, 34.4], [32.4, 56.0]]; // [[S,W],[N,E]]

export type KsaRegionId =
  | "riyadh" | "makkah" | "madinah" | "eastern" | "asir" | "tabuk"
  | "hail" | "qassim" | "jazan" | "najran" | "bahah" | "jawf" | "northern";

export type KsaRegionProps = {
  id: KsaRegionId;
  name_en: string;
  name_ar: string;
  gid: string;
  hasc: string;
};

export type KsaRegionFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, KsaRegionProps>;
export type KsaRegionCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, KsaRegionProps>;

// Module-level cache: fetched once per client session, shared by every map.
let cache: KsaRegionCollection | null = null;
let inflight: Promise<KsaRegionCollection> | null = null;

/** Load the canonical region collection (client-side, cached). Throws on a
 *  bad response so callers can degrade gracefully — a map should still render
 *  without its region layer. */
export async function loadKsaRegions(): Promise<KsaRegionCollection> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch(KSA_REGIONS_URL);
    if (!res.ok) { inflight = null; throw new Error(`ksa-regions ${res.status}`); }
    const gj = (await res.json()) as KsaRegionCollection;
    cache = gj;
    inflight = null;
    return gj;
  })();
  return inflight;
}

// Every ring of a region as [lat, lng] pairs (Leaflet order). Polygon and
// MultiPolygon both yield one entry per outer ring.
export function regionRingsLatLng(feature: KsaRegionFeature): [number, number][][] {
  const polys = (feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates) as GeoJSON.Position[][][];
  return polys.map(poly => poly[0].map(([lng, lat]) => [lat, lng] as [number, number]));
}

// Aliases let seeded/free-text region names from server data resolve onto the
// canonical id space. Keys are lowercased; add spellings as data surfaces them.
const ALIASES: Record<KsaRegionId, string[]> = {
  riyadh: ["riyadh", "ar riyad", "ar-riyad", "al riyadh", "riyad", "الرياض"],
  makkah: ["makkah", "mecca", "makkah al mukarramah", "مكة", "مكة المكرمة"],
  madinah: ["madinah", "medina", "al madinah", "al madinah al munawwarah", "المدينة", "المدينة المنورة"],
  eastern: ["eastern", "eastern province", "eastern region", "ash sharqiyah", "ash-sharqiyah", "al sharqiyah", "sharqiyah", "الشرقية", "المنطقة الشرقية"],
  asir: ["asir", "aseer", "'asir", "assyear", "عسير"],
  tabuk: ["tabuk", "tabouk", "تبوك"],
  hail: ["hail", "ha'il", "hail region", "حائل"],
  qassim: ["qassim", "al qassim", "al-qassim", "qasim", "القصيم"],
  jazan: ["jazan", "jizan", "gizan", "جازان", "جيزان"],
  najran: ["najran", "نجران"],
  bahah: ["bahah", "al bahah", "al baha", "baha", "الباحة"],
  jawf: ["jawf", "al jawf", "al-jawf", "aljouf", "الجوف"],
  northern: ["northern", "northern borders", "northern border", "northern region", "al hudud ash shamaliyah", "hudud ash shamaliyah", "الحدود الشمالية"],
};

const ALIAS_INDEX: Map<string, KsaRegionId> = new Map();
for (const [id, names] of Object.entries(ALIASES) as [KsaRegionId, string[]][]) {
  ALIAS_INDEX.set(id, id); // the canonical id itself resolves
  for (const n of names) ALIAS_INDEX.set(normalizeName(n), id);
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^['`]+/, "")
    .replace(/\b(region|province|منطقة|إمارة)\b/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Resolve a seeded/free-text region name to a canonical id, or null. */
export function resolveRegionId(name: string | null | undefined): KsaRegionId | null {
  if (!name) return null;
  return ALIAS_INDEX.get(normalizeName(name)) ?? ALIAS_INDEX.get(name.toLowerCase()) ?? null;
}
