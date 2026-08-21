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
import FieldConnectivityBanner from "@/components/field/FieldConnectivityBanner";
import EmptyState from "@/components/EmptyState";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import styles from "./travel.module.css";

// Mapbox GL is browser-only → the shared GeoMap is loaded ssr:false, exactly as
// FieldFullMap does. GeoMap owns its own governed "Map service unavailable"
// fail-state (data-map-provider="mapbox-unavailable") when the token is absent.
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <div className={`sq-skeleton ${styles.mapFrame}`} />,
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
  continueCheckin: string;
  connectivityOffline: string; connectivityWeak: string;
  updated: string; updatedAgo: string; updatedNow: string;
  fenceWithin: string; fenceOutside: string; fenceLocating: string; fenceMapAria: string;
  fenceFactoryOverride: string; fenceEngineDefault: string;
  fenceNotConfigured: string; fenceUnconfiguredChip: string; fenceUnconfiguredNote: string;
  aiRouteNote: string;
};

type LatLng = { lat: number; lng: number };
type Fix = { lat: number; lng: number; acc: number; speed: number | null; ts: number };

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
  visitId, exists, destination, factoryName, factoryTone, fenceRadiusM, fenceSource,
  backHref, langHref, langLabel, strings,
}: {
  visitId: string;
  exists: boolean;
  destination: LatLng | null;
  factoryName: string;
  factoryTone: GeoTone;
  /** Governed geofence radius: factory override (SB20) → ENG-06 engine default.
   *  `null` = neither source is governed. It is NEVER substituted with a code
   *  constant here: an ungoverned fence renders as "N/A", draws no
   *  ring and produces no in/out verdict. */
  fenceRadiusM: number | null;
  /** Which governed source supplied fenceRadiusM, so the screen can state the
   *  provenance the Startup check-in card already states. */
  fenceSource: "factory" | "engine" | null;
  backHref: string;
  langHref: string;
  langLabel: string;
  strings: TravelStrings;
}) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [eta, setEta] = useState<{ minutes: number; distanceM: number } | null>(null);
  const [etaUnavailable, setEtaUnavailable] = useState(false);
  const [nowTs, setNowTs] = useState(0);
  // Initialised true so server render and first client paint agree; corrected
  // from navigator.onLine on mount and kept current via the online/offline
  // events. The road ETA is a network fact, so losing connectivity must revert
  // it immediately — not only when the next throttled fetch happens to fail.
  const [online, setOnline] = useState(true);
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
        setFix({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, speed: p.coords.speed, ts: p.timestamp });
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [destination]);

  // Honest location-freshness clock. GPS is device hardware and keeps fixing
  // even offline, so a growing "updated N ago" is the only truthful signal that
  // the shown position has stalled — we never invent a policy "stale" cutoff,
  // we just show the real elapsed time since the last fix.
  useEffect(() => {
    if (!fix) return;
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [fix]);

  // Live connectivity — GPS keeps working offline, but the road ETA/distance
  // cannot be current without the network, so we track it and gate the route
  // display below on it.
  useEffect(() => {
    const sync = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

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
  // A range verdict is only possible when a fence radius is genuinely governed.
  // With no governed radius there is nothing to compare against, so the screen
  // asserts neither "within" nor "outside" (zero-assumption rule) — the
  // governed check-in (M04-004) remains the surface that decides arrival.
  const fenceGoverned = fenceRadiusM != null;
  const inRange = fenceGoverned && straightM != null && straightM <= fenceRadiusM;
  const fenceProvenance = fenceSource === "factory"
    ? strings.fenceFactoryOverride
    : fenceSource === "engine" ? strings.fenceEngineDefault : null;

  const markers: GeoMarkerData[] = useMemo(() => {
    const list: GeoMarkerData[] = [];
    // radiusM omitted when the fence is ungoverned → no ring is drawn rather
    // than a ring at an invented radius.
    if (destination) list.push({ id: "establishment", lat: destination.lat, lng: destination.lng, label: factoryName, tone: factoryTone, ...(fenceRadiusM != null ? { radiusM: fenceRadiusM } : {}) });
    if (fix) list.push({ id: "you", lat: fix.lat, lng: fix.lng, label: strings.youLabel, tone: "neutral" });
    return list;
  }, [destination, fix, factoryName, factoryTone, fenceRadiusM, strings.youLabel]);

  // The design's second map is the geofence check at fence scale: the same
  // real markers, but framed on the establishment + its governed ring rather
  // than fitted to the whole route. Never a schematic — same Mapbox basemap
  // and the same real KSA region layer as every other field map.
  const fenceCenter: [number, number] | null = destination ? [destination.lat, destination.lng] : null;

  const center: [number, number] = destination
    ? [destination.lat, destination.lng]
    : fix ? [fix.lat, fix.lng] : KSA_CENTER;

  // Distance stat prefers the real road-network distance from routing; falls
  // back to the honest straight-line metres when routing is unavailable. The
  // road ETA/distance are only ever shown while routing is genuinely live —
  // once the provider is unavailable (or the device is offline) we must NOT
  // keep presenting the last figures as if current (the "never fabricate ETA"
  // contract), so ETA reverts to a dash and distance to the live straight line.
  const routeLive = eta != null && !etaUnavailable && online;
  const distanceLabel = routeLive
    ? `${(eta.distanceM / 1000).toFixed(1)} ${strings.kmUnit}`
    : straightM != null ? `${Math.round(straightM)} ${strings.mUnit}` : strings.dash;
  const etaLabel = routeLive ? `${eta.minutes} ${strings.minUnit}` : strings.dash;
  const speedLabel = fix && fix.speed != null && fix.speed >= 0
    ? `${Math.round(fix.speed * 3.6)} ${strings.kmhUnit}` : strings.dash;
  const accuracyLabel = fix ? `±${Math.round(fix.acc)} ${strings.mUnit}` : strings.dash;

  // Truthful elapsed time since the last real GPS fix (0 s until the first
  // second elapses); never rendered when there is no fix at all.
  const freshnessLabel = fix
    ? (() => {
        const secs = Math.max(0, Math.round((nowTs - fix.ts) / 1000));
        return secs <= 0 ? strings.updatedNow : fmt(strings.updatedAgo, { n: secs });
      })()
    : strings.dash;

  // Native navigation handoff for the iPad field device (Apple Maps driving
  // directions to the official coordinates only — never a fabricated point).
  // With no governed fence the badge stays informational: the journey state is
  // real ("En Route" — the inspector has not checked in), but no range verdict
  // is implied by its tone.
  const stateBadge = !destination || geoDenied
    ? "badge-warning"
    : straightM == null || !fenceGoverned ? "badge-info" : inRange ? "badge-compliant" : "badge-warning";
  const stateLabel = straightM == null || !destination ? strings.stateLocating : inRange ? strings.stateArrived : strings.stateEnRoute;

  const header = (
    <FieldHeader
      leading={back}
      title={strings.title}
      subtitle={exists && factoryName ? factoryName : undefined}
      right={<span className={`badge ${stateBadge}`}>{stateLabel}</span>}
      langHref={langHref} langLabel={langLabel}
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
        {/* Honest connectivity: offline/weak network only stalls the road ETA;
            device GPS and the geofence range below stay live. */}
        <FieldConnectivityBanner offline={strings.connectivityOffline} weak={strings.connectivityWeak} />
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
                  <div className={`id-code ${styles.statValue}`} data-testid="travel-eta">{etaLabel}</div>
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

              {/* Fence-scale verification map + live verdict chip. Real Mapbox
                  basemap, real governed ring, real fix — the design's
                  dotted-grid schematic is deliberately not reproduced. */}
              {fenceCenter && (
                <div className={styles.fenceFrame}>
                  <span
                    className={`${styles.fenceChip} ${straightM == null || !fenceGoverned ? styles.chipWait : inRange ? styles.chipOk : styles.chipOut}`}
                    data-fence-governed={fenceGoverned ? "true" : "false"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.chipGlyph} aria-hidden="true">
                      {straightM == null || !fenceGoverned
                        ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
                        : inRange
                          ? <path d="M20 6 9 17l-5-5" />
                          : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>}
                    </svg>
                    {/* No governed radius → the chip states that, never a verdict. */}
                    {!fenceGoverned
                      ? strings.fenceUnconfiguredChip
                      : straightM == null
                        ? strings.fenceLocating
                        : fmt(inRange ? strings.fenceWithin : strings.fenceOutside, { d: Math.round(straightM) })}
                  </span>
                  <GeoMap
                    center={fenceCenter}
                    zoom={15}
                    markers={markers}
                    height="100%"
                    interactive={false}
                    ariaLabel={strings.fenceMapAria}
                  />
                </div>
              )}

              {!destination ? null
                : geoDenied ? (
                  <div className={`${styles.rangeNote} ${styles.rangeWarn}`}>{strings.geoUnavailableNote}</div>
                ) : !fenceGoverned ? (
                  // Neither SB20 factory override nor the ENG-06 engine default
                  // resolved: state that plainly instead of measuring against a
                  // number no one governed.
                  <div className={`${styles.rangeNote} ${styles.rangeInfo}`} data-testid="travel-fence-unconfigured">
                    {strings.fenceUnconfiguredNote}
                  </div>
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
                    {fmt(strings.outOfRangeNote, { r: fenceRadiusM ?? "" })}
                  </div>
                )}
              <div className={`t-caption ${styles.metaRow}`}>
                {/* Radius + its governance provenance, or an explicit
                    "N/A" — never a bare plausible number. */}
                <span data-testid="travel-fence-radius">
                  {strings.geofenceRadius}:{" "}
                  {fenceRadiusM != null
                    ? <><span className="id-code">{fenceRadiusM} {strings.mUnit}</span>{fenceProvenance ? <> {fenceProvenance}</> : null}</>
                    : <span>{strings.fenceNotConfigured}</span>}
                </span>
                <span>{strings.accuracy}: <span className="id-code">{accuracyLabel}</span></span>
                {straightM != null && <span>{strings.straightLine}: <span className="id-code">{Math.round(straightM)} {strings.mUnit}</span></span>}
                {fix && <span data-testid="travel-freshness">{strings.updated}: <span className="id-code">{freshnessLabel}</span></span>}
              </div>
            </section>
            <section className={`${styles.card} ${styles.advisory}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.advisoryGlyph} aria-hidden="true">
                <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
              </svg>
              <span>{strings.aiRouteNote}</span>
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
          <span className={styles.footerSpacer} />
          <Link href={backHref} prefetch={false} className={`btn btn-primary ${styles.footerAction}`}>{strings.continueCheckin}</Link>
        </div>
      </div>
    </>
  );
}
