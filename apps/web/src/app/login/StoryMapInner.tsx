"use client";
// CD-001 V7 Atlas — LAYER 1 (authoritative real map). This component owns the
// Leaflet lifecycle only: a theme-aware labelled CARTO basemap, the bundled
// KSA boundary (public/geo/sau.geo.json — no third-party GeoJSON host), a
// frame mask, civic orientation labels and always-visible attribution. It does
// NOT draw factories, routes, halos or actors — those are Layers 2–4, owned by
// SaudiIndustrialAtlas, which receives the live map instance through onReady.
// The credential form renders and works before/during/after this map loads;
// the atlas frame has fixed dimensions so there is no layout shift. Colours
// resolve from ax base tokens (GLOBAL COLOR LAW) which are literal hex in
// tokens.css and therefore safe to hand to Leaflet's SVG renderer.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ORIENTATION_CITIES } from "./saudi-atlas-locations";
import { loadKsaRegions, regionRingsLatLng, type KsaRegionCollection } from "@/lib/ksa-regions";

// KSA framing bounds (also the SVGOverlay anchor for the Layer-2 terrain slab).
export const ATLAS_BOUNDS: L.LatLngBoundsExpression = [[15.8, 34.4], [32.4, 56.0]];
// Painted over everything outside the KSA rings (fillRule evenodd).
const MASK_OUTER: [number, number][] = [[-89, -300], [-89, 300], [89, 300], [89, -300]];

export type AtlasTokens = {
  canvas: string; primary: string; success: string; warning: string; info: string; text: string;
};

// The context the Layer 2–4 owner needs to draw over this map.
export type AtlasMapContext = { map: L.Map; rings: [number, number][][]; dark: boolean; tokens: AtlasTokens };

export function isDark(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light") return false;
  if (attr === "dark") return true;
  return !window.matchMedia?.("(prefers-color-scheme: light)").matches;
}

// Base tokens are literal hex in tokens.css, so :root computed values are safe
// for Leaflet's SVG renderer (derived color-mix tokens are not).
export function atlasTokens(): AtlasTokens {
  const cs = getComputedStyle(document.documentElement);
  const g = (v: string) => cs.getPropertyValue(v).trim();
  return {
    canvas: g("--surface-canvas"), primary: g("--action-primary"),
    success: g("--status-compliant"), warning: g("--status-warning"),
    info: g("--status-info"), text: g("--text-primary"),
  };
}

export default function StoryMapInner({ locale, onReady, onFail }: {
  locale: "ar" | "en";
  onReady: (ctx: AtlasMapContext) => void;
  onFail: () => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const ringsRef = useRef<[number, number][][] | null>(null);
  const regionsRef = useRef<KsaRegionCollection | null>(null);

  useEffect(() => {
    let disposed = false;

    async function loadRings(): Promise<[number, number][][]> {
      if (ringsRef.current) return ringsRef.current;
      const res = await fetch("/geo/sau.geo.json");
      if (!res.ok) throw new Error(`sau.geo.json ${res.status}`);
      const gj = await res.json();
      const geom = gj.features ? gj.features[0].geometry : (gj.geometry ?? gj);
      const polys: [number, number][][][] = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
      const rings = polys.map(p => p[0].map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]));
      if (!rings.length) throw new Error("empty boundary");
      ringsRef.current = rings;
      return rings;
    }

    function destroy() { mapRef.current?.remove(); mapRef.current = null; }

    async function init() {
      const el = elRef.current;
      if (!el || disposed) return;
      destroy();
      const rings = await loadRings();
      if (disposed) return;
      const dark = isDark();
      const tokens = atlasTokens();

      const map = L.map(el, {
        zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        boxZoom: false, keyboard: false, touchZoom: false, attributionControl: true, zoomSnap: 0.05,
      });
      mapRef.current = map;

      // No-label tiles: every place label is rendered in the DOM in the active
      // locale (Arabic in AR / English in EN), so no baked Latin text remains.
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${dark ? "dark_nolabels" : "light_nolabels"}/{z}/{x}/{y}.png`, {
        subdomains: "abcd", className: dark ? "lg-map__tiles--bright" : "",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);
      // Extra top room so the tall isometric structures + truth banner never
      // clip; symmetric side padding keeps the Kingdom centred (shrink-to-fit).
      map.fitBounds(ATLAS_BOUNDS, { paddingTopLeft: [34, 64], paddingBottomRight: [34, 44] });

      // Frame mask: everything outside the real boundary painted with the canvas.
      L.polygon([MASK_OUTER, ...rings], {
        stroke: false, fillColor: tokens.canvas, fillOpacity: 1, fillRule: "evenodd", interactive: false, pane: "tilePane",
      }).addTo(map);
      rings.forEach(r => L.polyline([...r, r[0]], {
        color: tokens.primary, weight: 1.5, opacity: 0.75, interactive: false,
      }).addTo(map));

      // Internal first-level region borders from the canonical source
      // (@/lib/ksa-regions), thinner and fainter than the national outline so
      // the Kingdom shape still reads first. Non-fatal: a failed fetch simply
      // omits this layer and never blocks the atlas or sign-in.
      try {
        const regions = regionsRef.current ?? (regionsRef.current = await loadKsaRegions());
        if (!disposed) regions.features.forEach(feature =>
          regionRingsLatLng(feature).forEach(ring => L.polyline([...ring, ring[0]], {
            color: tokens.primary, weight: 0.75, opacity: 0.4, dashArray: "3 3", interactive: false,
          }).addTo(map)));
      } catch { /* region layer is optional; never blocks the atlas or sign-in */ }

      // Civic orientation labels (Layer 1 context; non-industrial, no metrics).
      ORIENTATION_CITIES.forEach(c => {
        L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div class="lg-atlas3d__orient lg-atlas3d__orient--${locale}">${c.name[locale]}</div>`,
            iconSize: [0, 0],
          }),
          interactive: false, keyboard: false,
        }).addTo(map);
      });

      onReady({ map, rings, dark, tokens });
    }

    init().catch(() => { if (!disposed) onFail(); });

    // Theme flip re-inits Layer 1; onReady fires again so the atlas rebuilds.
    const obs = new MutationObserver(() => { init().catch(() => { if (!disposed) onFail(); }); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => { disposed = true; obs.disconnect(); destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={elRef} className="lg-map" dir="ltr" aria-hidden="true" />;
}
