"use client";

// WA-DES-034-C3: fixed, read-only operational markers. This renderer contains
// no route line, ETA, path animation, polling or GPS claim.
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import { MAP_PALETTE } from "@/lib/map-palette";
import {
  loadKsaRegions,
  resolveRegionId,
  type KsaRegionCollection,
} from "@/lib/ksa-regions";

const KSA_CENTER: [number, number] = [24.2, 45.1];
const KSA_ZOOM = 6;
const FACTORY_SOURCE = "ops-live-factories";
const REGION_SOURCE = "ops-live-regions";
const REGION_LABEL_SOURCE = "ops-live-region-labels";
const INSPECTOR_SOURCE = "ops-live-inspectors";
const FACTORY_LAYER = "ops-live-factories-layer";
const INSPECTOR_LAYER = "ops-live-inspectors-layer";

function regionPolygons(
  regions: LiveRegion[],
  canonical: KsaRegionCollection | null
): GeoJSON.FeatureCollection {
  if (!canonical) return { type: "FeatureCollection", features: [] };
  const visibleRegionIds = new Set(
    regions.map((region) => resolveRegionId(region.name)).filter(Boolean)
  );
  return {
    type: "FeatureCollection",
    features: canonical.features.filter((feature) =>
      visibleRegionIds.has(feature.properties.id)
    ),
  };
}

const setSource = (
  map: mapboxgl.Map,
  id: string,
  data: GeoJSON.FeatureCollection
) => (map.getSource(id) as mapboxgl.GeoJSONSource | undefined)?.setData(data);

function updateSources(
  map: mapboxgl.Map,
  factories: LiveFactory[],
  regions: LiveRegion[],
  inspectors: LiveInspector[],
  selectedId: string | null,
  canonical: KsaRegionCollection | null
) {
  const factoryData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: factories.map((factory) => ({
      type: "Feature",
      properties: {
        id: factory.id,
        name: factory.name,
        context: factory.city ?? factory.region ?? "",
      },
      geometry: { type: "Point", coordinates: [factory.lng, factory.lat] },
    })),
  };
  const inspectorData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: inspectors
      .filter((inspector) => inspector.lat != null && inspector.lng != null)
      .map((inspector) => ({
        type: "Feature",
        properties: {
          id: inspector.id,
          inspector: inspector.inspector,
          state: inspector.stateLabel,
          factory: inspector.factoryName,
          positionSource: inspector.positionSourceLabel ?? "",
          positionObservedAt: inspector.positionObservedAt ?? "",
          selected: inspector.id === selectedId,
        },
        geometry: {
          type: "Point",
          coordinates: [inspector.lng!, inspector.lat!],
        },
      })),
  };
  const regionLabels: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: regions.map((region) => ({
      type: "Feature",
      properties: { label: region.name },
      geometry: { type: "Point", coordinates: [region.lng, region.lat] },
    })),
  };
  setSource(map, FACTORY_SOURCE, factoryData);
  setSource(map, INSPECTOR_SOURCE, inspectorData);
  setSource(map, REGION_SOURCE, regionPolygons(regions, canonical));
  setSource(map, REGION_LABEL_SOURCE, regionLabels);
}

