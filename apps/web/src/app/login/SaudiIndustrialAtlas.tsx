"use client";

// CD-001 V7 Atlas — the approved public-safe artwork remains the primary
// login experience. If that asset cannot load, the interactive fallback uses
// the platform Mapbox renderer; Leaflet is intentionally not retained.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";
import { NODES, type AtlasNode, type AtlasStageId } from "./saudi-atlas-locations";
import SaudiAtlasDossier, { type DossierStrings } from "./SaudiAtlasDossier";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });
const PUBLIC_SAFE_ATLAS_BASE = "/brand/saudi-atlas/inspection-atlas-public-safe-v1";
const IMAGE_POSITIONS: Record<string, { x: number; y: number }> = {
  hail: { x: 39.0, y: 17.5 }, qassim: { x: 43.5, y: 32.0 }, "ras-al-khair": { x: 65.3, y: 14.0 }, jubail: { x: 73.7, y: 32.5 }, dammam: { x: 64.2, y: 35.5 }, riyadh: { x: 50.8, y: 47.0 }, yanbu: { x: 22.0, y: 42.0 }, jeddah: { x: 20.5, y: 68.0 }, jazan: { x: 44.0, y: 78.5 },
};
const STAGE_POSITIONS: Record<AtlasStageId, { x: number; y: number }> = {
  plan: IMAGE_POSITIONS.riyadh, travel: { x: 59.0, y: 39.5 }, arrive: IMAGE_POSITIONS.jubail, inspect: IMAGE_POSITIONS.jubail, review: IMAGE_POSITIONS["ras-al-khair"], decide: IMAGE_POSITIONS.riyadh,
};
const ZONES: { en: string; ar: string; x: number; y: number }[] = [
  { en: "NORTHERN ZONE", ar: "المنطقة الشمالية", x: 32, y: 11 }, { en: "WESTERN ZONE", ar: "المنطقة الغربية", x: 18, y: 27 }, { en: "CENTRAL ZONE", ar: "المنطقة الوسطى", x: 39, y: 45 }, { en: "EASTERN ZONE", ar: "المنطقة الشرقية", x: 72, y: 51 }, { en: "SOUTHERN ZONE", ar: "المنطقة الجنوبية", x: 51, y: 74 },
];

function StageGlyph({ stage }: { stage: AtlasStageId }) {
  if (stage === "plan") return <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>;
  if (stage === "travel") return <svg viewBox="0 0 24 24"><path d="M3 16V9l4-3h9l3 4h2v6Z"/><circle cx="8" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
  if (stage === "arrive") return <svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
  if (stage === "inspect") return <svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 12l2 2 5-5M8 18h8"/></svg>;
  if (stage === "review") return <svg viewBox="0 0 24 24"><path d="M4 5h16v14H4Z"/><path d="M8 9h8M8 13h5M15 16l1.5 1.5L20 14"/></svg>;
  return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 6-7"/></svg>;
}

function stageNode(stage: AtlasStageId) { return stage === "travel" ? "qassim" : stage === "arrive" || stage === "inspect" ? "jubail" : stage === "review" ? "ras-al-khair" : "riyadh"; }

type AtlasProps = { locale: "ar" | "en"; activeStage: AtlasStageId; dossierStrings: DossierStrings; onInteractingChange: (interacting: boolean) => void; onFail: () => void };

function MapboxAtlasFallback({ locale, activeStage, dossierStrings, onInteractingChange }: AtlasProps) {
  const [locked, setLocked] = useState<AtlasNode | null>(null);
  const activeNode = stageNode(activeStage);
  useEffect(() => { onInteractingChange(locked !== null); }, [locked, onInteractingChange]);
  const markers: GeoMarkerData[] = NODES.map(node => ({ id: node.id, lat: node.lat, lng: node.lng, label: node.name[locale], tone: node.id === activeNode ? "neutral" : "low" }));
  return <div className="lg-atlas-image" data-atlas-mode="mapbox-fallback">
    <div style={{ blockSize: 430 }}><GeoMap center={[24.2, 45.1]} zoom={5} markers={markers} height="100%" onMarkerClick={id => setLocked(NODES.find(node => node.id === id) ?? null)} /></div>
    <SaudiAtlasDossier node={locked} locked={locked !== null} locale={locale} strings={dossierStrings} onClose={() => setLocked(null)} />
  </div>;
}

