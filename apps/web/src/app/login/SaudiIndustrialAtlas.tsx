"use client";
// CD-001 V7 Atlas — LAYERS 2–4 over the real Layer-1 map (StoryMapInner).
//   L2  3D visual assets: terrain relief slab (inline SVG overlay) + per-node
//       structures. Structures try the design-owned WebP (asset register,
//       PRODUCTION ASSET PENDING) and degrade to an original flat glyph in the
//       SAME reserved slot on error — no layout shift, the documented failure
//       mode. Storytelling only; never authoritative.
//   L3  inspection overlays: tone halos, the sample route, geofence, actors,
//       evidence / review / decision cues — all ILLUSTRATIVE, no red states.
//   L4  interaction: markers are tabbable role=button; hover/focus opens a
//       dossier, click/tap locks it, Esc returns focus. One dossier at a time;
//       while one is open the caller pauses the motion loop.
// The 14s timeline + the six-stage tablist live in StoryPanel (single source
// of stage truth); this component renders whatever `activeStage` it is given.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import L from "leaflet";
import StoryMapInner, { ATLAS_BOUNDS, type AtlasMapContext } from "./StoryMapInner";
import {
  NODES, JOURNEY, STAGE_ORDER,
  type AtlasNode, type AtlasStageId,
} from "./saudi-atlas-locations";
import { buildStructure } from "./saudi-atlas-structures";
import SaudiAtlasDossier, { type DossierStrings } from "./SaudiAtlasDossier";

// Uniform factory footprint — small enough to shrink-to-fit the dense Eastern
// cluster without clipping; matches the 140×112 structure viewBox aspect.
const FACTORY_W = 58, FACTORY_H = 46;
const PUBLIC_SAFE_ATLAS_BASE = "/brand/saudi-atlas/inspection-atlas-scene-base-v2";

// Normalized positions over the approved 1672×941 public-safe composition.
// They are interaction anchors only; the visible geography remains in the
// approved raster and the dossier/list carry the accessible information.
const IMAGE_POSITIONS: Record<string, { x: number; y: number }> = {
  hail: { x: 39.0, y: 17.5 },
  qassim: { x: 43.5, y: 32.0 },
  "ras-al-khair": { x: 65.3, y: 14.0 },
  jubail: { x: 73.7, y: 32.5 },
  dammam: { x: 64.2, y: 35.5 },
  riyadh: { x: 50.8, y: 47.0 },
  yanbu: { x: 22.0, y: 42.0 },
  jeddah: { x: 20.5, y: 68.0 },
  jazan: { x: 44.0, y: 78.5 },
};

type AtlasZoneId = "north" | "west" | "central" | "east" | "south";

// Decorative lift surfaces follow the visible atlas composition only. They
// are deliberately not exported as GIS geometry and never carry operational
// counts or compliance meaning. The real geographic/data views remain behind
// authentication.
// Traced against the public-safe atlas raster (viewBox 1000×563) so each slab
// lifts a real slice of terrain framing that region's facility cluster and
// leaves its cavity on land, never over open sea.
// Zones TILE the whole landmass with shared borders (a central hub plus four
// surrounding regions) so hovering anywhere on land lifts the region it falls
// in — no dead gaps between slabs. Traced against the public-safe raster.
const ZONE_SURFACES: { id: AtlasZoneId; path: string; outcome: "complete" | "follow-up" }[] = [
  { id: "north", outcome: "follow-up", path: "M180 150 L250 65 L480 55 L610 120 L600 220 L385 185 Z" },
  { id: "east", outcome: "follow-up", path: "M610 120 L730 180 L870 300 L760 410 L590 370 L600 220 Z" },
  { id: "central", outcome: "complete", path: "M385 185 L600 220 L590 370 L400 350 Z" },
  { id: "south", outcome: "complete", path: "M400 350 L590 370 L760 410 L560 515 L350 500 Z" },
  { id: "west", outcome: "complete", path: "M180 150 L385 185 L400 350 L350 500 L250 430 L140 290 Z" },
];

