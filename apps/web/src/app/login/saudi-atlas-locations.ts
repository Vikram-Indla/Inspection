// CD-001 V7 Atlas — public anchor + sample-journey data.
// Coordinates identify public industrial-city or civic-orientation locations.
// Official-source confirmation is tracked as P1 in
// SAUDI_ATLAS_REFERENCE_REGISTER_CD001.csv; do not describe them as verified
// until that register is completed.
// NOTHING here is a customer factory or an operational metric — the six
// lifecycle states and per-node "sample state" are ILLUSTRATIVE only
// (CD001_RUNTIME_ATLAS_CONTRACT Layer 5 / FORBIDDEN list). Labels are carried
// EN/AR inline because these are sample geographic captions, not localizable
// ui_strings owned by the localization module.

export type Bi = { en: string; ar: string };

// Halo tone → token (Layer 3 palette; NO red on the public surface):
//   arrival = success (green) · planned = warning (amber)
//   virtual = info (cyan)     · route/decision = primary (violet)
export type HaloTone = "arrival" | "planned" | "virtual" | "route";

// Original transparent-structure glyphs (flat Layer-2 fallback shipped in the
// reserved slots until the design-owned WebP renders land — see asset register,
// production_status = DESIGN CONCEPT — PENDING).
export type StructGlyph =
  | "process" | "refining" | "metals" | "pharma" | "fabrication"
  | "packaging" | "food" | "mfg" | "logistics";

export type AtlasNode = {
  id: string;
  lat: number;
  lng: number;
  name: Bi;
  industry: Bi;
  sampleState: Bi; // illustrative lifecycle caption only
  halo: HaloTone;
  glyph: StructGlyph;
  // Intended production asset (ATL3D-*, WebP+AVIF, transparent, fixed dims).
  // Absent today → <img> onerror degrades to the flat glyph in the same slot
  // (no layout shift; the documented image-failure mode).
  asset: { src: string; w: number; h: number };
  orientationAnchor?: boolean; // Riyadh carries the Kingdom Centre silhouette
  // Layout hints to declutter the dense Eastern cluster (illustrative only —
  // coordinates stay verified; only the label side / render size change).
  labelPos?: "below" | "above" | "right" | "left";
  compact?: boolean;
};

const A = "/brand/saudi-atlas";

// Nine public industrial-city anchors. Positions only — never risk,
// compliance, overdue, workload or inspector data.
export const NODES: AtlasNode[] = [
  { id: "jubail", lat: 27.00, lng: 49.66, halo: "arrival", glyph: "process", labelPos: "right",
    name: { en: "JUBAIL", ar: "الجبيل" },
    industry: { en: "Petrochemical / process", ar: "بتروكيماويات ومعالجة" },
    sampleState: { en: "Arrival stage", ar: "مرحلة الوصول" },
    asset: { src: `${A}/jubail-process.webp`, w: 320, h: 240 } },
  { id: "riyadh", lat: 24.63, lng: 46.85, halo: "planned", glyph: "pharma", orientationAnchor: true,
    name: { en: "RIYADH", ar: "الرياض" },
    industry: { en: "Pharma / clean assembly", ar: "أدوية وتجميع نظيف" },
    sampleState: { en: "Planned visit", ar: "زيارة مخطَّطة" },
    asset: { src: `${A}/riyadh-pharma.webp`, w: 280, h: 210 } },
  { id: "yanbu", lat: 24.02, lng: 38.19, halo: "arrival", glyph: "refining",
    name: { en: "YANBU", ar: "ينبع" },
    industry: { en: "Refining / port-linked", ar: "تكرير ومرتبط بالميناء" },
    sampleState: { en: "Inspection stage", ar: "مرحلة التفتيش" },
    asset: { src: `${A}/yanbu-refining.webp`, w: 280, h: 210 } },
  { id: "ras-al-khair", lat: 27.52, lng: 49.20, halo: "route", glyph: "metals", labelPos: "above", compact: true,
    name: { en: "RAS AL-KHAIR", ar: "رأس الخير" },
    industry: { en: "Mining / metals", ar: "تعدين ومعادن" },
    sampleState: { en: "Review stage", ar: "مرحلة المراجعة" },
    asset: { src: `${A}/rak-metals.webp`, w: 280, h: 210 } },
  { id: "dammam", lat: 26.35, lng: 49.98, halo: "planned", glyph: "fabrication", compact: true,
    name: { en: "DAMMAM", ar: "الدمام" },
    industry: { en: "Fabrication / heavy mfg", ar: "تصنيع ثقيل" },
    sampleState: { en: "Planned visit", ar: "زيارة مخطَّطة" },
    asset: { src: `${A}/dammam-fabrication.webp`, w: 260, h: 200 } },
  { id: "jeddah", lat: 21.36, lng: 39.27, halo: "virtual", glyph: "packaging",
    name: { en: "JEDDAH", ar: "جدة" },
    industry: { en: "Food / packaging", ar: "أغذية وتعبئة" },
    sampleState: { en: "Virtual inspection", ar: "تفتيش افتراضي" },
    asset: { src: `${A}/jeddah-food.webp`, w: 280, h: 210 } },
  { id: "qassim", lat: 26.30, lng: 43.77, halo: "planned", glyph: "food",
    name: { en: "QASSIM", ar: "القصيم" },
    industry: { en: "Food production", ar: "إنتاج غذائي" },
    sampleState: { en: "Planned visit", ar: "زيارة مخطَّطة" },
    asset: { src: `${A}/qassim-food.webp`, w: 240, h: 180 } },
  { id: "hail", lat: 27.44, lng: 41.69, halo: "planned", glyph: "mfg",
    name: { en: "HA'IL", ar: "حائل" },
    industry: { en: "Regional manufacturing", ar: "تصنيع إقليمي" },
    sampleState: { en: "Planned visit", ar: "زيارة مخطَّطة" },
    asset: { src: `${A}/hail-mfg.webp`, w: 220, h: 170 } },
  { id: "jazan", lat: 16.89, lng: 42.62, halo: "route", glyph: "logistics",
    name: { en: "JAZAN", ar: "جازان" },
    industry: { en: "Downstream / logistics", ar: "صناعات تحويلية ولوجستيات" },
    sampleState: { en: "Transit stage", ar: "مرحلة النقل" },
    asset: { src: `${A}/jazan-logistics.webp`, w: 240, h: 180 } },
];