function PublicSafeImageAtlas({ locale, activeStage, dossierStrings, onInteractingChange, onImageError }: AtlasProps & { onImageError: () => void }) {
  const [hover, setHover] = useState<AtlasNode | null>(null);
  const [locked, setLocked] = useState<AtlasNode | null>(null);
  const [ready, setReady] = useState(false);
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const shown = locked ?? hover;
  const activeNode = stageNode(activeStage);
  const stagePosition = STAGE_POSITIONS[activeStage];
  const shownPosition = shown ? IMAGE_POSITIONS[shown.id] : undefined;
  useEffect(() => { onInteractingChange(shown !== null); }, [shown, onInteractingChange]);
  const closeLocked = () => { const id = locked?.id; setLocked(null); if (id) requestAnimationFrame(() => refs.current.get(id)?.focus()); };
  return <div className={`lg-atlas-image${ready ? " is-ready" : ""}`} data-atlas-mode="public-safe-image">
    <div className="lg-atlas-image__plane">
      <picture><source srcSet={`${PUBLIC_SAFE_ATLAS_BASE}.avif`} type="image/avif" /><img className="lg-atlas-image__media" src={`${PUBLIC_SAFE_ATLAS_BASE}.webp`} width="1672" height="941" alt="" decoding="async" draggable={false} onLoad={() => setReady(true)} onError={onImageError} /></picture>
      <div className="lg-atlas-image__hotspots" aria-label={dossierStrings.mapLabel}>
        {NODES.map(node => {
          const position = IMAGE_POSITIONS[node.id]; if (!position) return null;
          const style = { left: `${position.x}%`, top: `${position.y}%` } as CSSProperties;
          return <button key={node.id} ref={el => { if (el) refs.current.set(node.id, el); }} type="button" className={`lg-atlas-image__hotspot lg-atlas-image__hotspot--${node.halo}${activeNode === node.id ? " is-active" : ""}`} style={style} aria-label={`${node.name[locale]}, ${node.industry[locale]}. ${node.sampleState[locale]}`} aria-pressed={locked?.id === node.id} onMouseEnter={() => setHover(node)} onMouseLeave={() => setHover(current => current?.id === node.id ? null : current)} onFocus={() => setHover(node)} onBlur={() => setHover(current => current?.id === node.id ? null : current)} onClick={() => setLocked(node)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setLocked(null); event.currentTarget.blur(); } }}>
            <span className="lg-atlas-image__hotspot-core" aria-hidden="true" /><span className={`lg-atlas-image__hotspot-label lg-atlas-image__hotspot-label--${locale} lg-atlas-image__hotspot-label--${node.labelPos ?? "below"}`}>{node.name[locale]}</span>
          </button>;
        })}
      </div>
      <div className={`lg-atlas-image__zones lg-atlas-image__zones--${locale}`} aria-hidden="true">{ZONES.map(zone => <span key={zone.en} style={{ left: `${zone.x}%`, top: `${zone.y}%` }}>{zone[locale]}</span>)}</div>
      <div key={activeStage} className={`lg-atlas-image__stage-signal lg-atlas-image__stage-signal--${activeStage}`} style={{ left: `${stagePosition.x}%`, top: `${stagePosition.y}%` }} aria-hidden="true"><StageGlyph stage={activeStage} /></div>
    </div>
    <SaudiAtlasDossier node={shown} locked={locked !== null} locale={locale} strings={dossierStrings} onClose={closeLocked} placement={shownPosition && shownPosition.x > 55 ? "left" : "right"} />
  </div>;
}

export default function SaudiIndustrialAtlas(props: AtlasProps) {
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  useEffect(() => { if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) setUseMapboxFallback(true); }, []);
  if (useMapboxFallback) return <MapboxAtlasFallback {...props} />;
  return <PublicSafeImageAtlas {...props} onImageError={() => setUseMapboxFallback(true)} />;
}