const INSPECTOR_SCENE_POSITIONS = [
  { x: 41.5, y: 15.5, asset: "inspector-character-v2-03.png" },
  { x: 22, y: 38.5, asset: "inspector-character-v2-02.png" },
  { x: 50.8, y: 42.5, asset: "inspector-character-v2-01.png" },
  { x: 73.7, y: 28.5, asset: "inspector-character-v2-01.png" },
  { x: 44, y: 74.5, asset: "inspector-character-v2-03.png" },
];

// Three actual inspection journeys. Two deploy from the Riyadh command hub;
// the third starts in Jazan. Every car has a distinct, readable destination.
const DISPATCH_ROUTES = [
  { id: "riyadh-jubail", path: "M508 265 C573 249 663 211 737 183", start: [508, 265], end: [737, 183] },
  { id: "riyadh-yanbu", path: "M508 265 C429 247 321 224 220 236", start: [508, 265], end: [220, 236] },
  { id: "jazan-jeddah", path: "M440 442 C371 429 274 404 205 383", start: [440, 442], end: [205, 383] },
];

const OUTCOME_POSITIONS = [
  { x: 73.7, y: 32.5, result: "failed" },
  { x: 22, y: 42, result: "passed" },
  { x: 44, y: 78.5, result: "passed" },
] as const;

const ZONE_INTELLIGENCE: Record<AtlasZoneId, {
  x: number; y: number; en: string; ar: string; inspections: string; compliance: string; action: string;
}> = {
  north: { x: 42, y: 8, en: "Northern zone", ar: "المنطقة الشمالية", inspections: "264 inspections", compliance: "91% compliant", action: "18 follow-ups" },
  west: { x: 17, y: 30, en: "Western zone", ar: "المنطقة الغربية", inspections: "247 inspections", compliance: "89% compliant", action: "12 follow-ups" },
  central: { x: 52, y: 20, en: "Central zone", ar: "المنطقة الوسطى", inspections: "221 inspections", compliance: "92% compliant", action: "9 follow-ups" },
  east: { x: 78, y: 24, en: "Eastern zone", ar: "المنطقة الشرقية", inspections: "318 inspections", compliance: "90% compliant", action: "21 follow-ups" },
  south: { x: 56, y: 62, en: "Southern zone", ar: "المنطقة الجنوبية", inspections: "198 inspections", compliance: "89% compliant", action: "14 follow-ups" },
};

function stageZone(stage: AtlasStageId): AtlasZoneId {
  return stage === "plan" || stage === "decide" ? "central" : "east";
}

function JourneyOverlay({ stage, locale }: { stage: AtlasStageId; locale: "ar" | "en" }) {
  const copy = locale === "ar" ? {
    passed: "ناجح", failed: "لم يجتز",
  } : {
    passed: "Passed", failed: "Failed",
  };
  return (
    <div className="lg-atlas-motion" data-stage={stage} aria-hidden="true">
      <svg className="lg-atlas-motion__zones" viewBox="0 0 1000 563" preserveAspectRatio="none">
        {ZONE_SURFACES.map((zone, index) => (
          <path key={zone.id} d={zone.path} data-zone={zone.id} data-outcome={zone.outcome}
            style={{ "--zone-order": index } as CSSProperties} />
        ))}
      </svg>

      <svg key={stage} className="lg-atlas-motion__route" viewBox="0 0 1000 563" preserveAspectRatio="none">
        {DISPATCH_ROUTES.map((route, index) => (
          <path key={route.id} className="lg-atlas-motion__route-line" data-route={route.id}
            d={route.path} />
        ))}
        {stage === "travel" && DISPATCH_ROUTES.map(route => (
          <g key={`stops-${route.id}`} className="lg-atlas-motion__route-stops">
            <circle cx={route.start[0]} cy={route.start[1]} r="4" />
            <circle cx={route.end[0]} cy={route.end[1]} r="4" />
          </g>
        ))}
        {stage === "travel" && DISPATCH_ROUTES.map((route, index) => (
          <image key={`vehicle-${route.id}`} className="lg-atlas-motion__route-vehicle"
            href="/brand/saudi-atlas/inspection-suv-topdown-v1.png" x="-9" y="-18" width="18" height="36" opacity="0" transform="rotate(90)">
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1"
              dur="11s" begin={`${index * 5}s`} fill="remove" />
            <animateMotion path={route.path} rotate="auto" dur="11s" begin={`${index * 5}s`} fill="remove"
              calcMode="spline" keyTimes="0;1" keySplines="0.32 0.05 0.2 1" />
          </image>
        ))}
      </svg>

      <div className="lg-atlas-motion__inspectors">
        {INSPECTOR_SCENE_POSITIONS.map((position, index) => (
          <span key={index} className="lg-atlas-motion__inspector"
            style={{ left: `${position.x}%`, top: `${position.y}%`, "--actor-delay": `${index * .65}s` } as CSSProperties}>
            <img src={`/brand/saudi-atlas/${position.asset}`} alt="" draggable={false} />
          </span>
        ))}
      </div>

      <div className="lg-atlas-motion__outcomes">
        {OUTCOME_POSITIONS.map((outcome, index) => (
          <span key={index} className={`lg-atlas-motion__outcome lg-atlas-motion__outcome--${outcome.result}`}
            style={{ left: `${outcome.x}%`, top: `${outcome.y}%`, "--actor-delay": `${index * .65}s` } as CSSProperties}>
            <b aria-hidden="true">{outcome.result === "passed" ? "✓" : "×"}</b>
            <span>{copy[outcome.result]}</span>
          </span>
        ))}
      </div>

    </div>
  );
}

