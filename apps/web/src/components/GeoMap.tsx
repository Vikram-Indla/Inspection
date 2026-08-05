"use client";

// G-MAP — Mapbox GL JS is the shared map renderer for web, Admin and iPad.
// This component presents coordinates and governed geofence geometry only;
// ENG-06/server-side validation remains the authority for every decision.
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_PALETTE } from "@/lib/map-palette";
import { loadKsaRegions } from "@/lib/ksa-regions";

export type GeoTone = "high" | "medium" | "low" | "neutral";

export type GeoMarkerData = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  tone: GeoTone;
  /** Geofence ring radius in metres (factories.geofence_radius_m ?? ENG-06 default). */
  radiusM?: number;
};

export type GeoFocus = { lat: number; lng: number; zoom?: number };

// The platform is KSA-bound: constrain every map (web, Admin, iPad) to the
// Kingdom's bounding box so no view — even with bad/absent coordinates — can
// drift to another country. [SW[lng,lat], NE[lng,lat]] with light padding.
const KSA_MAX_BOUNDS: [[number, number], [number, number]] = [[33.5, 15.4], [56.6, 33.1]];

const MARKER_SOURCE = "inspection-markers";
const FENCE_SOURCE = "inspection-geofences";
const MARKER_LAYER = "inspection-markers-circle";
const REGION_SOURCE = "ksa-regions";
const TONE: Record<GeoTone, { fill: string; stroke: string }> = MAP_PALETTE;

/** Per-region RAG posture keyed by canonical region id (@/lib/ksa-regions). */
export type RegionPostureMap = Record<string, "high" | "medium" | "low">;

// Colour a region only when a posture is supplied via feature-state; otherwise
// the fill is fully transparent and just the faint boundary line shows. This
// keeps a single source/layer whether the caller wants a plain reference layer
// or a posture choropleth.
const REGION_FILL_COLOR: mapboxgl.Expression = [
  "match", ["feature-state", "posture"],
  "high", MAP_PALETTE.high.fill, "medium", MAP_PALETTE.medium.fill, "low", MAP_PALETTE.low.fill,
  MAP_PALETTE.neutral.fill,
];
const REGION_FILL_OPACITY: mapboxgl.Expression = ["case", ["==", ["feature-state", "posture"], null], 0, 0.14];

// Canonical KSA region boundaries, drawn once under the markers/fences. Sourced
// from @/lib/ksa-regions (single canonical source). promoteId exposes the
// region id as the feature id so postures apply via setFeatureState.
function installRegions(map: mapboxgl.Map, postures?: RegionPostureMap) {
  if (map.getSource(REGION_SOURCE)) { applyPostures(map, postures); return; }
  loadKsaRegions().then(regions => {
    if (!map.getStyle() || map.getSource(REGION_SOURCE)) return;
    map.addSource(REGION_SOURCE, { type: "geojson", data: regions, promoteId: "id" });
    map.addLayer({ id: "ksa-regions-fill", type: "fill", source: REGION_SOURCE, slot: "bottom", paint: {
      "fill-color": REGION_FILL_COLOR, "fill-opacity": REGION_FILL_OPACITY,
    } });
    map.addLayer({ id: "ksa-regions-line", type: "line", source: REGION_SOURCE, slot: "bottom", paint: {
      "line-color": MAP_PALETTE.neutral.stroke, "line-width": 0.75, "line-opacity": 0.35, "line-dasharray": [3, 3],
    } });
    applyPostures(map, postures);
  }).catch(() => { /* reference layer is optional; the map renders without it */ });
}

// Set/clear region feature-state so the choropleth reflects the current
// postures without rebuilding the source. Regions absent from the map stay
// transparent (posture = null).
function applyPostures(map: mapboxgl.Map, postures?: RegionPostureMap) {
  if (!map.getSource(REGION_SOURCE)) return;
  map.removeFeatureState({ source: REGION_SOURCE });
  if (!postures) return;
  for (const [id, band] of Object.entries(postures)) {
    map.setFeatureState({ source: REGION_SOURCE, id }, { posture: band });
  }
}

