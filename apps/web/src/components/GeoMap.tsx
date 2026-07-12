"use client";
// G-MAP — reusable geofencing map (SB20 · ENG-08 · STM-JRN-003).
// react-leaflet v5 is browser-only: ALWAYS import this component via
// next/dynamic with ssr:false from a client component.
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

// Tone → ax design token (tokens.css). No bare colors in this file.
const TONE_TOKEN: Record<GeoTone, string> = {
  high: "--ax-color-critical",
  medium: "--ax-color-warning",
  low: "--ax-color-success",
  neutral: "--ax-color-text-secondary",
};

// Leaflet's default image markers break under bundlers — use a divIcon dot
// styled with ax tokens instead (primary dot on surface-colored border).
function dotIcon(tone: GeoTone, selected: boolean) {
  const size = selected ? 18 : 14;
  const bg = tone === "neutral" ? "var(--ax-color-primary)" : `var(${TONE_TOKEN[tone]})`;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;inline-size:${size}px;block-size:${size}px;border-radius:var(--ax-radius-full);background:${bg};border:2px solid var(--ax-color-surface);box-shadow:var(--ax-shadow-raised);"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ focus }: { focus?: GeoFocus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom ?? map.getZoom(), { duration: 0.6 });
  }, [focus, map]);
  return null;
}

// Smart fence editing: with a marker selected, clicking the map sets the fence
// edge at that point (radius = geodesic distance official pin → click).
function RadiusEditor({ markers, selectedId, onRadiusChange }: {
  markers: GeoMarkerData[];
  selectedId?: string | null;
  onRadiusChange?: (id: string, radiusM: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (!onRadiusChange || !selectedId) return;
      const m = markers.find(x => x.id === selectedId);
      if (!m) return;
      onRadiusChange(selectedId, Math.round(map.distance(e.latlng, L.latLng(m.lat, m.lng))));
    },
  });
  return null;
}

export default function GeoMap({
  center, zoom, markers, height = "100%", selectedId, focus, onMarkerClick, onRadiusChange, interactive = true,
}: {
  center: [number, number];
  zoom: number;
  markers: GeoMarkerData[];
  /** CSS block-size of the map (parent must size it when "100%"). */
  height?: string | number;
  selectedId?: string | null;
  focus?: GeoFocus;
  onMarkerClick?: (id: string) => void;
  /** Fired when the user clicks the map with a marker selected — proposed new radius in metres. */
  onRadiusChange?: (id: string, radiusM: number) => void;
  /** false for read-only placements (e.g. the public landing coverage map) — no pan/zoom/click. */
  interactive?: boolean;
}) {
  // Leaflet paths are SVG and need concrete stroke values, so ax tokens are
  // resolved once via getComputedStyle — source stays token-only.
  const [tones, setTones] = useState<Record<GeoTone, string> | null>(null);
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setTones({
      high: cs.getPropertyValue(TONE_TOKEN.high).trim(),
      medium: cs.getPropertyValue(TONE_TOKEN.medium).trim(),
      low: cs.getPropertyValue(TONE_TOKEN.low).trim(),
      neutral: cs.getPropertyValue(TONE_TOKEN.neutral).trim(),
    });
  }, []);

  return (
    <div style={{ blockSize: height, inlineSize: "100%" }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={interactive} dragging={interactive}
        zoomControl={interactive} doubleClickZoom={interactive} touchZoom={interactive} boxZoom={interactive} keyboard={interactive}
        style={{ blockSize: "100%", inlineSize: "100%" }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Geofence rings — dashed, tone-colored (STM-JRN-003) */}
        {tones && markers.filter(m => (m.radiusM ?? 0) > 0).map(m => (
          <Circle
            key={`fence-${m.id}`}
            center={[m.lat, m.lng]}
            radius={m.radiusM as number}
            pathOptions={{
              color: tones[m.tone],
              weight: m.id === selectedId ? 3 : 2,
              dashArray: "6 6",
              fillColor: tones[m.tone],
              fillOpacity: 0.08,
            }}
          />
        ))}
        {markers.map(m => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={dotIcon(m.tone, m.id === selectedId)}
            eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : undefined}
          >
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        <FlyTo focus={focus} />
        <RadiusEditor markers={markers} selectedId={selectedId} onRadiusChange={onRadiusChange} />
      </MapContainer>
    </div>
  );
}