function ZoneLiftOverlay({
  locale, activeZone, lockedZone, onHover, onLock, onClose,
}: {
  locale: "ar" | "en";
  activeZone: AtlasZoneId | null;
  lockedZone: AtlasZoneId | null;
  onHover: (zone: AtlasZoneId | null) => void;
  onLock: (zone: AtlasZoneId) => void;
  onClose: () => void;
}) {
  const stat = activeZone ? ZONE_INTELLIGENCE[activeZone] : null;
  const zoneLabel = (zone: AtlasZoneId) => {
    const z = ZONE_INTELLIGENCE[zone];
    return locale === "ar"
      ? `${z.ar}: ${z.inspections}، ${z.compliance}، ${z.action}. اضغط لتثبيت عرض التضاريس.`
      : `${z.en}: ${z.inspections}, ${z.compliance}, ${z.action}. Press to lock this terrain view.`;
  };
  return (
    <div className={`lg-zone-lift${activeZone ? " is-engaged" : ""}`} role="group"
      aria-label={locale === "ar" ? "ذكاء التفتيش الإقليمي" : "Regional inspection intelligence"}>
      <svg className="lg-zone-lift__svg" viewBox="0 0 1000 563" preserveAspectRatio="none">
        <defs>
          {ZONE_SURFACES.map(zone => (
            <clipPath key={zone.id} id={`lg-zclip-${zone.id}`} clipPathUnits="userSpaceOnUse">
              <path d={zone.path} />
            </clipPath>
          ))}
        </defs>
        {ZONE_SURFACES.map(zone => {
          const isActive = activeZone === zone.id;
          // The lifted slab is a REAL clip of the public-safe atlas raster, so
          // the terrain, factories and lights inside the zone physically rise
          // together. The opaque cavity underneath is what the removed slab
          // leaves behind; the darkened wall copy is the exposed earth sidewall.
          return (
            <g key={zone.id} data-zone={zone.id} data-lifted={isActive || undefined}
              className={`lg-zone-lift__slab${isActive ? " is-lifted" : ""}`}>
              <path className="lg-zone-lift__cavity" d={zone.path} aria-hidden="true" />
              <g className="lg-zone-lift__wall" clipPath={`url(#lg-zclip-${zone.id})`} aria-hidden="true">
                <image href={`${PUBLIC_SAFE_ATLAS_BASE}.png`} x="0" y="0" width="1000" height="563" preserveAspectRatio="none" />
              </g>
              <g className="lg-zone-lift__terrain" clipPath={`url(#lg-zclip-${zone.id})`} aria-hidden="true">
                <image href={`${PUBLIC_SAFE_ATLAS_BASE}.png`} x="0" y="0" width="1000" height="563" preserveAspectRatio="none" />
              </g>
              {/* Keyboard + pointer target. Focus lifts the slab (same info as
                  hover); Enter/Space locks it; Escape restores the resting map. */}
              <path className="lg-zone-lift__edge" d={zone.path} data-zone={zone.id}
                tabIndex={0} role="button" aria-pressed={lockedZone === zone.id}
                aria-label={zoneLabel(zone.id)}
                onPointerEnter={() => onHover(zone.id)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(zone.id)}
                onBlur={() => onHover(null)}
                onClick={() => onLock(zone.id)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLock(zone.id); }
                  else if (e.key === "Escape") { e.preventDefault(); onClose(); (e.currentTarget as SVGPathElement).blur(); }
                }} />
            </g>
          );
        })}
      </svg>
      {stat && <section className="lg-zone-lift__readout" style={{ left: `${stat.x}%`, top: `${stat.y}%` }} dir={locale === "ar" ? "rtl" : "ltr"}>
        <span className="lg-zone-lift__eyebrow">{locale === "ar" ? "ذكاء التفتيش الإقليمي" : "REGIONAL INSPECTION INTELLIGENCE"}</span>
        <strong>{stat[locale]}</strong>
        <div><b>{stat.inspections}</b><span>{stat.compliance}</span><em>{stat.action}</em></div>
        <small>{locale === "ar" ? "انقر لتثبيت المنطقة" : "Click to lock this terrain view"}</small>
      </section>}
    </div>
  );
}

