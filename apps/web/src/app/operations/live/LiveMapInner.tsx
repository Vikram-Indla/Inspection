"use client";

// SCR-WEB-500 — Mapbox Operations Live renderer. Inspector positions remain
// explicitly projected from visit windows; this view never presents them as
// live GPS telemetry (DEC-002 / ENG-06 remain the authority).
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LiveFactory, LiveRegion, LiveInspector, RagBand } from "./types";

const KSA_CENTER: [number, number] = [24.2, 45.1];
const KSA_ZOOM = 6;
const FACTORY_SOURCE = "ops-factories";
const REGION_SOURCE = "ops-regions";
const REGION_LABEL_SOURCE = "ops-region-labels";
const INSPECTOR_SOURCE = "ops-inspectors";
const ROUTE_SOURCE = "ops-projected-routes";
const FACTORY_LAYER = "ops-factories-symbol";

const COLOR: Record<RagBand, string> = { high: "#b42318", medium: "#b54708", low: "#067647" };
const GLYPH: Record<RagBand, string> = { high: "▲", medium: "◆", low: "●" };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function heading(from: [number, number], to: [number, number]) { return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI + 90; }

function ring(lat: number, lng: number, radiusM: number): [number, number][] {
  const earth = 6_378_137, d = radiusM / earth, latR = lat * Math.PI / 180, lngR = lng * Math.PI / 180;
  const points: [number, number][] = [];
  for (let bearing = 0; bearing <= 360; bearing += 8) {
    const theta = bearing * Math.PI / 180;
    const nextLat = Math.asin(Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(theta));
    const nextLng = lngR + Math.atan2(Math.sin(theta) * Math.sin(d) * Math.cos(latR), Math.cos(d) - Math.sin(latR) * Math.sin(nextLat));
    points.push([nextLng * 180 / Math.PI, nextLat * 180 / Math.PI]);
  }
  return points;
}

function projected(inspectors: LiveInspector[], tick: number, reduce: boolean) {
  return inspectors.map(ins => {
    const drift = reduce ? 0 : ((tick * 0.006 + ins.seed) % 1) * (1 - ins.baseFraction);
    const fraction = ins.state === "on_the_way" ? Math.min(0.985, ins.baseFraction + drift) : 1;
    const pos: [number, number] = [lerp(ins.originLat, ins.destLat, fraction), lerp(ins.originLng, ins.destLng, fraction)];
    return { ins, fraction, pos, heading: heading([ins.originLat, ins.originLng], [ins.destLat, ins.destLng]) };
  });
}

function updateSources(map: mapboxgl.Map, factories: LiveFactory[], regions: LiveRegion[], moving: ReturnType<typeof projected>) {
  const factoryData: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: factories.map(factory => ({
    type: "Feature", properties: { id: factory.id, rawId: factory.rawId, name: factory.name, context: factory.city ?? factory.region ?? "", band: factory.band, glyph: GLYPH[factory.band] },
    geometry: { type: "Point", coordinates: [factory.lng, factory.lat] },
  })) };
  const regionData: GeoJSON.FeatureCollection<GeoJSON.Polygon> = { type: "FeatureCollection", features: regions.map(region => ({
    type: "Feature", properties: { id: region.id, band: region.posture }, geometry: { type: "Polygon", coordinates: [ring(region.lat, region.lng, region.radiusM)] },
  })) };
  const regionLabels: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: regions.map(region => ({
    type: "Feature", properties: { label: `${GLYPH[region.posture]} ${region.name.toUpperCase()}`, band: region.posture }, geometry: { type: "Point", coordinates: [region.lng, region.lat] },
  })) };
  const inspectorData: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: moving.map(({ ins, pos, heading: bearing, fraction }) => ({
    type: "Feature", properties: { factoryId: ins.factoryId, inspector: ins.inspector, state: ins.stateLabel, factory: ins.factoryName, eta: Math.max(1, Math.round((1 - fraction) * ins.etaMin)), bearing },
    geometry: { type: "Point", coordinates: [pos[1], pos[0]] },
  })) };
  const routeData: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: "FeatureCollection", features: moving.flatMap(({ ins, pos }) => ins.state !== "on_the_way" ? [] : [{
    type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [[ins.originLng, ins.originLat], [pos[1], pos[0]]] },
  }]) };
  const set = (id: string, data: GeoJSON.FeatureCollection) => (map.getSource(id) as mapboxgl.GeoJSONSource | undefined)?.setData(data);
  set(FACTORY_SOURCE, factoryData); set(REGION_SOURCE, regionData); set(REGION_LABEL_SOURCE, regionLabels); set(INSPECTOR_SOURCE, inspectorData); set(ROUTE_SOURCE, routeData);
}

