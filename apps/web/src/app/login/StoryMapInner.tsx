"use client";
// SCR-PUB-010 v4 — the login story map (Login.dc.html Turn 4). One inspection
// journey told on a real KSA basemap: 01 planned in Riyadh, an inspector en
// route, 02 geofenced arrival at the Jubail factory. Everything on it is
// SAMPLE / ILLUSTRATIVE (labelled in the story header) — no live telemetry on
// this public surface (DEC-011 / SAQEEL-07). Browser-only; loaded via
// next/dynamic ssr:false from StoryPanel. The KSA boundary ships with the app
// (public/geo/sau.geo.json) so the page never depends on a third-party
// GeoJSON host; if anything in here fails, onFail() swaps in the static
// SaqeelHero SVG. Colours resolve from ax tokens (GLOBAL COLOR LAW): vector
// layers read the base tokens off :root, divIcon markers are styled by
// login.css classes.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type StoryMapLabels = { riyadh: string; jubail: string };

const BOUNDS: L.LatLngBoundsExpression = [[15.8, 34.4], [32.4, 56.0]];
// Painted over everything outside the KSA rings (fillRule evenodd).
const MASK_OUTER: [number, number][] = [[-89, -300], [-89, 300], [89, 300], [89, -300]];

// Quiet activity zones — one hue, opacity carries intensity (illustrative).
const ZONES = [
  { lat: 26.6, lng: 49.6, r: 165000, dark: 0.16, light: 0.12 },
  { lat: 24.7, lng: 46.7, r: 140000, dark: 0.13, light: 0.10 },
  { lat: 21.7, lng: 39.6, r: 125000, dark: 0.11, light: 0.09 },
  { lat: 24.2, lng: 38.4, r: 100000, dark: 0.08, light: 0.07 },
  { lat: 18.0, lng: 42.6, r: 110000, dark: 0.08, light: 0.07 },
];

// Factory sites — industrial cities, single brand colour, two labelled hubs.
const SITES: { lat: number; lng: number; hub?: boolean; label?: "riyadh" | "jubail" }[] = [
  { lat: 27.01, lng: 49.66, hub: true, label: "jubail" },
  { lat: 26.42, lng: 50.09 }, { lat: 25.42, lng: 49.62 },
  { lat: 24.63, lng: 46.85, hub: true, label: "riyadh" },
  { lat: 21.4, lng: 39.27 }, { lat: 24.09, lng: 38.06 },
  { lat: 26.33, lng: 43.97 }, { lat: 28.4, lng: 36.6 }, { lat: 18.25, lng: 42.51 },
];

// The journey: Riyadh -> Jubail, inspector mid-route, geofence at destination.
const ROUTE: [number, number][] = [[24.63, 46.85], [25.35, 47.75], [26.25, 48.85], [27.01, 49.66]];
const RIYADH: [number, number] = [24.63, 46.85];
const JUBAIL: [number, number] = [27.01, 49.66];
const INSPECTOR: [number, number] = [26.25, 48.85];

const FACTORY_GLYPH =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 21V9l6 4V9l6 4V4h6v17H3Z"></path></svg>';
const INSPECTOR_GLYPH =
  '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l7 18-7-4.5L5 21Z"></path></svg>';

function isDark(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light") return false;
  if (attr === "dark") return true;
  return !window.matchMedia?.("(prefers-color-scheme: light)").matches;
}

// Base tokens are plain hex in tokens.css, so :root computed values are safe
// to hand to Leaflet's SVG renderer (derived color-mix tokens are not).
function tokens() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v: string) => cs.getPropertyValue(v).trim();
  return { canvas: g("--ax-color-canvas"), primary: g("--ax-color-primary"), success: g("--ax-color-success") };
}

function divMarker(map: L.Map, at: L.LatLngExpression, html: string) {
  L.marker(at, { icon: L.divIcon({ className: "", html, iconSize: [0, 0] }), interactive: false, keyboard: false }).addTo(map);
}

export default function StoryMapInner({ locale, labels, onFail }: {
  locale: "ar" | "en";
  labels: StoryMapLabels;
  onFail: () => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const ringsRef = useRef<[number, number][][] | null>(null);

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

    function destroy() {
      mapRef.current?.remove();
      mapRef.current = null;
    }

    async function init() {
      const el = elRef.current;
      if (!el || disposed) return;
      destroy();
      const rings = await loadRings();
      if (disposed) return;
      const dark = isDark();
      const tok = tokens();

      const map = L.map(el, {
        zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        boxZoom: false, keyboard: false, touchZoom: false, attributionControl: true, zoomSnap: 0.05,
      });
      mapRef.current = map;

      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png`, {
        subdomains: "abcd", className: dark ? "lg-map__tiles--bright" : "",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);
      map.fitBounds(BOUNDS, { paddingTopLeft: [20, 24], paddingBottomRight: [20, 30] });

      // Mask: everything outside the real boundary painted with the frame canvas.
      L.polygon([MASK_OUTER, ...rings], {
        stroke: false, fillColor: tok.canvas, fillOpacity: 1, fillRule: "evenodd", interactive: false,
      }).addTo(map);
      rings.forEach(r => L.polyline([...r, r[0]], { color: tok.primary, weight: 1.5, opacity: 0.75, interactive: false }).addTo(map));

      ZONES.forEach(z => L.circle([z.lat, z.lng], {
        radius: z.r, color: tok.primary, weight: 0.8, opacity: 0.3,
        fillColor: tok.primary, fillOpacity: dark ? z.dark : z.light, interactive: false,
      }).addTo(map));

      SITES.forEach(f => {
        const size = f.hub ? 28 : 24;
        divMarker(map, [f.lat, f.lng],
          `<div class="lg-map__site" style="width:${size}px;height:${size}px">${FACTORY_GLYPH}</div>`);
        if (f.label) {
          const text = labels[f.label];
          const dy = -(size / 2 + 18); // both hubs label on top
          divMarker(map, [f.lat, f.lng],
            `<div class="lg-map__sitelabel lg-map__sitelabel--${locale}" style="transform:translate(-50%,${dy}px)">${text}</div>`);
        }
      });

      L.polyline(ROUTE, {
        color: tok.primary, weight: 2.5, opacity: 0.9, dashArray: "7 9",
        className: "lg-map__route", interactive: false,
      }).addTo(map);
      L.circle(JUBAIL, {
        radius: 42000, color: tok.success, weight: 1.5, opacity: 0.9, dashArray: "5 6",
        fillColor: tok.success, fillOpacity: dark ? 0.08 : 0.1, interactive: false,
      }).addTo(map);
      divMarker(map, INSPECTOR,
        `<div class="lg-map__insp"><span class="lg-map__insp-ping"></span><span class="lg-map__insp-dot">${INSPECTOR_GLYPH}</span></div>`);

      // Step badges tying the map to the storyline strip below it.
      ([[RIYADH, "01"], [JUBAIL, "02"]] as const).forEach(([at, n]) =>
        divMarker(map, at, `<div class="lg-map__badge">${n}</div>`));
    }

    init().catch(() => { if (!disposed) onFail(); });

    // Theme flip re-inits: tiles, mask fill and vector colours are all baked in.
    const obs = new MutationObserver(() => { init().catch(() => { if (!disposed) onFail(); }); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => { disposed = true; obs.disconnect(); destroy(); };
    // labels/locale are fixed per server render (locale cookie flips via full navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={elRef} className="lg-map" dir="ltr" aria-hidden="true" />;
}
