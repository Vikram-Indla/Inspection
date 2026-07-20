// KSA 3D atlas — deterministic geometry foundation (no rendering here).
// Feeds the react-three-fiber scene: real country outline (loaded from the
// existing /geo/sau.geo.json), 13 illustrative regions keyed to the admin
// capitals, and winding inspection routes as Catmull-Rom control paths.
//
// The login atlas is an ILLUSTRATIVE storytelling surface (per contract), not
// operational GIS: regions colour the landmass by nearest capital and carry no
// live compliance meaning. Status tones use the DS 10-role semantics only for
// visual differentiation.

export type StatusRole =
  | "compliant" | "warning" | "critical" | "info" | "pending"
  | "major" | "onhold" | "completed" | "draft" | "disabled";

export type GeoPoint = { lat: number; lng: number };

export type Region = {
  id: string;
  en: string;
  ar: string;
  capital: GeoPoint;
  status: StatusRole;         // illustrative tone, not live data
};

// The 13 administrative regions of Saudi Arabia, by capital. Coordinates are
// the region capitals; the mesh assigns each land face to its nearest capital
// so the whole landmass tiles into 13 readable areas with no gaps.
export const REGIONS: Region[] = [
  { id: "riyadh",   en: "Riyadh",            ar: "الرياض",          capital: { lat: 24.71, lng: 46.68 }, status: "compliant" },
  { id: "makkah",   en: "Makkah",            ar: "مكة المكرمة",     capital: { lat: 21.39, lng: 39.86 }, status: "warning" },
  { id: "madinah",  en: "Madinah",           ar: "المدينة المنورة", capital: { lat: 24.47, lng: 39.61 }, status: "compliant" },
  { id: "eastern",  en: "Eastern Province",  ar: "المنطقة الشرقية", capital: { lat: 26.43, lng: 50.10 }, status: "critical" },
  { id: "asir",     en: "Asir",              ar: "عسير",            capital: { lat: 18.22, lng: 42.51 }, status: "info" },
  { id: "tabuk",    en: "Tabuk",             ar: "تبوك",            capital: { lat: 28.38, lng: 36.57 }, status: "compliant" },
  { id: "hail",     en: "Ha'il",             ar: "حائل",            capital: { lat: 27.52, lng: 41.69 }, status: "pending" },
  { id: "northern", en: "Northern Borders",  ar: "الحدود الشمالية", capital: { lat: 30.98, lng: 41.02 }, status: "info" },
  { id: "jazan",    en: "Jazan",             ar: "جازان",           capital: { lat: 16.89, lng: 42.55 }, status: "warning" },
  { id: "najran",   en: "Najran",            ar: "نجران",           capital: { lat: 17.49, lng: 44.13 }, status: "compliant" },
  { id: "bahah",    en: "Al Bahah",          ar: "الباحة",          capital: { lat: 20.01, lng: 41.47 }, status: "completed" },
  { id: "jawf",     en: "Al Jawf",           ar: "الجوف",           capital: { lat: 29.97, lng: 40.21 }, status: "onhold" },
  { id: "qassim",   en: "Qassim",            ar: "القصيم",          capital: { lat: 26.33, lng: 43.97 }, status: "compliant" },
];

// Industrial facilities placed on the atlas (illustrative). Each renders as a
// low-poly structure tinted by status — materially distinct from the sand.
export type Facility = {
  id: string;
  en: string; ar: string;
  at: GeoPoint;
  kind: "refinery" | "plant" | "port" | "tower";
  status: StatusRole;
};