function installLayers(map: mapboxgl.Map) {
  for (const id of [FACTORY_SOURCE, REGION_SOURCE, REGION_LABEL_SOURCE, INSPECTOR_SOURCE, ROUTE_SOURCE]) map.addSource(id, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  const color = ["match", ["get", "band"], "high", COLOR.high, "medium", COLOR.medium, COLOR.low] as mapboxgl.Expression;
  map.addLayer({ id: "ops-regions-fill", type: "fill", source: REGION_SOURCE, slot: "top", paint: { "fill-color": color, "fill-opacity": 0.1 } });
  map.addLayer({ id: "ops-regions-line", type: "line", source: REGION_SOURCE, slot: "top", paint: { "line-color": color, "line-width": 1.5 } });
  map.addLayer({ id: "ops-projected-routes-line", type: "line", source: ROUTE_SOURCE, slot: "top", paint: { "line-color": "#6941c6", "line-width": 1.5, "line-opacity": 0.55, "line-dasharray": [2, 6] } });
  map.addLayer({ id: FACTORY_LAYER, type: "symbol", source: FACTORY_SOURCE, slot: "top", layout: { "text-field": ["get", "glyph"], "text-size": 24, "text-allow-overlap": true }, paint: { "text-color": color, "text-halo-color": "#ffffff", "text-halo-width": 1.5 } });
  map.addLayer({ id: "ops-inspectors-symbol", type: "symbol", source: INSPECTOR_SOURCE, slot: "top", layout: { "text-field": "➤", "text-size": 24, "text-rotate": ["get", "bearing"], "text-allow-overlap": true }, paint: { "text-color": "#6941c6", "text-halo-color": "#ffffff", "text-halo-width": 1.5 } });
  map.addLayer({ id: "ops-region-labels", type: "symbol", source: REGION_LABEL_SOURCE, slot: "top", layout: { "text-field": ["get", "label"], "text-size": 11, "text-font": ["Open Sans Bold"], "text-allow-overlap": true }, paint: { "text-color": color, "text-halo-color": "#ffffff", "text-halo-width": 1 } });
}

export default function LiveMapInner({ factories, regions, inspectors, selectedId, onSelect }: {
  factories: LiveFactory[]; regions: LiveRegion[]; inspectors: LiveInspector[]; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const latest = useRef({ factories, regions, inspectors, selectedId, onSelect, tick: 0, reduce: false });
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [tick, setTick] = useState(0);
  const [failed, setFailed] = useState(false);
  latest.current = { factories, regions, inspectors, selectedId, onSelect, tick, reduce };

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setTick(value => value + 1), 100);
    return () => window.clearInterval(timer);
  }, [reduce]);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    const map = new mapboxgl.Map({ accessToken: token, container: containerRef.current, style: "mapbox://styles/mapbox/standard", center: [KSA_CENTER[1], KSA_CENTER[0]], zoom: KSA_ZOOM, minZoom: 5, maxZoom: 11, language: document.documentElement.lang === "ar" ? "ar" : "en", config: { basemap: { lightPreset: "day", show3dObjects: false } } });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const onLoad = () => {
      installLayers(map);
      const next = latest.current;
      updateSources(map, next.factories, next.regions, projected(next.inspectors, next.tick, next.reduce));
      map.on("click", FACTORY_LAYER, event => {
        const feature = event.features?.[0];
        const id = String(feature?.properties?.id ?? "");
        if (!id || feature?.geometry.type !== "Point") return;
        latest.current.onSelect(id);
        new mapboxgl.Popup().setLngLat(feature.geometry.coordinates as [number, number])
          .setText(`${String(feature.properties?.name ?? "")}\n${String(feature.properties?.context ?? "")}`).addTo(map);
      });
      map.on("click", "ops-inspectors-symbol", event => { const id = String(event.features?.[0]?.properties?.factoryId ?? ""); if (id) latest.current.onSelect(id); });
      map.on("click", "ops-region-labels", () => latest.current.onSelect(null));
      for (const layer of [FACTORY_LAYER, "ops-inspectors-symbol", "ops-region-labels"]) map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      for (const layer of [FACTORY_LAYER, "ops-inspectors-symbol", "ops-region-labels"]) map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    };
    const onError = (event: { error?: Error }) => { if (/access token|authorization|unauthori[sz]ed|forbidden|failed to load.*style/i.test(event.error?.message ?? "")) setFailed(true); };
    map.on("load", onLoad); map.on("error", onError);
    return () => { map.off("load", onLoad); map.off("error", onError); map.remove(); mapRef.current = null; };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    updateSources(map, factories, regions, projected(inspectors, tick, reduce));
  }, [factories, inspectors, regions, reduce, tick]);

  if (!token || failed) return <div className="ax-state" role="status" data-map-provider="mapbox-unavailable"><span className="ax-state__glyph">⌖</span><h4>Map service unavailable</h4><p className="ax-caption">Mapbox is not configured for this environment.</p></div>;
  return <div ref={containerRef} aria-label="Mapbox operations map" data-map-provider="mapbox" style={{ blockSize: "100%", inlineSize: "100%", background: "var(--ax-color-canvas)" }} />;
}