function installLayers(map: mapboxgl.Map) {
  for (const id of [
    FACTORY_SOURCE,
    REGION_SOURCE,
    REGION_LABEL_SOURCE,
    INSPECTOR_SOURCE,
  ]) {
    map.addSource(id, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  map.addLayer({
    id: "ops-live-regions-fill",
    type: "fill",
    source: REGION_SOURCE,
    slot: "top",
    paint: { "fill-color": MAP_PALETTE.neutral.fill, "fill-opacity": 0.06 },
  });
  map.addLayer({
    id: "ops-live-regions-line",
    type: "line",
    source: REGION_SOURCE,
    slot: "top",
    paint: {
      "line-color": MAP_PALETTE.neutral.stroke,
      "line-width": 1.25,
      "line-opacity": 0.55,
    },
  });
  map.addLayer({
    id: FACTORY_LAYER,
    type: "circle",
    source: FACTORY_SOURCE,
    slot: "top",
    paint: {
      "circle-radius": 6,
      "circle-color": MAP_PALETTE.neutral.fill,
      "circle-stroke-color": MAP_PALETTE.halo,
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: INSPECTOR_LAYER,
    type: "circle",
    source: INSPECTOR_SOURCE,
    slot: "top",
    paint: {
      "circle-radius": ["case", ["boolean", ["get", "selected"], false], 10, 8],
      "circle-color": MAP_PALETTE.primary,
      "circle-stroke-color": MAP_PALETTE.halo,
      "circle-stroke-width": [
        "case",
        ["boolean", ["get", "selected"], false],
        4,
        2,
      ],
    },
  });
  map.addLayer({
    id: "ops-live-region-labels",
    type: "symbol",
    source: REGION_LABEL_SOURCE,
    slot: "top",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": ["Open Sans Bold"],
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": MAP_PALETTE.neutral.stroke,
      "text-halo-color": MAP_PALETTE.halo,
      "text-halo-width": 1,
    },
  });
}

export type LiveMapStrings = {
  unavailable: string;
  notConfigured: string;
  ariaLabel: string;
};

export default function LiveMapInner({
  factories,
  regions,
  inspectors,
  selectedId,
  onSelect,
  onProviderFailure,
  strings: s,
}: {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onProviderFailure: () => void;
  strings: LiveMapStrings;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  console.log("tokennn mapbox", token);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const canonicalRef = useRef<KsaRegionCollection | null>(null);
  const latest = useRef({
    factories,
    regions,
    inspectors,
    selectedId,
    onSelect,
    onProviderFailure,
  });
  latest.current = {
    factories,
    regions,
    inspectors,
    selectedId,
    onSelect,
    onProviderFailure,
  };

  useEffect(() => {
    if (!token) {
      onProviderFailure();
      return;
    }
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      accessToken: token,
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [KSA_CENTER[1], KSA_CENTER[0]],
      zoom: KSA_ZOOM,
      minZoom: 5,
      maxZoom: 11,
      language: document.documentElement.lang === "ar" ? "ar" : "en",
      config: { basemap: { lightPreset: "day", show3dObjects: false } },
    });
    mapRef.current = map;
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    const providerTimeout = window.setTimeout(
      () => latest.current.onProviderFailure(),
      12_000
    );
    const onLoad = () => {
      window.clearTimeout(providerTimeout);
      installLayers(map);
      const current = latest.current;
      updateSources(
        map,
        current.factories,
        current.regions,
        current.inspectors,
        current.selectedId,
        canonicalRef.current
      );
      map.on("click", FACTORY_LAYER, (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        new mapboxgl.Popup()
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setText(
            `${String(feature.properties?.name ?? "")}\n${String(
              feature.properties?.context ?? ""
            )}`
          )
          .addTo(map);
      });
      map.on("click", INSPECTOR_LAYER, (event) => {
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const id = String(feature.properties?.id ?? "");
        if (!id) return;
        latest.current.onSelect(id);
        new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setText(
            [
              String(feature.properties?.inspector ?? ""),
              String(feature.properties?.factory ?? ""),
              String(feature.properties?.state ?? ""),
              String(feature.properties?.positionSource ?? ""),
              String(feature.properties?.positionObservedAt ?? ""),
            ]
              .filter(Boolean)
              .join("\n")
          )
          .addTo(map);
      });
      for (const layer of [FACTORY_LAYER, INSPECTOR_LAYER]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    };
    const onError = () => {
      window.clearTimeout(providerTimeout);
      latest.current.onProviderFailure();
    };
    map.on("load", onLoad);
    map.on("error", onError);
    return () => {
      window.clearTimeout(providerTimeout);
      map.off("load", onLoad);
      map.off("error", onError);
      map.remove();
      mapRef.current = null;
    };
  }, [onProviderFailure, token]);

  useEffect(() => {
    let alive = true;
    loadKsaRegions()
      .then((collection) => {
        if (!alive) return;
        canonicalRef.current = collection;
        const map = mapRef.current;
        if (map?.isStyleLoaded()) {
          updateSources(
            map,
            factories,
            regions,
            inspectors,
            selectedId,
            collection
          );
        }
      })
      .catch(() => {
        /* Basemap and point markers remain usable without region polygons. */
      });
    return () => {
      alive = false;
    };
  }, [factories, inspectors, regions, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      updateSources(
        map,
        factories,
        regions,
        inspectors,
        selectedId,
        canonicalRef.current
      );
    }
  }, [factories, inspectors, regions, selectedId]);

  if (!token) {
    return (
      <div
        className="sq-state"
        role="status"
        data-map-provider="mapbox-unavailable"
      >
        <span className="sq-state__glyph">⌖</span>
        <h4>{s.unavailable}</h4>
        <p className="t-caption">{s.notConfigured}</p>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      aria-label={s.ariaLabel}
      data-map-provider="mapbox"
      style={{
        blockSize: "100%",
        inlineSize: "100%",
        background: "var(--surface-canvas)",
      }}
    />
  );
}
