"use client";

// SCR-WEB-500 — Mapbox Operations Live renderer. Inspector positions remain
// explicitly projected from visit windows; this view never presents them as
// live GPS telemetry (DEC-002 / ENG-06 remain the authority).
import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LiveFactory, LiveRegion, LiveInspector, RagBand } from "./types";
import { MAP_PALETTE } from "@/lib/map-palette";
import { loadKsaRegions, resolveRegionId, type KsaRegionCollection } from "@/lib/ksa-regions";

const KSA_CENTER: [number, number] = [24.2, 45.1];
const KSA_ZOOM = 6;
const FACTORY_SOURCE = "ops-factories";
const REGION_SOURCE = "ops-regions";
const REGION_LABEL_SOURCE = "ops-region-labels";
const INSPECTOR_SOURCE = "ops-inspectors";
const ROUTE_SOURCE = "ops-projected-routes";
const FACTORY_LAYER = "ops-factories-symbol";

const COLOR: Record<RagBand, string> = { high: MAP_PALETTE.high.fill, medium: MAP_PALETTE.medium.fill, low: MAP_PALETTE.low.fill };
const GLYPH: Record<RagBand, string> = { high: "▲", medium: "◆", low: "●" };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function heading(from: [number, number], to: [number, number]) { return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI + 90; }

// Real region posture polygons: join each server region (by name) onto the
// canonical KSA boundary from @/lib/ksa-regions and carry its aggregate band.
// Regions that fail to resolve are simply omitted — no fabricated geometry.
function regionPolygons(regions: LiveRegion[], canonical: KsaRegionCollection | null): GeoJSON.FeatureCollection {
  if (!canonical) return { type: "FeatureCollection", features: [] };
  const bandById = new Map<string, RagBand>();
  for (const region of regions) {
    const id = resolveRegionId(region.name);
    if (id) bandById.set(id, region.posture);
  }
  return {
    type: "FeatureCollection",
    features: canonical.features.flatMap(feature => {
      const band = bandById.get(feature.properties.id);
      return band ? [{ ...feature, properties: { id: feature.properties.id, band } }] : [];
    }),
  };
}

function projected(inspectors: LiveInspector[], tick: number, reduce: boolean) {
  return inspectors.map(ins => {
    const drift = reduce ? 0 : ((tick * 0.006 + ins.seed) % 1) * (1 - ins.baseFraction);
    const fraction = ins.state === "on_the_way" ? Math.min(0.985, ins.baseFraction + drift) : 1;
    const pos: [number, number] = [lerp(ins.originLat, ins.destLat, fraction), lerp(ins.originLng, ins.destLng, fraction)];
    return { ins, fraction, pos, heading: heading([ins.originLat, ins.originLng], [ins.destLat, ins.destLng]) };
  });
}

const setSource = (map: mapboxgl.Map, id: string, data: GeoJSON.FeatureCollection) =>
  (map.getSource(id) as mapboxgl.GeoJSONSource | undefined)?.setData(data);

// Tick-driven: factories, moving inspectors and their projected routes.
function updateSources(map: mapboxgl.Map, factories: LiveFactory[], moving: ReturnType<typeof projected>) {
  const factoryData: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: factories.map(factory => ({
    type: "Feature", properties: { id: factory.id, rawId: factory.rawId, name: factory.name, context: factory.city ?? factory.region ?? "", band: factory.band, glyph: GLYPH[factory.band] },
    geometry: { type: "Point", coordinates: [factory.lng, factory.lat] },
  })) };
  const inspectorData: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: moving.map(({ ins, pos, heading: bearing, fraction }) => ({
    type: "Feature", properties: { factoryId: ins.factoryId, inspector: ins.inspector, state: ins.stateLabel, factory: ins.factoryName, eta: Math.max(1, Math.round((1 - fraction) * ins.etaMin)), bearing },
    geometry: { type: "Point", coordinates: [pos[1], pos[0]] },
  })) };
  const routeData: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: "FeatureCollection", features: moving.flatMap(({ ins, pos }) => ins.state !== "on_the_way" ? [] : [{
    type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [[ins.originLng, ins.originLat], [pos[1], pos[0]]] },
  }]) };
  setSource(map, FACTORY_SOURCE, factoryData); setSource(map, INSPECTOR_SOURCE, inspectorData); setSource(map, ROUTE_SOURCE, routeData);
}

