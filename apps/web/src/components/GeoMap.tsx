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

const MARKER_SOURCE = "inspection-markers";
const FENCE_SOURCE = "inspection-geofences";
const MARKER_LAYER = "inspection-markers-circle";
const REGION_SOURCE = "ksa-regions";
const TONE: Record<GeoTone, { fill: string; stroke: string }> = MAP_PALETTE;

// Canonical KSA region boundaries as a faint reference layer, drawn once under
// the markers/fences. Sourced from @/lib/ksa-regions (single canonical source).
function installRegions(map: mapboxgl.Map) {
  if (map.getSource(REGION_SOURCE)) return;
  loadKsaRegions().then(regions => {
    if (!map.getStyle() || map.getSource(REGION_SOURCE)) return;
    map.addSource(REGION_SOURCE, { type: "geojson", data: regions });
    map.addLayer({ id: "ksa-regions-line", type: "line", source: REGION_SOURCE, slot: "bottom", paint: {
      "line-color": MAP_PALETTE.neutral.stroke, "line-width": 0.75, "line-opacity": 0.35, "line-dasharray": [3, 3],
    } });
  }).catch(() => { /* reference layer is optional; the map renders without it */ });
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
  /** Draw the canonical KSA region boundary reference layer (default true). */
  showRegions?: boolean;
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

export default function GeoMap({ center, zoom, markers, height = "100%", selectedId, focus, onMarkerClick, onRadiusChange, interactive = true, ariaLabel = "Mapbox map", showRegions = true }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const latest = useRef<RenderData>({ center, zoom, markers, selectedId, focus });
  const selectedRef = useRef(selectedId);
  const markerClickRef = useRef(onMarkerClick);
  const radiusChangeRef = useRef(onRadiusChange);
  const suppressRadiusRef = useRef(false);
  const [mapLocale, setMapLocale] = useState<"en" | "ar">("en");
  const [failed, setFailed] = useState(false);
  latest.current = { center, zoom, markers, selectedId, focus };
  selectedRef.current = selectedId;
  markerClickRef.current = onMarkerClick;
  radiusChangeRef.current = onRadiusChange;

  useEffect(() => { setMapLocale(locale()); }, []);
  useEffect(() => {
    if (!token || !containerRef.current) return;
    const map = new mapboxgl.Map({
      accessToken: token, container: containerRef.current, style: "mapbox://styles/mapbox/standard",
      center: [center[1], center[0]], zoom, language: mapLocale,
      config: { basemap: { lightPreset: "day", show3dObjects: false } }, attributionControl: true,
      interactive,
    });
    mapRef.current = map;
    if (interactive) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const onLoad = () => {
      if (showRegions) installRegions(map);
      sync(map, latest.current, true);
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
    const onError = (event: { error?: Error }) => {
      if (/access token|authorization|unauthori[sz]ed|forbidden|failed to load.*style/i.test(event.error?.message ?? "")) setFailed(true);
    };
    map.on("load", onLoad); map.on("error", onError);
    return () => { map.off("load", onLoad); map.off("error", onError); map.remove(); mapRef.current = null; };
  }, [interactive, mapLocale, showRegions, token]);

  useEffect(() => { if (mapRef.current?.isStyleLoaded()) sync(mapRef.current, latest.current); }, [center, focus, markers, selectedId, zoom]);
  useEffect(() => { mapRef.current?.setLanguage(mapLocale); }, [mapLocale]);

  if (!token || failed) {
    const ar = mapLocale === "ar";
    return <div className="ax-state ax-state--inline" role="status" style={{ blockSize: height, inlineSize: "100%" }} data-map-provider="mapbox-unavailable">
      <span className="ax-state__glyph">⌖</span><h4>{ar ? "خدمة الخريطة غير متاحة" : "Map service unavailable"}</h4>
      <p className="t-caption">{ar ? "لم يتم تكوين خدمة Mapbox لهذه البيئة." : "Mapbox is not configured for this environment."}</p>
    </div>;
  }
  return <div ref={containerRef} aria-label={ariaLabel} data-map-provider="mapbox" style={{ blockSize: height, inlineSize: "100%" }} />;
}
