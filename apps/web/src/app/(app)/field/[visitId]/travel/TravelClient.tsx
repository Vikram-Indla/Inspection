"use client";

// SAQEEL Field Travel — client shell for the "Journey to Site" screen. Owns the
// browser Geolocation watch, the live GeoMap markers, the real road-network
// ETA/distance fetch (/api/routing/eta) and the honest geofence in/out-of-range
// status. It NEVER fabricates position, ETA, speed, distance or radius, and it
// NEVER records arrival: "Continue to check-in" links to the governed Startup
// flow at /field/[visitId] (M04-004), which owns the arrival gate.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import FieldHeader from "@/components/field/FieldHeader";
import EmptyState from "@/components/EmptyState";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import styles from "./travel.module.css";

// Mapbox GL is browser-only → the shared GeoMap is loaded ssr:false, exactly as
// FieldFullMap does. GeoMap owns its own governed "Map service unavailable"
// fail-state (data-map-provider="mapbox-unavailable") when the token is absent.
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <div className="ax-skeleton" style={{ blockSize: "100%", minBlockSize: 240 }} />,
});

export type TravelStrings = {
  title: string; back: string;
  stateEnRoute: string; stateArrived: string; stateLocating: string;
  liveGps: string; eta: string; distance: string; speed: string;
  minUnit: string; kmUnit: string; mUnit: string; kmhUnit: string; dash: string;
  geofenceTitle: string; inRangeNote: string; outOfRangeNote: string;
  locatingNote: string; geoUnavailableNote: string;
  geofenceRadius: string; accuracy: string; straightLine: string;
  etaUnavailable: string; noCoords: string; noCoordsBody: string;
  notFound: string; notFoundBody: string; youLabel: string; mapAria: string;
  continueCheckin: string; checkinCaption: string;
};

type LatLng = { lat: number; lng: number };
type Fix = { lat: number; lng: number; acc: number; speed: number | null };

// Haversine straight-line metres — identical to the governed distM in
// Startup.tsx (M04-004). Used only for the honest geofence range display; the
// real check-in decision remains server/Startup-owned.
function distM(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));

// KSA national centre fallback ([lat, lng]) — only used before a fix exists and
// when no destination is on file; never a fabricated marker.
const KSA_CENTER: [number, number] = [23.8859, 45.0792];