type Props = {
  center: [number, number];
  zoom: number;
  markers: GeoMarkerData[];
  height?: string | number;
  selectedId?: string | null;
  focus?: GeoFocus;
  onMarkerClick?: (id: string) => void;
  onRadiusChange?: (id: string, radiusM: number) => void;
  interactive?: boolean;
  ariaLabel?: string;
  /** Frame ALL markers in view on load (fit-bounds) instead of centring on the
   *  first one — so a multi-site task map shows every assigned establishment,
   *  not just whichever sorted first. Falls back to center/zoom for 0–1 marker. */
  fitMarkers?: boolean;
  /** Draw the canonical KSA region boundary reference layer (default true). */
  showRegions?: boolean;
  /** Colour regions by RAG posture (canonical region id → band). Boundary
   *  reference layer only when omitted. */
  regionPostures?: RegionPostureMap;
};

type RenderData = Pick<Props, "center" | "zoom" | "markers" | "selectedId" | "focus">;

function points(markers: GeoMarkerData[], selectedId?: string | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: markers.map(marker => ({
      type: "Feature",
      properties: { id: marker.id, label: marker.label, tone: marker.tone, selected: marker.id === selectedId },
      geometry: { type: "Point", coordinates: [marker.lng, marker.lat] },
    })),
  };
}

// Mapbox circle layers are screen-sized. A governed radius is in metres, so a
// geodesic polygon is required to keep the fence honest at every zoom level.
function geodesicRing(lat: number, lng: number, radiusM: number): [number, number][] {
  const earthRadiusM = 6_378_137;
  const distance = radiusM / earthRadiusM;
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const ring: [number, number][] = [];
  for (let bearing = 0; bearing <= 360; bearing += 8) {
    const theta = bearing * Math.PI / 180;
    const nextLat = Math.asin(Math.sin(latRad) * Math.cos(distance)
      + Math.cos(latRad) * Math.sin(distance) * Math.cos(theta));
    const nextLng = lngRad + Math.atan2(
      Math.sin(theta) * Math.sin(distance) * Math.cos(latRad),
      Math.cos(distance) - Math.sin(latRad) * Math.sin(nextLat),
    );
    ring.push([nextLng * 180 / Math.PI, nextLat * 180 / Math.PI]);
  }
  return ring;
}

function fences(markers: GeoMarkerData[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: markers.flatMap(marker => (!marker.radiusM || marker.radiusM <= 0 ? [] : [{
      type: "Feature" as const,
      properties: { id: marker.id, tone: marker.tone },
      geometry: { type: "Polygon" as const, coordinates: [geodesicRing(marker.lat, marker.lng, marker.radiusM)] },
    }])),
  };
}