// Zone labels rendered in the active locale over a LABEL-FREE base render.
// EN + AR both live in the DOM so no map text is ever baked into the raster.
const ZONES: { en: string; ar: string; x: number; y: number }[] = [
  { en: "NORTHERN ZONE", ar: "المنطقة الشمالية", x: 32, y: 11 },
  { en: "WESTERN ZONE", ar: "المنطقة الغربية", x: 18, y: 27 },
  { en: "CENTRAL ZONE", ar: "المنطقة الوسطى", x: 39, y: 45 },
  { en: "EASTERN ZONE", ar: "المنطقة الشرقية", x: 72, y: 51 },
  { en: "SOUTHERN ZONE", ar: "المنطقة الجنوبية", x: 51, y: 74 },
];

const INSPECTOR_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="6" r="3.2"/><path d="M6 22v-5a6 6 0 0 1 12 0v5Z"/></svg>';
const VEHICLE_SVG = '<svg viewBox="0 0 24 24" width="18" height="12" fill="currentColor"><path d="M2 14V9l4-4h10l3 4h3v5Z"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg>';
const EVIDENCE_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l4 4 10-10"/></svg>';
const SEAL_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>';

// Linear projection of geo → the terrain SVG viewBox (overlay is stretched to
// ATLAS_BOUNDS with preserveAspectRatio=none, so the mapping stays exact).
function terrainSvg(rings: [number, number][][]): SVGSVGElement {
  const [[latMin, lngMin], [latMax, lngMax]] = ATLAS_BOUNDS as [[number, number], [number, number]];
  const VB = 1000;
  const px = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * VB;
  const py = (lat: number) => ((latMax - lat) / (latMax - latMin)) * VB;
  const d = rings
    .map(r => "M" + r.map(([lat, lng]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join("L") + "Z")
    .join(" ");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${VB} ${VB}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", "lg-atlas3d__terrain");
  svg.innerHTML =
    `<path class="lg-atlas3d__terrain-shadow" d="${d}"/>` +
    `<path class="lg-atlas3d__terrain-top" d="${d}"/>`;
  return svg;
}

type Journey = {
  route: L.Polyline;
  els: { vehicle: HTMLElement; inspector: HTMLElement; geofence: HTMLElement;
         evidence: HTMLElement[]; review: HTMLElement; seal: HTMLElement };
};

function divMarker(target: L.LayerGroup, at: L.LatLngExpression, html: string, cls = ""): HTMLElement {
  const m = L.marker(at, { icon: L.divIcon({ className: cls, html, iconSize: [0, 0] }), interactive: false, keyboard: false });
  m.addTo(target);
  return m.getElement()!.firstElementChild as HTMLElement;
}

function GeneratedAtlasFallback({
  locale, activeStage, dossierStrings, onInteractingChange, onFail,
}: {
  locale: "ar" | "en";
  activeStage: AtlasStageId;
  dossierStrings: DossierStrings;
  onInteractingChange: (interacting: boolean) => void;
  onFail: () => void;
}) {
  const [hover, setHover] = useState<AtlasNode | null>(null);
  const [locked, setLocked] = useState<AtlasNode | null>(null);
  const shown = locked ?? hover;

  const group = useRef<L.LayerGroup | null>(null);
  const journey = useRef<Journey | null>(null);
  const markerEls = useRef<Map<string, HTMLElement>>(new Map());
  const stageRef = useRef<AtlasStageId>(activeStage);
  stageRef.current = activeStage;

  // Report interaction (dossier open OR a marker holding hover/focus) so the
  // caller can pause the motion loop.
  useEffect(() => { onInteractingChange(shown !== null); }, [shown, onInteractingChange]);

  const closeLocked = useCallback(() => {
    const id = locked?.id;
    setLocked(null);
    if (id) requestAnimationFrame(() => markerEls.current.get(id)?.focus());
  }, [locked]);

  // Show/hide the journey overlays for a stage index (0..5).
  const applyStage = useCallback((stage: AtlasStageId) => {
    const j = journey.current; if (!j) return;
    const i = STAGE_ORDER.indexOf(stage);
    j.route.setStyle({ opacity: i >= 1 ? 0.9 : 0 });
    const on = (el: HTMLElement, cond: boolean) => el.classList.toggle("is-on", cond);
    on(j.els.vehicle, i >= 1 && i <= 2);
    const enteringArrive = i >= 2 && !j.els.geofence.classList.contains("is-on");
    on(j.els.geofence, i >= 2);
    if (enteringArrive) {
      j.els.geofence.classList.remove("pulse");
      // reflow so the one-shot pulse can replay on each arrival
      void j.els.geofence.offsetWidth;
      j.els.geofence.classList.add("pulse");
    }
    on(j.els.inspector, i >= 2);
    j.els.evidence.forEach(e => on(e, i >= 3));
    on(j.els.review, i >= 4);
    on(j.els.seal, i >= 5);
  }, []);

  const buildLayers = useCallback((ctx: AtlasMapContext) => {
    const { map, rings } = ctx;
    if (!group.current) group.current = L.layerGroup().addTo(map);
    else { group.current.clearLayers(); group.current.addTo(map); }
    const g = group.current;
    markerEls.current.clear();

    // L2 — terrain relief slab
    L.svgOverlay(terrainSvg(rings), ATLAS_BOUNDS, { interactive: false, opacity: 1 }).addTo(g);

    // L3 — subtle connection network (illustrative spokes from the Riyadh hub)
    const hub = NODES.find(n => n.id === "riyadh");
    if (hub) NODES.forEach(n => {
      if (n.id === hub.id) return;
      L.polyline([[hub.lat, hub.lng], [n.lat, n.lng]], {
        className: "lg-atlas3d__net", color: `var(--ax-color-primary)`,
        weight: 1, opacity: 0.26, interactive: false,
      }).addTo(g);
    });

    // L2/L4 — node structures (interactive)
    NODES.forEach(n => {
      const w = n.compact ? 40 : FACTORY_W, h = n.compact ? 32 : FACTORY_H;
      const html =
        `<div class="lg-atlas3d__node lg-atlas3d__node--${n.halo}" style="--nw:${w}px;--nh:${h}px">
           <span class="lg-atlas3d__halo" aria-hidden="true"></span>
           <span class="lg-atlas3d__struct" aria-hidden="true">
             <span class="lg-atlas3d__struct-flat">${buildStructure(n.glyph)}</span>
             <img class="lg-atlas3d__struct-img" src="${n.asset.src}" width="${w}" height="${h}" alt="" loading="lazy"
                  onload="this.style.opacity=1" onerror="this.remove()"/>
             ${n.orientationAnchor ? '<span class="lg-atlas3d__anchor" aria-hidden="true"></span>' : ""}
           </span>
           <span class="lg-atlas3d__node-base" aria-hidden="true"></span>
           <span class="lg-atlas3d__node-label lg-atlas3d__node-label--${locale} lg-atlas3d__node-label--${n.labelPos ?? "below"}">${n.name[locale]}</span>
         </div>`;
      const marker = L.marker([n.lat, n.lng], {
        icon: L.divIcon({ className: "", html, iconSize: [0, 0] }),
        interactive: true, keyboard: false, riseOnHover: true,
      }).addTo(g);

      const el = marker.getElement();
      if (!el) return;
      const inner = el.firstElementChild as HTMLElement;
      inner.tabIndex = 0;
      inner.setAttribute("role", "button");
      inner.setAttribute("aria-label",
        `${n.name[locale]}, ${n.industry[locale]}. ${n.sampleState[locale]}`);
      markerEls.current.set(n.id, inner);

      const open = () => setHover(n);
      const clear = () => setHover(h => (h?.id === n.id ? null : h));
      inner.addEventListener("mouseenter", open);
      inner.addEventListener("mouseleave", clear);
      inner.addEventListener("focus", open);
      inner.addEventListener("blur", clear);
      inner.addEventListener("click", () => setLocked(n));
      inner.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocked(n); }
        if (e.key === "Escape") { setLocked(null); inner.blur(); }
      });
    });

    // L3 — the illustrative journey (Riyadh → Jubail)
    const route = L.polyline(JOURNEY.route, {
      className: "lg-atlas3d__route", color: `var(--ax-color-primary)`,
      weight: 2.5, opacity: 0, dashArray: "7 9", interactive: false,
    }).addTo(g);

    const vehicle = divMarker(g, JOURNEY.inspector, `<span class="lg-atlas3d__vehicle">${VEHICLE_SVG}</span>`);
    const inspector = divMarker(g, JOURNEY.arrive, `<span class="lg-atlas3d__actor">${INSPECTOR_SVG}</span>`);
    const geofence = divMarker(g, JOURNEY.arrive,
      `<span class="lg-atlas3d__geofence" style="--fence-r:${Math.round(JOURNEY.geofenceRadiusM / 900)}px"></span>`);

    const ev = (dLat: number, dLng: number) => divMarker(g,
      [JOURNEY.arrive[0] + dLat, JOURNEY.arrive[1] + dLng],
      `<span class="lg-atlas3d__evidence">${EVIDENCE_SVG}</span>`);
    const evidence = [ev(0.35, -0.35), ev(-0.3, 0.3)];

    const review = divMarker(g, [JOURNEY.arrive[0] + 0.7, JOURNEY.arrive[1] - 0.9],
      `<span class="lg-atlas3d__cue lg-atlas3d__cue--review">v1 ✓</span>`);
    const seal = divMarker(g, [JOURNEY.arrive[0] + 1.1, JOURNEY.arrive[1] - 0.2],
      `<span class="lg-atlas3d__cue lg-atlas3d__cue--seal">${SEAL_SVG}</span>`);

    journey.current = { route, els: { vehicle, inspector, geofence, evidence, review, seal } };
    applyStage(stageRef.current);
  }, [locale, applyStage]);

  // Rebuild overlays whenever Layer 1 (re)initialises — including theme flips,
  // which recreate the map instance.
  const onReady = useCallback((ctx: AtlasMapContext) => {
    setHover(null); setLocked(null);
    try { buildLayers(ctx); } catch { onFail(); }
  }, [buildLayers, onFail]);

  // Stage changes from the tablist / motion loop re-drive the overlays.
  useEffect(() => { applyStage(activeStage); }, [activeStage, applyStage]);

  return (
    <>
      <StoryMapInner locale={locale} onReady={onReady} onFail={onFail} />
      <SaudiAtlasDossier node={shown} locked={locked !== null} locale={locale}
        strings={dossierStrings} onClose={closeLocked} />
    </>
  );
}

