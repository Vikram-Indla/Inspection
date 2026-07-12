"use client";
// SCR-WEB-500 (live prototype) — the FlightRadar-style national operations
// view. Browser-only (react-leaflet v5), loaded via next/dynamic ssr:false
// from LiveOps.tsx. Three layers over a theme-aware basemap:
//   1. Region RAG zones — aggregate inspection posture per region.
//   2. Factory pins — real names, toned + SHAPED by risk band (colourblind-safe).
//   3. Inspectors — en-route visits animated along a PROJECTED route toward
//      their target factory. This is a projection of the visit window, NOT
//      live GPS telemetry (DEC-002 is open) — labelled as such in the legend.
// All colours resolve from ax tokens (GLOBAL COLOR LAW); no bare values.
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, Tooltip } from "react-leaflet";
// (Tooltip used for factory/inspector hovers; Circle for RAG zones.)
import "leaflet/dist/leaflet.css";
import type { LiveFactory, LiveRegion, LiveInspector, RagBand } from "./types";

const KSA_CENTER: [number, number] = [24.2, 45.1];
const KSA_ZOOM = 6;

const BAND_TOKEN: Record<RagBand, string> = {
  high: "--ax-color-critical",
  medium: "--ax-color-warning",
  low: "--ax-color-success",
};
// Colourblind-safe: band is carried by SHAPE as well as hue.
const BAND_GLYPH: Record<RagBand, string> = { high: "▲", medium: "◆", low: "●" };

type Tokens = Record<RagBand, string> & { primary: string; surface: string; muted: string };