export default function TravelClient({
  visitId, exists, destination, factoryName, factoryTone, fenceRadiusM,
  backHref, langHref, langLabel, themeLabels, strings,
}: {
  visitId: string;
  exists: boolean;
  destination: LatLng | null;
  factoryName: string;
  factoryTone: GeoTone;
  fenceRadiusM: number;
  backHref: string;
  langHref: string;
  langLabel: string;
  themeLabels: { toLight: string; toDark: string };
  strings: TravelStrings;
}) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [eta, setEta] = useState<{ minutes: number; distanceM: number } | null>(null);
  const [etaUnavailable, setEtaUnavailable] = useState(false);
  const lastEtaAtRef = useRef(0);

  const back = (
    <Link href={backHref} prefetch={false} className="btn btn-icon btn-ghost" aria-label={strings.back}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional>
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Link>
  );

  // Real browser Geolocation watch — no synthetic coordinates. Only live fixes
  // ever populate position, speed and accuracy.
  useEffect(() => {
    if (!destination || typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoDenied(!destination ? false : true);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      p => {
        setGeoDenied(false);
        setFix({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, speed: p.coords.speed });
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [destination]);

  // Real road-network ETA/distance from the server Mapbox Directions endpoint.
  // Throttled to at most once every 20 s per fix; honest unavailable state on
  // any non-ok/provider-unavailable response (never an invented ETA).
  useEffect(() => {
    if (!fix || !destination) return;
    const now = Date.now();
    if (now - lastEtaAtRef.current < 20_000 && eta) return;
    lastEtaAtRef.current = now;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/routing/eta", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: { lat: fix.lat, lng: fix.lng }, destination }),
        });
        const result = await res.json() as { status?: string; etaMinutes?: number; distanceMeters?: number };
        if (cancelled) return;
        if (!res.ok || result.status !== "ok" || result.etaMinutes == null || result.distanceMeters == null) {
          setEtaUnavailable(true);
          return;
        }
        setEtaUnavailable(false);
        setEta({ minutes: result.etaMinutes, distanceM: result.distanceMeters });
      } catch {
        if (!cancelled) setEtaUnavailable(true);
      }
    })();
    return () => { cancelled = true; };
  }, [fix, destination, eta]);

  const straightM = useMemo(
    () => (fix && destination ? distM(fix, destination) : null),
    [fix, destination],
  );
  const inRange = straightM != null && straightM <= fenceRadiusM;

  const markers: GeoMarkerData[] = useMemo(() => {
    const list: GeoMarkerData[] = [];
    if (destination) list.push({ id: "establishment", lat: destination.lat, lng: destination.lng, label: factoryName, tone: factoryTone, radiusM: fenceRadiusM });
    if (fix) list.push({ id: "you", lat: fix.lat, lng: fix.lng, label: strings.youLabel, tone: "neutral" });
    return list;
  }, [destination, fix, factoryName, factoryTone, fenceRadiusM, strings.youLabel]);

  const center: [number, number] = destination
    ? [destination.lat, destination.lng]
    : fix ? [fix.lat, fix.lng] : KSA_CENTER;

  // Distance stat prefers the real road-network distance from routing; falls
  // back to the honest straight-line metres when routing is unavailable.
  const distanceLabel = eta
    ? `${(eta.distanceM / 1000).toFixed(1)} ${strings.kmUnit}`
    : straightM != null ? `${Math.round(straightM)} ${strings.mUnit}` : strings.dash;
  const etaLabel = eta ? `${eta.minutes} ${strings.minUnit}` : strings.dash;
  const speedLabel = fix && fix.speed != null && fix.speed >= 0
    ? `${Math.round(fix.speed * 3.6)} ${strings.kmhUnit}` : strings.dash;
  const accuracyLabel = fix ? `±${Math.round(fix.acc)} ${strings.mUnit}` : strings.dash;

  const stateBadge = !destination || geoDenied
    ? "badge-warning"
    : straightM == null ? "badge-info" : inRange ? "badge-compliant" : "badge-warning";
  const stateLabel = straightM == null || !destination ? strings.stateLocating : inRange ? strings.stateArrived : strings.stateEnRoute;

  const header = (
    <FieldHeader
      leading={back}
      title={strings.title}
      subtitle={exists && factoryName ? factoryName : undefined}
      right={<span className={`badge ${stateBadge}`}>{stateLabel}</span>}
      langHref={langHref} langLabel={langLabel} themeLabels={themeLabels}
    />
  );

  if (!exists) {
    return (
      <>
        {header}
        <div className={styles.page}>
          <EmptyState glyph="∅" title={strings.notFound} body={strings.notFoundBody} />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className={styles.page}>
        {destination ? (
          <>
            {/* Live route map (shared Mapbox GeoMap) + real ETA/distance/speed. */}
            <section className={styles.card}>
              <div className={styles.mapFrame}>
                <GeoMap
                  center={center}
                  zoom={fix ? 13 : 12}
                  markers={markers}
                  fitMarkers
                  height="100%"
                  interactive
                  ariaLabel={strings.mapAria}
                />
                <span className={styles.mapChip}>{strings.liveGps}</span>
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={`id-code ${styles.statValue}`}>{etaLabel}</div>
                  <div className="t-caption">{strings.eta}</div>
                </div>
                <div className={styles.stat}>
                  <div className={`id-code ${styles.statValue}`}>{distanceLabel}</div>
                  <div className="t-caption">{strings.distance}</div>
                </div>
                <div className={styles.stat}>
                  <div className={`id-code ${styles.statValue}`}>{speedLabel}</div>
                  <div className="t-caption">{strings.speed}</div>
                </div>
              </div>
              {etaUnavailable && (
                <p className={`t-caption ${styles.etaNote}`}>{strings.etaUnavailable}</p>
              )}
            </section>

            {/* Honest geofence range status — display only. */}
            <section className={`${styles.card} ${styles.pad}`}>
              <div className={styles.cardHead}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.shield} aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5.5 3.5 9.5 8 11 4.5-1.5 8-5.5 8-11V5z" />
                </svg>
                <span className={styles.cardTitle}>{strings.geofenceTitle}</span>
              </div>
              {!destination ? null
                : geoDenied ? (
                  <div className={`${styles.rangeNote} ${styles.rangeWarn}`}>{strings.geoUnavailableNote}</div>
                ) : straightM == null ? (
                  <div className={`${styles.rangeNote} ${styles.rangeInfo}`}>{strings.locatingNote}</div>
                ) : inRange ? (
                  <div className={`${styles.rangeNote} ${styles.rangeOk}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.noteGlyph} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                    {strings.inRangeNote}
                  </div>
                ) : (
                  <div className={`${styles.rangeNote} ${styles.rangeWarn}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.noteGlyph} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                    {fmt(strings.outOfRangeNote, { r: fenceRadiusM })}
                  </div>
                )}
              <div className={`t-caption ${styles.metaRow}`}>
                <span>{strings.geofenceRadius}: <span className="id-code">{fenceRadiusM} {strings.mUnit}</span></span>
                <span>{strings.accuracy}: <span className="id-code">{accuracyLabel}</span></span>
                {straightM != null && <span>{strings.straightLine}: <span className="id-code">{Math.round(straightM)} {strings.mUnit}</span></span>}
              </div>
            </section>
          </>
        ) : (
          // No official coordinates on file → no honest route/geofence to show.
          <EmptyState glyph="⌖" title={strings.noCoords} body={strings.noCoordsBody} />
        )}
      </div>

      {/* Display-and-navigate only: links to the governed Startup check-in flow
          (M04-004). No state mutation, no parallel arrival path. */}
      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <Link href={backHref} prefetch={false} className="btn btn-primary btn-block">{strings.continueCheckin}</Link>
          <p className={`t-caption ${styles.checkinCaption}`}>{strings.checkinCaption}</p>
        </div>
      </div>
    </>
  );
}