export const FACILITIES: Facility[] = [
  { id: "jubail",  en: "Jubail industrial",  ar: "الجبيل الصناعية",  at: { lat: 27.01, lng: 49.66 }, kind: "refinery", status: "critical" },
  { id: "dammam",  en: "Dammam works",       ar: "أعمال الدمام",     at: { lat: 26.43, lng: 50.10 }, kind: "port",     status: "warning" },
  { id: "riyadh",  en: "Riyadh cluster",     ar: "مجمع الرياض",      at: { lat: 24.71, lng: 46.68 }, kind: "tower",    status: "compliant" },
  { id: "yanbu",   en: "Yanbu terminal",     ar: "محطة ينبع",        at: { lat: 24.09, lng: 38.06 }, kind: "refinery", status: "compliant" },
  { id: "jeddah",  en: "Jeddah port",        ar: "ميناء جدة",        at: { lat: 21.49, lng: 39.19 }, kind: "port",     status: "info" },
  { id: "jazan",   en: "Jazan complex",      ar: "مجمع جازان",       at: { lat: 16.89, lng: 42.55 }, kind: "plant",    status: "warning" },
  { id: "qassim",  en: "Qassim plant",       ar: "مصنع القصيم",      at: { lat: 26.33, lng: 43.97 }, kind: "plant",    status: "compliant" },
  { id: "hail",    en: "Ha'il works",        ar: "أعمال حائل",       at: { lat: 27.52, lng: 41.69 }, kind: "plant",    status: "pending" },
];

// Winding inspection routes — Catmull-Rom control points (NOT straight lines).
// Deliberate off-axis waypoints give each route an organic, road-like curve.
export type Route = { id: string; status: StatusRole; points: GeoPoint[] };

export const ROUTES: Route[] = [
  {
    id: "riyadh-jubail", status: "critical",
    points: [
      { lat: 24.71, lng: 46.68 }, // Riyadh
      { lat: 25.60, lng: 47.70 }, // swing north-east
      { lat: 25.90, lng: 49.10 }, // dip toward the coast road
      { lat: 26.55, lng: 49.20 },
      { lat: 27.01, lng: 49.66 }, // Jubail
    ],
  },
  {
    id: "riyadh-jazan", status: "warning",
    points: [
      { lat: 24.71, lng: 46.68 }, // Riyadh
      { lat: 22.90, lng: 45.10 }, // curve south-west
      { lat: 20.60, lng: 43.30 },
      { lat: 18.60, lng: 42.90 }, // via the Asir highlands
      { lat: 16.89, lng: 42.55 }, // Jazan
    ],
  },
  {
    id: "qassim-tabuk", status: "info",
    points: [
      { lat: 26.33, lng: 43.97 }, // Buraydah / Qassim
      { lat: 27.40, lng: 42.10 }, // arc through Ha'il
      { lat: 27.90, lng: 39.60 },
      { lat: 28.20, lng: 37.80 },
      { lat: 28.38, lng: 36.57 }, // Tabuk
    ],
  },
];

// ─── projection ──────────────────────────────────────────────────────────
// Geographic lat/lng → scene XZ plane (metres-ish, centred on KSA). Y is up
// (relief); the scene tilts/orbits this plane. Longitude → X, latitude → Z
// (north = −Z). An equirectangular projection is fine at this scale and keeps
// the outline, regions, facilities and routes in one coordinate space.
export const KSA_CENTER: GeoPoint = { lat: 23.9, lng: 45.0 };
const SCALE = 1; // 1 unit ≈ 1° ; the scene camera frames it.
const LNG_COS = Math.cos((KSA_CENTER.lat * Math.PI) / 180);

export function project(p: GeoPoint): [number, number] {
  const x = (p.lng - KSA_CENTER.lng) * SCALE * LNG_COS;
  const z = -(p.lat - KSA_CENTER.lat) * SCALE;
  return [x, z];
}

// Nearest region for a projected land point (region tiling by capital).
export function nearestRegionIndex(x: number, z: number): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < REGIONS.length; i++) {
    const [rx, rz] = project(REGIONS[i].capital);
    const d = (rx - x) * (rx - x) + (rz - z) * (rz - z);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// Load the real KSA outline ring (lng,lat pairs) from the bundled GeoJSON.
// Returns the exterior ring as projected [x,z] points for the terrain shape.
export async function loadOutline(signal?: AbortSignal): Promise<[number, number][]> {
  const res = await fetch("/geo/sau.geo.json", { signal });
  const gj = await res.json();
  const feat = gj.features?.[0];
  const geom = feat?.geometry;
  const ring: [number, number][] =
    geom?.type === "Polygon" ? geom.coordinates[0]
    : geom?.type === "MultiPolygon" ? geom.coordinates[0][0]
    : [];
  return ring.map(([lng, lat]: [number, number]) => project({ lat, lng }));
}