function useTokens(): Tokens | null {
  const [tok, setTok] = useState<Tokens | null>(null);
  useEffect(() => {
    const read = (): Tokens => {
      const cs = getComputedStyle(document.documentElement);
      const g = (v: string) => cs.getPropertyValue(v).trim();
      return {
        high: g(BAND_TOKEN.high), medium: g(BAND_TOKEN.medium), low: g(BAND_TOKEN.low),
        primary: g("--ax-color-primary"), surface: g("--ax-color-surface"),
        muted: g("--ax-color-text-secondary"),
      };
    };
    setTok(read());
    // Re-resolve when the theme toggles (data-theme flips on <html>).
    const obs = new MutationObserver(() => setTok(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return tok;
}

// Theme-aware CARTO basemap — dark matter under the dark theme, light under
// light. Same external-tile posture already used by GeoMap (OSM).
function useBasemap(): string {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const resolve = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light") return false;
      if (attr === "dark") return true;
      return !window.matchMedia?.("(prefers-color-scheme: light)").matches;
    };
    setDark(resolve());
    const obs = new MutationObserver(() => setDark(resolve()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
}

function factoryIcon(band: RagBand, color: string, surface: string, selected: boolean) {
  const size = selected ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;inline-size:${size}px;block-size:${size}px;border-radius:var(--ax-radius-full);background:${surface};border:2px solid ${color};box-shadow:var(--ax-shadow-raised);color:${color};font:700 ${size * 0.5}px/1 system-ui;">${BAND_GLYPH[band]}</span>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function zoneIcon(region: LiveRegion, color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;padding:2px 8px;border-radius:var(--ax-radius-full);background:${color};color:var(--ax-color-inverse-text);font:700 11px/1.4 var(--ax-font-mono);box-shadow:var(--ax-shadow-raised);">${BAND_GLYPH[region.posture]} ${region.name.toUpperCase()}</span>`,
    iconSize: [10, 10], iconAnchor: [0, 0],
  });
}

// A little swept-wing glyph, rotated to the travel heading, for a moving
// inspector. currentColor = primary (violet) so it reads as "our asset".
function inspectorIcon(headingDeg: number, color: string, surface: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;inline-size:26px;block-size:26px;border-radius:var(--ax-radius-full);background:${surface};border:1.5px solid ${color};box-shadow:var(--ax-shadow-raised);">
      <svg width="14" height="14" viewBox="0 0 24 24" style="transform:rotate(${headingDeg}deg);color:${color}" fill="currentColor"><path d="M12 2 4 21l8-4 8 4z"/></svg></span>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function heading(from: [number, number], to: [number, number]) {
  return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI + 90;
}

export default function LiveMapInner({
  factories, regions, inspectors, selectedId, onSelect,
}: {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const tok = useTokens();
  const url = useBasemap();

  // Animation clock — a 0..1 progress each inspector maps onto its route.
  // Frozen for reduced-motion users; otherwise advances ~4%/tick (2.5s loop).
  const reduce = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [tick, setTick] = useState(0);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (reduce) return;
    raf.current = setInterval(() => setTick(t => t + 1), 100);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [reduce]);

  const moving = useMemo(() => inspectors.map(ins => {
    // base fraction from the visit window; en-route pins creep forward from it.
    const drift = reduce ? 0 : ((tick * 0.006 + ins.seed) % 1) * (1 - ins.baseFraction);
    const f = ins.state === "on_the_way"
      ? Math.min(0.985, ins.baseFraction + drift)
      : 1; // arrived / executing sit on the factory
    const pos: [number, number] = [lerp(ins.originLat, ins.destLat, f), lerp(ins.originLng, ins.destLng, f)];
    const head = heading([ins.originLat, ins.originLng], [ins.destLat, ins.destLng]);
    return { ins, pos, head, f };
  }), [inspectors, tick, reduce]);

  if (!tok) return null;
  const bandColor = (b: RagBand) => tok[b];

  return (
    <MapContainer center={KSA_CENTER} zoom={KSA_ZOOM} minZoom={5} maxZoom={11}
      scrollWheelZoom style={{ blockSize: "100%", inlineSize: "100%", background: "var(--ax-color-canvas)" }}>
      <TileLayer url={url} subdomains="abcd"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />

      {/* Layer 1 — region RAG zones */}
      {regions.map(r => (
        <Circle key={`z:${r.id}`} center={[r.lat, r.lng]} radius={r.radiusM}
          pathOptions={{ color: bandColor(r.posture), weight: 1.5, fillColor: bandColor(r.posture), fillOpacity: 0.1 }} />
      ))}
      {regions.map(r => (
        <Marker key={`zl:${r.id}`} position={[r.lat, r.lng]} icon={zoneIcon(r, bandColor(r.posture))}
          eventHandlers={{ click: () => onSelect(null) }} />
      ))}

      {/* Layer 2 — factories (real names, shaped by band) */}
      {factories.map(f => (
        <Marker key={f.id} position={[f.lat, f.lng]}
          icon={factoryIcon(f.band, bandColor(f.band), tok.surface, f.id === selectedId)}
          eventHandlers={{ click: () => onSelect(f.id) }}>
          <Popup>
            <strong>{f.name}</strong><br />
            <span style={{ color: "var(--ax-color-text-secondary)" }}>{f.city ?? f.region ?? ""}</span><br />
            {f.riskScore != null && <>Risk {f.riskScore} · </>}<a href={`/factories/${f.rawId}`}>Open Factory 360 →</a>
          </Popup>
        </Marker>
      ))}

      {/* Layer 3 — inspectors on projected routes */}
      {moving.map(({ ins, pos, head, f }) => (
        <div key={ins.id}>
          {ins.state === "on_the_way" && (
            <Polyline positions={[[ins.originLat, ins.originLng], pos]}
              pathOptions={{ color: tok.primary, weight: 1.5, dashArray: "2 6", opacity: 0.55 }} />
          )}
          <Marker position={pos} icon={inspectorIcon(head, tok.primary, tok.surface)}
            eventHandlers={{ click: () => onSelect(ins.factoryId) }}>
            <Tooltip direction="top" offset={[0, -12]}>
              <strong>{ins.inspector}</strong> · {ins.stateLabel}
              {ins.state === "on_the_way" && <> · ETA ~{Math.max(1, Math.round((1 - f) * ins.etaMin))}m</>}
              <br /><span style={{ color: "var(--ax-color-text-secondary)" }}>{ins.factoryName}</span>
            </Tooltip>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
}