function sync(map: mapboxgl.Map, data: RenderData, initial = false) {
  const markerData = points(data.markers, data.selectedId);
  const fenceData = fences(data.markers);
  const markerSource = map.getSource(MARKER_SOURCE) as mapboxgl.GeoJSONSource | undefined;
  const fenceSource = map.getSource(FENCE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
  if (markerSource && fenceSource) {
    markerSource.setData(markerData);
    fenceSource.setData(fenceData);
  } else {
    map.addSource(FENCE_SOURCE, { type: "geojson", data: fenceData });
    map.addLayer({ id: "inspection-fences-fill", type: "fill", source: FENCE_SOURCE, slot: "top", paint: {
      "fill-color": ["match", ["get", "tone"], "high", TONE.high.fill, "medium", TONE.medium.fill, "low", TONE.low.fill, TONE.neutral.fill],
      "fill-opacity": 0.1,
    } });
    map.addLayer({ id: "inspection-fences-line", type: "line", source: FENCE_SOURCE, slot: "top", paint: {
      "line-color": ["match", ["get", "tone"], "high", TONE.high.stroke, "medium", TONE.medium.stroke, "low", TONE.low.stroke, TONE.neutral.stroke],
      "line-width": 2, "line-dasharray": [2, 2],
    } });
    map.addSource(MARKER_SOURCE, { type: "geojson", data: markerData });
    map.addLayer({ id: MARKER_LAYER, type: "circle", source: MARKER_SOURCE, slot: "top", paint: {
      "circle-radius": ["case", ["get", "selected"], 10, 7],
      "circle-color": ["match", ["get", "tone"], "high", TONE.high.fill, "medium", TONE.medium.fill, "low", TONE.low.fill, TONE.neutral.fill],
      "circle-stroke-width": 2, "circle-stroke-color": MAP_PALETTE.halo,
    } });
  }
  if (initial) map.jumpTo({ center: [data.center[1], data.center[0]], zoom: data.zoom });
  else if (data.focus) map.flyTo({ center: [data.focus.lng, data.focus.lat], zoom: data.focus.zoom ?? map.getZoom(), duration: 600 });
}

function locale() { return document.documentElement.lang === "ar" ? "ar" : "en"; }
// App theme is stored as data-theme on <html> (see ThemeToggle/ThemeScript).
// The Mapbox Standard style exposes a matching day/night light preset.
function readTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export default function GeoMap({ center, zoom, markers, height = "100%", selectedId, focus, onMarkerClick, onRadiusChange, interactive = true, ariaLabel = "Mapbox map", fitMarkers = false, showRegions = true, regionPostures }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const latest = useRef<RenderData>({ center, zoom, markers, selectedId, focus });
  const selectedRef = useRef(selectedId);
  const markerClickRef = useRef(onMarkerClick);
  const radiusChangeRef = useRef(onRadiusChange);
  const posturesRef = useRef(regionPostures);
  const suppressRadiusRef = useRef(false);
  const fitRef = useRef(fitMarkers);
  posturesRef.current = regionPostures;
  fitRef.current = fitMarkers;
  const [mapLocale, setMapLocale] = useState<"en" | "ar">("en");
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const lightPreset = mapTheme === "dark" ? "night" : "day";
  latest.current = { center, zoom, markers, selectedId, focus };
  selectedRef.current = selectedId;
  markerClickRef.current = onMarkerClick;
  radiusChangeRef.current = onRadiusChange;

  useEffect(() => { setMapLocale(locale()); }, []);
  // Track app theme (data-theme on <html>) and re-apply the basemap light preset
  // live when the user toggles, so map tiles follow light/dark like the rest of
  // the field chrome instead of always rendering the day basemap.
  useEffect(() => {
    setMapTheme(readTheme());
    const observer = new MutationObserver(() => setMapTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!token || !containerRef.current) return;
    setReady(false);
    const map = new mapboxgl.Map({
      accessToken: token, container: containerRef.current, style: "mapbox://styles/mapbox/standard",
      center: [center[1], center[0]], zoom, language: mapLocale,
      maxBounds: KSA_MAX_BOUNDS,
      config: { basemap: { lightPreset, show3dObjects: false } }, attributionControl: false,
      interactive,
    });
    mapRef.current = map;
    // Mapbox + OpenStreetMap licences REQUIRE attribution; it cannot be removed,
    // only collapsed. Compact mode shows a small ⓘ that expands on tap instead
    // of the always-on "© Mapbox © OpenStreetMap" line cluttering the card.
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const onLoad = () => {
      if (showRegions) installRegions(map, posturesRef.current);
      sync(map, latest.current, true);
      // Task-map framing: fit every marker in view rather than parking on the
      // first pin (which cropped establishments in other regions). Bounded by
      // maxZoom so a single cluster doesn't zoom to street level.
      const pins = latest.current.markers;
      if (fitRef.current && pins.length > 1) {
        const bounds = pins.reduce(
          (b, m) => b.extend([m.lng, m.lat]),
          new mapboxgl.LngLatBounds([pins[0].lng, pins[0].lat], [pins[0].lng, pins[0].lat]),
        );
        map.fitBounds(bounds, { padding: 56, maxZoom: 11, duration: 0 });
      }
      map.on("click", MARKER_LAYER, event => {
        const feature = event.features?.[0];
        const id = String(feature?.properties?.id ?? "");
        if (!id || feature?.geometry.type !== "Point") return;
        suppressRadiusRef.current = true;
        markerClickRef.current?.(id);
        new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setText(String(feature.properties?.label ?? ""))
          .addTo(map);
      });
      map.on("click", event => {
        if (suppressRadiusRef.current) { suppressRadiusRef.current = false; return; }
        const id = selectedRef.current;
        const marker = latest.current.markers.find(item => item.id === id);
        if (!id || !marker || !radiusChangeRef.current) return;
        const radiusM = Math.round(new mapboxgl.LngLat(marker.lng, marker.lat).distanceTo(event.lngLat));
        radiusChangeRef.current(id, radiusM);
      });
      map.on("mouseenter", MARKER_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", MARKER_LAYER, () => { map.getCanvas().style.cursor = ""; });
    };
    const onIdle = () => setReady(true);
    const onError = (event: { error?: Error }) => {
      if (/access token|authorization|unauthori[sz]ed|forbidden|failed to load.*style/i.test(event.error?.message ?? "")) setFailed(true);
    };
    map.on("load", onLoad); map.on("idle", onIdle); map.on("error", onError);
    return () => {
      map.off("load", onLoad); map.off("idle", onIdle); map.off("error", onError);
      map.remove(); mapRef.current = null;
    };
  }, [interactive, mapLocale, showRegions, token]);

  useEffect(() => { if (mapRef.current?.isStyleLoaded()) sync(mapRef.current, latest.current); }, [center, focus, markers, selectedId, zoom]);
  useEffect(() => { mapRef.current?.setLanguage(mapLocale); }, [mapLocale]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => { try { map.setConfigProperty("basemap", "lightPreset", lightPreset); } catch { /* style gone */ } };
    // If the theme resolves before the style finishes loading (the common case
    // on first mount), isStyleLoaded() is false here — apply on style.load
    // instead of dropping the update, so the basemap never sticks on "day".
    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
  }, [lightPreset]);
  // Re-colour the region choropleth when postures change (no source rebuild).
  useEffect(() => { const map = mapRef.current; if (map?.isStyleLoaded()) applyPostures(map, regionPostures); }, [regionPostures]);

  // Two different causes were collapsed into one message, so a map that failed
  // to load told the reader it was "not configured" — a wrong diagnosis, and
  // one only a developer could act on anyway. Separate them, and say what the
  // reader loses rather than naming the vendor and the environment.
  if (!token || failed) {
    const ar = mapLocale === "ar";
    return <div className="sq-state sq-state--inline" role="status" style={{ blockSize: height, inlineSize: "100%" }} data-map-provider={failed ? "mapbox-failed" : "mapbox-unavailable"}>
      <span className="sq-state__glyph">⌖</span>
      <h4>{ar ? "الخريطة غير متاحة" : "Map unavailable"}</h4>
      <p className="t-caption">{failed
        ? (ar ? "تعذّر تحميل الخريطة. تبقى السجلات متاحة في القائمة." : "The map could not load. The records are still available as a list.")
        : (ar ? "الخريطة غير متاحة في هذه البيئة. تبقى السجلات متاحة في القائمة." : "The map is not available here. The records are still available as a list.")}</p>
    </div>;
  }
  // Until the basemap paints, the container is an empty dark box — measured at
  // ~5s on a warm local machine, and a field iPad on cellular is far slower.
  // .sq-map-loading overlays a shimmer through ::after (see saqeel-runtime.css): it
  // needs to sit above the Mapbox canvas, and using a pseudo-element instead
  // of a wrapper keeps callers that position the map by [data-map-provider]
  // working. The class is dropped once the map reports idle.
  // The label is handed to CSS as a custom property rather than rendered as a
  // child. Mapbox owns the DOM inside this container, and a wrapper element is
  // not safe either: my-tasks lays its map card out with place-items:center, so
  // a wrapper would centre to its content instead of filling the card. A quoted
  // string in a custom property lets ::before carry localised text with no
  // structural change. JSON.stringify supplies the CSS quoting.
  const loadingLabel = mapLocale === "ar" ? "جارٍ تحميل الخريطة…" : "Loading map…";
  // `mapboxgl-map` is carried explicitly because React owns className on the
  // very element Mapbox uses as its container. Mapbox adds that class itself at
  // construction, but the next React render overwrites the attribute — when
  // `ready` flipped to true the old value was `undefined`, which removes the
  // attribute outright and takes `mapboxgl-map` with it. That class is what
  // supplies `position: relative`; without it the absolutely positioned
  // .mapboxgl-canvas resolves against the viewport and paints the map over the
  // entire page. Keeping the class in every value React writes makes the
  // positioning context survive re-renders; Mapbox re-adding it is idempotent.
  return <div ref={containerRef} aria-label={ariaLabel} data-map-provider="mapbox"
    className={ready ? "mapboxgl-map" : "mapboxgl-map sq-map-loading"}
    data-map-ready={ready ? "true" : "false"} aria-busy={ready ? undefined : "true"}
    style={{
      blockSize: height, inlineSize: "100%",
      ...(ready ? null : { ["--sq-map-loading-label" as string]: JSON.stringify(loadingLabel) }),
    }} />;
}