// Civic orientation labels (non-industrial reference points, spread for
// spatial context). No religious landmarks (contract Layer-5 reject list).
export const ORIENTATION_CITIES: { lat: number; lng: number; name: Bi }[] = [
  { lat: 28.38, lng: 36.57, name: { en: "Tabuk", ar: "تبوك" } },
  { lat: 30.98, lng: 41.02, name: { en: "Arar", ar: "عرعر" } },
  { lat: 29.97, lng: 40.21, name: { en: "Sakaka", ar: "سكاكا" } },
  { lat: 24.47, lng: 39.61, name: { en: "Al-Madinah", ar: "المدينة المنورة" } },
  { lat: 21.42, lng: 39.83, name: { en: "Makkah", ar: "مكة المكرمة" } },
  { lat: 25.38, lng: 49.59, name: { en: "Al-Ahsa", ar: "الأحساء" } },
  { lat: 18.22, lng: 42.51, name: { en: "Abha", ar: "أبها" } },
  { lat: 17.49, lng: 44.13, name: { en: "Najran", ar: "نجران" } },
];

// The single illustrative journey the 14s loop tells: PLAN in Riyadh →
// TRAVEL the dashed route → ARRIVE at the Jubail geofence → INSPECT → REVIEW →
// DECIDE. Reused from the accepted V4 story path.
export const JOURNEY = {
  plan: [24.63, 46.85] as [number, number],
  route: [[24.63, 46.85], [25.35, 47.75], [26.25, 48.85], [27.00, 49.66]] as [number, number][],
  inspector: [26.25, 48.85] as [number, number],
  arrive: [27.00, 49.66] as [number, number],
  geofenceRadiusM: 42000,
};

// Six illustrative lifecycle stages driving the overlays / tablist.
export const STAGE_ORDER = ["plan", "travel", "arrive", "inspect", "review", "decide"] as const;
export type AtlasStageId = (typeof STAGE_ORDER)[number];

// Public login choreography. This five-scene order is intentionally simpler
// than the authenticated six-step workflow: it reveals one visual concept at
// a time and never implies that the illustrative markers are live data.
export const STORY_SCENE_ORDER = ["plan", "arrive", "travel", "inspect", "decide"] as const;

export function haloToken(t: HaloTone): string {
  switch (t) {
    case "arrival": return "--ax-color-success";
    case "planned": return "--ax-color-warning";
    case "virtual": return "--ax-color-info";
    case "route": return "--ax-color-primary";
  }
}