function stageNode(stage: AtlasStageId): string {
  switch (stage) {
    case "plan": return "riyadh";
    case "travel": return "qassim";
    case "arrive":
    case "inspect": return "jubail";
    case "review": return "ras-al-khair";
    case "decide": return "riyadh";
  }
}

function PublicSafeImageAtlas({
  locale, activeStage, dossierStrings, onInteractingChange, onImageError,
}: {
  locale: "ar" | "en";
  activeStage: AtlasStageId;
  dossierStrings: DossierStrings;
  onInteractingChange: (interacting: boolean) => void;
  onImageError: () => void;
}) {
  const [hover, setHover] = useState<AtlasNode | null>(null);
  const [locked, setLocked] = useState<AtlasNode | null>(null);
  const [hoveredZone, setHoveredZone] = useState<AtlasZoneId | null>(null);
  const [lockedZone, setLockedZone] = useState<AtlasZoneId | null>(null);
  const [ready, setReady] = useState(false);
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const shown = locked ?? hover;
  const activeZone = lockedZone ?? hoveredZone;
  const activeNode = stageNode(activeStage);
  const shownPosition = shown ? IMAGE_POSITIONS[shown.id] : undefined;

  useEffect(() => { onInteractingChange(shown !== null || activeZone !== null); }, [shown, activeZone, onInteractingChange]);

  const closeLocked = useCallback(() => {
    const id = locked?.id;
    setLocked(null);
    if (id) requestAnimationFrame(() => refs.current.get(id)?.focus());
  }, [locked]);

  return (
    <div className={`lg-atlas-image${ready ? " is-ready" : ""}${activeZone ? " is-zone-engaged" : ""}`} data-atlas-mode="public-safe-image"
      data-active-stage={activeStage} data-active-zone={stageZone(activeStage)}>
      <div className="lg-atlas-image__plane">
        <picture>
          <img className="lg-atlas-image__media" src={`${PUBLIC_SAFE_ATLAS_BASE}.png`}
            width="1672" height="941" alt="" decoding="async" draggable={false}
            onLoad={() => setReady(true)} onError={onImageError} />
        </picture>

        <JourneyOverlay stage={activeStage} locale={locale} />

        <ZoneLiftOverlay locale={locale} activeZone={activeZone} lockedZone={lockedZone}
          onHover={zone => { if (!lockedZone) setHoveredZone(zone); }}
          onLock={zone => { setLockedZone(current => current === zone ? null : zone); setHoveredZone(zone); }}
          onClose={() => { setLockedZone(null); setHoveredZone(null); }} />

        <div className="lg-atlas-image__hotspots" aria-label={dossierStrings.mapLabel}>
          {NODES.map(node => {
            const p = IMAGE_POSITIONS[node.id];
            if (!p) return null;
            const style = { left: `${p.x}%`, top: `${p.y}%` } as CSSProperties;
            return (
              <button key={node.id} ref={el => { if (el) refs.current.set(node.id, el); }}
                type="button" className={`lg-atlas-image__hotspot lg-atlas-image__hotspot--${node.halo}${activeNode === node.id ? " is-active" : ""}`}
                style={style} aria-label={`${node.name[locale]}, ${node.industry[locale]}. ${node.sampleState[locale]}`}
                aria-pressed={locked?.id === node.id}
                onMouseEnter={() => setHover(node)}
                onMouseLeave={() => setHover(current => current?.id === node.id ? null : current)}
                onFocus={() => setHover(node)}
                onBlur={() => setHover(current => current?.id === node.id ? null : current)}
                onClick={() => setLocked(node)}
                onKeyDown={e => {
                  if (e.key === "Escape") { e.preventDefault(); setLocked(null); e.currentTarget.blur(); }
                }}>
                <span className="lg-atlas-image__hotspot-core" aria-hidden="true" />
                <span className={`lg-atlas-image__hotspot-label lg-atlas-image__hotspot-label--${locale} lg-atlas-image__hotspot-label--${node.labelPos ?? "below"}`}>{node.name[locale]}</span>
              </button>
            );
          })}
        </div>

        <div className={`lg-atlas-image__zones lg-atlas-image__zones--${locale}`} aria-hidden="true">
          {ZONES.map((zone, index) => <span key={zone.en}
            style={{ left: `${zone.x}%`, top: `${zone.y}%`, "--zone-label-order": index } as CSSProperties}>{zone[locale]}</span>)}
        </div>

      </div>

      <SaudiAtlasDossier node={shown} locked={locked !== null} locale={locale}
        strings={dossierStrings} onClose={closeLocked}
        placement={shownPosition && shownPosition.x > 55 ? "left" : "right"} />
    </div>
  );
}

export default function SaudiIndustrialAtlas(props: {
  locale: "ar" | "en";
  activeStage: AtlasStageId;
  dossierStrings: DossierStrings;
  onInteractingChange: (interacting: boolean) => void;
  onFail: () => void;
}) {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) setUseFallback(true);
  }, []);

  if (useFallback) return <GeneratedAtlasFallback {...props} />;
  return <PublicSafeImageAtlas {...props} onImageError={() => setUseFallback(true)} />;
}