// Region-change-driven (NOT per tick): real posture polygons + centroid labels.
function updateRegions(map: mapboxgl.Map, regions: LiveRegion[], canonical: KsaRegionCollection | null) {
  const regionLabels: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: regions.map(region => ({
    type: "Feature", properties: { label: `${GLYPH[region.posture]} ${region.name.toUpperCase()}`, band: region.posture }, geometry: { type: "Point", coordinates: [region.lng, region.lat] },
  })) };
  setSource(map, REGION_SOURCE, regionPolygons(regions, canonical)); setSource(map, REGION_LABEL_SOURCE, regionLabels);
}

function installLayers(map: mapboxgl.Map) {
  for (const id of [FACTORY_SOURCE, REGION_SOURCE, REGION_LABEL_SOURCE, INSPECTOR_SOURCE, ROUTE_SOURCE]) map.addSource(id, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  const color = ["match", ["get", "band"], "high", COLOR.high, "medium", COLOR.medium, COLOR.low] as mapboxgl.Expression;
  map.addLayer({ id: "ops-regions-fill", type: "fill", source: REGION_SOURCE, slot: "top", paint: { "fill-color": color, "fill-opacity": 0.1 } });
  map.addLayer({ id: "ops-regions-line", type: "line", source: REGION_SOURCE, slot: "top", paint: { "line-color": color, "line-width": 1.5 } });
  map.addLayer({ id: "ops-projected-routes-line", type: "line", source: ROUTE_SOURCE, slot: "top", paint: { "line-color": MAP_PALETTE.info, "line-width": 1.5, "line-opacity": 0.55, "line-dasharray": [2, 6] } });
  map.addLayer({ id: FACTORY_LAYER, type: "symbol", source: FACTORY_SOURCE, slot: "top", layout: { "text-field": ["get", "glyph"], "text-size": 24, "text-allow-overlap": true }, paint: { "text-color": color, "text-halo-color": MAP_PALETTE.halo, "text-halo-width": 1.5 } });
  map.addLayer({ id: "ops-inspectors-symbol", type: "symbol", source: INSPECTOR_SOURCE, slot: "top", layout: { "text-field": "➤", "text-size": 24, "text-rotate": ["get", "bearing"], "text-allow-overlap": true }, paint: { "text-color": MAP_PALETTE.primary, "text-halo-color": MAP_PALETTE.halo, "text-halo-width": 1.5 } });
  map.addLayer({ id: "ops-region-labels", type: "symbol", source: REGION_LABEL_SOURCE, slot: "top", layout: { "text-field": ["get", "label"], "text-size": 11, "text-font": ["Open Sans Bold"], "text-allow-overlap": true }, paint: { "text-color": color, "text-halo-color": MAP_PALETTE.halo, "text-halo-width": 1 } });
}

export type LiveMapStrings = { unavailable: string; notConfigured: string; ariaLabel: string };

export default function LiveMapInner({ factories, regions, inspectors, selectedId, onSelect, strings: s }: {
  factories: LiveFactory[]; regions: LiveRegion[]; inspectors: LiveInspector[]; selectedId: string | null; onSelect: (id: string | null) => void;
  strings: LiveMapStrings;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const canonicalRef = useRef<KsaRegionCollection | null>(null);
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
      updateSources(map, next.factories, projected(next.inspectors, next.tick, next.reduce));
      updateRegions(map, next.regions, canonicalRef.current);
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
    updateSources(map, factories, projected(inspectors, tick, reduce));
  }, [factories, inspectors, reduce, tick]);

  // Canonical region boundaries load once; re-join whenever the posture set
  // changes. Not tick-driven — the polygons are static, only the band updates.
  useEffect(() => {
    let alive = true;
    loadKsaRegions().then(collection => {
      if (!alive) return;
      canonicalRef.current = collection;
      const map = mapRef.current;
      if (map?.isStyleLoaded()) updateRegions(map, latest.current.regions, collection);
    }).catch(() => { /* region layer optional; the ops map renders without it */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) updateRegions(map, regions, canonicalRef.current);
  }, [regions]);

  if (!token || failed) return <div className="ax-state" role="status" data-map-provider="mapbox-unavailable"><span className="ax-state__glyph">⌖</span><h4>{s.unavailable}</h4><p className="t-caption">{s.notConfigured}</p></div>;
  return <div ref={containerRef} aria-label={s.ariaLabel} data-map-provider="mapbox" style={{ blockSize: "100%", inlineSize: "100%", background: "var(--ax-color-canvas)" }} />;
}
